/**
 * Move-In Service
 *
 * Validates payment data and executes move-in
 */

const unitsHelper = require("../units/units.helper");
const costService = require("../sitelink/cost.service");
const tenantService = require("../tenant/tenant.service");
const client = require("../shared/client");
const { logInfo, logError } = require("../../middleware/logger");
const { ValidationError, NotFoundError } = require("../../utils/errors");
const {
	MOVE_IN_ERROR_CODES,
	PAYMENT_METHODS,
	DEFAULTS,
	ESIGN_CONFIG,
} = require("./move-in.constants");
const {
	mapCardTypeToId,
	convertExpirationDateToISO,
	buildBillingName,
} = require("./move-in.helpers");
const { getLocationSlug } = require("../../config/locations");

/**
 * Validate unit availability and discount in one call
 * Re-fetches unit info to ensure it's still available and validates discount
 *
 * @param {number} unitId - Unit ID to validate
 * @param {number|null} concessionId - Discount ID (-999 or null for no discount)
 * @param {string} locationCode - Location code
 * @returns {Promise<object>} Unit information if valid
 * @throws {NotFoundError} If unit not found or not available
 * @throws {ValidationError} If discount is invalid or doesn't apply
 */
async function validateUnitAvailabilityAndDiscount(
	unitId,
	concessionId,
	locationCode
) {
	logInfo("MoveInService", "Validating unit availability and discount", {
		unitId,
		concessionId,
	});

	// Get unit with all applicable discounts
	const unitInfo = await unitsHelper.validateAndGetUnitWithDiscounts(
		unitId,
		locationCode,
		true
	);

	// If no discount requested, we're done
	if (!concessionId || concessionId === DEFAULTS.CONCESSION_PLAN_ID) {
		logInfo("MoveInService", "No discount to validate");
		return unitInfo;
	}

	// Check if the requested discount is in the list of applicable discounts
	const isDiscountApplicable = unitInfo.applicableDiscounts.some(
		(d) => parseInt(d.concessionId) === parseInt(concessionId)
	);

	if (!isDiscountApplicable) {
		throw new ValidationError(
			`Discount ${concessionId} is not available for this unit`
		);
	}

	logInfo("MoveInService", "Unit and discount validated", {
		unitId,
		concessionId,
	});

	return unitInfo;
}

/**
 * Validate cost calculation
 * Re-calculates cost to ensure price hasn't changed
 *
 * @param {object} params - Cost calculation parameters
 * @param {number} params.unitId - Unit ID
 * @param {string} params.moveInDate - Move-in date (ISO format)
 * @param {number} params.insuranceCoverageId - Insurance ID (-999 for none)
 * @param {number} params.concessionPlanId - Discount ID (-999 for none)
 * @param {number} params.expectedTotal - Expected total from frontend
 * @param {string} locationCode - Location code
 * @returns {Promise<object>} Cost breakdown if valid
 * @throws {ValidationError} If price has changed
 */
async function validateCost(params, locationCode) {
	logInfo("MoveInService", "Validating cost", {
		unitId: params.unitId,
		expectedTotal: params.expectedTotal,
	});

	// Re-calculate cost
	const costResult = await costService.retrieveMoveInCost(
		{
			unitId: params.unitId,
			moveInDate: params.moveInDate,
			insuranceCoverageId:
				params.insuranceCoverageId || DEFAULTS.INSURANCE_COVERAGE_ID,
			concessionPlanId:
				params.concessionPlanId || DEFAULTS.CONCESSION_PLAN_ID,
		},
		locationCode
	);

	// Compare with expected total (allow 0.01 difference for rounding)
	const actualTotal = costResult.summary.totalDueAtMoveIn;
	const expectedTotal = parseFloat(params.expectedTotal);
	const difference = Math.abs(actualTotal - expectedTotal);

	if (difference > 0.01) {
		throw new ValidationError(
			`Price has changed. Expected $${expectedTotal.toFixed(
				2
			)}, but actual is $${actualTotal.toFixed(2)}`
		);
	}

	logInfo("MoveInService", "Cost is valid", { actualTotal, expectedTotal });
	return costResult;
}

/**
 * Build SiteLink move-in arguments
 *
 * @param {object} params - Move-in parameters
 * @param {object} costResult - Cost calculation result
 * @returns {object} SiteLink SOAP arguments
 */
function buildMoveInArgs(params, costResult) {
	// Extract dates from the first required charge
	const firstCharge =
		costResult.charges.find((c) => c.isRequiredAtMoveIn) ||
		costResult.charges[0];

	// Map card type string to ID and convert expiration date
	const creditCardType = mapCardTypeToId(params.creditCardType);
	const expirationDateISO = convertExpirationDateToISO(
		params.creditCardExpirationDate
	);
	const billingName = buildBillingName(params.firstName, params.lastName);

	return {
		TenantID: parseInt(params.tenantId),
		sAccessCode: params.gateCode || "",
		UnitID: params.unitId,
		dStartDate: firstCharge.startDate,
		dEndDate: firstCharge.endDate,
		dcPaymentAmount: params.paymentAmount,
		iCreditCardType: creditCardType,
		sCreditCardNumber: params.creditCardNumber || "",
		sCreditCardCVV: params.creditCardCVV || "",
		sCCTrack2: "",
		dExpirationDate: expirationDateISO,
		sBillingName: billingName,
		sBillingAddress: params.billingAddress || "",
		sBillingZipCode: params.billingZipCode || "",
		InsuranceCoverageID:
			params.insuranceCoverageId || DEFAULTS.INSURANCE_COVERAGE_ID,
		ConcessionPlanID:
			params.concessionPlanId || DEFAULTS.CONCESSION_PLAN_ID,
		iSource: DEFAULTS.SOURCE,
		sSource: DEFAULTS.SOURCE_NAME,
		bUsePushRate: false,
		iPayMethod: PAYMENT_METHODS.CREDIT_CARD,
		sABARoutingNum: "",
		sAccountNum: "",
		iAccountType: DEFAULTS.ACCOUNT_TYPE,
		iKeypadZoneID: DEFAULTS.KEYPAD_ZONE_ID,
		iTimeZoneID: DEFAULTS.TIME_ZONE_ID,
		iBillingFrequency: DEFAULTS.BILLING_FREQUENCY,
		WaitingID:
			params.reservationWaitingId || DEFAULTS.RESERVATION_WAITING_ID,
		ChannelType: DEFAULTS.CHANNEL_TYPE,
		bTestMode: true, // Test mode enabled - credit card will not be processed
	};
}

/**
 * Execute move-in (MoveInWithDiscount_v5)
 *
 * @param {object} params - Move-in parameters
 * @param {object} costResult - Cost calculation result
 * @param {string} locationCode - Location code
 * @returns {Promise<object>} Move-in result
 * @throws {ValidationError} If move-in fails
 */
async function executeMoveIn(params, costResult, locationCode) {
	logInfo("MoveInService", "Executing move-in", {
		tenantId: params.tenantId,
		unitId: params.unitId,
	});

	const args = buildMoveInArgs(params, costResult);

	const response = await client.callMethod(
		"MoveInWithDiscount_v5",
		args,
		"callCenter",
		locationCode
	);

	// Response returns LedgerID in retCode (positive number)
	// Or error code if negative
	if (response.retCode < 0) {
		const errorMsg =
			MOVE_IN_ERROR_CODES[String(response.retCode)] ||
			response.retMsg ||
			"Unknown error";
		throw new ValidationError(
			`Move-in failed: ${errorMsg} (Code: ${response.retCode})`
		);
	}

	logInfo("MoveInService", "Move-in completed", {
		tenantId: params.tenantId,
		ledgerId: response.retCode,
	});

	// Extract lease number from response data
	let leaseNumber = null;
	if (response.data) {
		if (Array.isArray(response.data)) {
			leaseNumber = response.data[0];
		} else if (typeof response.data === 'object' && response.data.RT) {
			// Handle XML parsed structure
			leaseNumber = response.data.RT.iLeaseNum || null;
		} else {
			leaseNumber = response.data;
		}
	}

	return {
		ledgerId: response.retCode, // Positive number = LedgerID for the new tenant
		leaseNumber,
		success: true,
		message: "Move-in completed successfully",
		rawResponse: response,
	};
}

/**
 * Complete move-in flow with validations
 *
 * @param {object} data - Move-in data
 * @param {boolean} [data.enableAutopay=false] - Si se debe configurar autopay
 * @param {string} locationCode - Location code
 * @returns {Promise<object>} Complete move-in result
 */
async function processMoveIn(data, locationCode) {
	logInfo("MoveInService", "Starting move-in flow", {
		unitId: data.unitId,
		email: data?.email,
		firstName: data?.firstName,
		lastName: data?.lastName,
		phone: data?.phone,
		enableAutopay: data?.enableAutopay || false,
	});

	// Step 1: Validate unit availability and discount in one call
	const unitInfo = await validateUnitAvailabilityAndDiscount(
		data.unitId,
		data.concessionPlanId,
		locationCode
	);

	// Step 2: Validate cost
	const costResult = await validateCost(
		{
			unitId: data.unitId,
			moveInDate: data.moveInDate,
			insuranceCoverageId: data.insuranceCoverageId,
			concessionPlanId: data.concessionPlanId,
			expectedTotal: data.expectedTotal,
		},
		locationCode
	);

	// Step 3: Create tenant
	const tenantResult = await tenantService.createTenant(
		{
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone,
		},
		locationCode
	);

	logInfo("MoveInService", "Tenant created", {
		tenantId: tenantResult.tenantId,
		tenantIdType: typeof tenantResult.tenantId,
		accessCode: tenantResult.accessCode,
	});

	// Step 4: Execute move-in
	const moveInResult = await executeMoveIn(
		{
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone,
			creditCardType: data.creditCardType,
			creditCardNumber: data.creditCardNumber,
			creditCardCVV: data.creditCardCVV,
			creditCardExpirationDate: data.creditCardExpirationDate,
			billingAddress: data.billingAddress,
			billingZipCode: data.billingZipCode,
			tenantId: tenantResult.tenantId,
			gateCode: tenantResult.accessCode,
			unitId: data.unitId,
			paymentAmount: costResult.summary.totalDueAtMoveIn,
			insuranceCoverageId: data.insuranceCoverageId,
			concessionPlanId: data.concessionPlanId,
		},
		costResult,
		locationCode
	);

	logInfo("MoveInService", "Move-in flow completed", {
		tenantId: tenantResult.tenantId,
		ledgerId: moveInResult.ledgerId,
	});

	// Step 5: Setup autopay if requested
	if (data.enableAutopay === true) {
		logInfo("MoveInService", "Setting up autopay", {
			ledgerId: moveInResult.ledgerId,
		});

		const expirationDateISO = convertExpirationDateToISO(
			data.creditCardExpirationDate
		);
		const billingName = buildBillingName(data.firstName, data.lastName);
		const creditCardType = 0;

		await costService.setupAutopay(
			{
				ledgerId: moveInResult.ledgerId,
				creditCardType,
				creditCardNumber: data.creditCardNumber,
				creditCardExpirationDate: expirationDateISO,
				billingName,
				billingAddress: data.billingAddress,
				billingZipCode: data.billingZipCode,
			},
			locationCode
		);

		logInfo("MoveInService", "Autopay configured", {
			ledgerId: moveInResult.ledgerId,
		});
	}

	// Step 6: Create e-sign URL for lease signing
	logInfo("MoveInService", "Creating e-sign URL", {
		tenantId: tenantResult.tenantId,
		ledgerId: moveInResult.ledgerId,
	});

	// Extract first charge for move-in date
	const firstCharge =
		costResult.charges.find((c) => c.isRequiredAtMoveIn) ||
		costResult.charges[0];

	// Build dynamic return URL with location slug and moveInDate
	const locationSlug = getLocationSlug(locationCode);
	if (!locationSlug) {
		throw new ValidationError(`Invalid location code: ${locationCode}`);
	}
	const returnUrl = `${ESIGN_CONFIG.RETURN_BASE_URL}/storage/${locationSlug}/rent/sign-complete?moveInDate=${firstCharge.startDate}&unitId=${data.unitId}&totalPaid=${costResult.summary.totalDueAtMoveIn}`;

	const eSignResult = await createESignLeaseUrl(
		{
			tenantId: tenantResult.tenantId,
			ledgerId: moveInResult.ledgerId,
			returnUrl,
			formIds: ESIGN_CONFIG.FORM_IDS,
		},
		locationCode
	);

	const eSignUrl = eSignResult.eSignUrl;

	logInfo("MoveInService", "E-sign URL created", {
		tenantId: tenantResult.tenantId,
		ledgerId: moveInResult.ledgerId,
	});

	return {
		ledgerId: moveInResult.ledgerId,
		leaseNumber: moveInResult.leaseNumber,
		tenantId: tenantResult.tenantId,
		accessCode: tenantResult.accessCode,
		unitId: data.unitId,
		unitName: unitInfo.unitName || unitInfo.name,
		totalPaid: costResult.summary.totalDueAtMoveIn,
		moveInDate: firstCharge.startDate,
		autopayEnabled: data.enableAutopay || false,
		eSignUrl,
		success: true,
	};
}

/**
 * Create e-sign URL for lease signing
 *
 * @param {object} params - E-sign parameters
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.ledgerId - Ledger ID
 * @param {string} params.returnUrl - URL to redirect after signing
 * @param {string} [params.formIds=''] - Optional comma-delimited form IDs
 * @param {string} locationCode - Location code
 * @returns {Promise<object>} E-sign result with URL
 * @throws {ValidationError} If e-sign creation fails
 */
async function createESignLeaseUrl(params, locationCode) {
	logInfo("MoveInService", "Creating e-sign lease URL", {
		tenantId: params.tenantId,
		ledgerId: params.ledgerId,
	});

	const response = await client.callMethod(
		"SiteLinkeSignCreateLeaseURL_v2",
		{
			iTenantID: parseInt(params.tenantId),
			iLedgerID: parseInt(params.ledgerId),
			sFormIdsCommaDelimited: params.formIds || "",
			sReturnUrl: params.returnUrl,
		},
		"callCenter",
		locationCode
	);

	// Response returns the e-sign URL in retMsg when retCode is positive (1 = success)
	if (response.retCode <= 0) {
		const errorMsg = response.retMsg || "Failed to create e-sign URL";
		throw new ValidationError(
			`E-sign creation failed: ${errorMsg} (Code: ${response.retCode})`
		);
	}

	// Extract URL from retMsg
	const eSignUrl = response.retMsg;

	if (!eSignUrl || typeof eSignUrl !== "string") {
		throw new ValidationError(
			"E-sign URL not returned from SiteLink"
		);
	}

	logInfo("MoveInService", "E-sign URL created", {
		tenantId: params.tenantId,
		ledgerId: params.ledgerId,
		urlLength: eSignUrl.length,
	});

	return {
		eSignUrl,
		tenantId: params.tenantId,
		ledgerId: params.ledgerId,
		returnUrl: params.returnUrl,
		success: true,
	};
}

module.exports = {
	validateUnitAvailabilityAndDiscount,
	validateCost,
	executeMoveIn,
	processMoveIn,
	createESignLeaseUrl,
};
