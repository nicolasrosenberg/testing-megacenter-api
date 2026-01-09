/**
 * Payments Service
 *
 * Validates payment data and executes move-in
 */

const unitsHelper = require("../units/units.helper");
const costService = require("../sitelink/cost.service");
const reservationsService = require("../reservations/reservations.service");
const client = require("../shared/client");
const { logInfo, logError } = require("../../middleware/logger");
const { ValidationError, NotFoundError } = require("../../utils/errors");

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
	logInfo("PaymentsService", "Validating unit availability and discount", {
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
	if (!concessionId || concessionId === -999) {
		logInfo("PaymentsService", "No discount to validate");
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

	logInfo("PaymentsService", "Unit and discount validated", {
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
	logInfo("PaymentsService", "Validating cost", {
		unitId: params.unitId,
		expectedTotal: params.expectedTotal,
	});

	// Re-calculate cost
	const costResult = await costService.retrieveMoveInCost(
		{
			unitId: params.unitId,
			moveInDate: params.moveInDate,
			insuranceCoverageId: params.insuranceCoverageId || -999,
			concessionPlanId: params.concessionPlanId || -999,
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

	logInfo("PaymentsService", "Cost is valid", { actualTotal, expectedTotal });
	return costResult;
}

/**
 * Execute move-in (MoveInWithDiscount_v5)
 *
 * @param {object} params - Move-in parameters
 * @param {number} params.tenantId - Tenant ID
 * @param {string} params.gateCode - Tenant's gate code/access code
 * @param {number} params.unitId - Unit ID
 * @param {string} params.moveInDate - Move-in date (ISO format)
 * @param {string} params.moveInEndDate - End date (ISO format)
 * @param {number} params.paymentAmount - Payment amount from MoveInCostRetrieve
 * @param {number} params.insuranceCoverageId - Insurance ID (-999 for none)
 * @param {number} params.concessionPlanId - Discount ID (-999 for none)
 * @param {number} params.reservationWaitingId - Reservation ID (-999 if no reservation)
 * @param {object} params.payment - Payment details
 * @param {number} params.payment.type - Payment type (0=Credit Card, 2=Cash, 3=Debit Card, 4=ACH)
 * @param {string} params.payment.cardNumber - Credit card number (digits only, no spaces/dashes)
 * @param {string} params.payment.cvv - CVV
 * @param {string} params.payment.expirationDate - Expiration date (MM/DD/YYYY)
 * @param {string} params.payment.billingName - Billing name
 * @param {string} params.payment.billingAddress - Billing address
 * @param {string} params.payment.billingZip - Billing zip code
 * @param {string} locationCode - Location code
 * @returns {Promise<object>} Move-in result
 */
async function executeMoveIn(params, locationCode) {
	logInfo("PaymentsService", "Executing move-in", {
		tenantId: params.tenantId,
		unitId: params.unitId,
	});

	// Detect credit card type from card number
	// Based on industry-standard BIN (Bank Identification Number) ranges
	function detectCardType(cardNumber) {
		const number = cardNumber.replace(/\s/g, '');

		// Visa: starts with 4
		if (/^4/.test(number)) {
			return 6; // VISA
		}
		// Mastercard: starts with 51-55 or 2221-2720
		if (/^5[1-5]/.test(number) || /^2(?:2(?:2[1-9]|[3-9])|[3-6]|7(?:[0-1]|20))/.test(number)) {
			return 5; // Master Card
		}
		// American Express: starts with 34 or 37
		if (/^3[47]/.test(number)) {
			return 7; // American Express
		}
		// Discover: starts with 6011, 622126-622925, 644-649, or 65
		if (/^6(?:011|5|4[4-9]|22(?:1(?:2[6-9]|[3-9])|[2-8]|9(?:[01]|2[0-5])))/.test(number)) {
			return 8; // Discover
		}
		// Diners Club: starts with 36, 38, or 300-305
		if (/^3(?:0[0-5]|[68])/.test(number)) {
			return 9; // Diners Club
		}

		// Default to Visa if unknown
		return 6;
	}

	const creditCardType = detectCardType(params.creditCardNumber || '');

	// Convert expiration date to ISO format YYYY-MM-DDT23:59:59
	// Supports MM/YY (credit card format) or MM/DD/YYYY
	let expirationDateISO = "";
	if (params.creditCardExpirationDate) {
		const parts = params.creditCardExpirationDate.split("/");

		if (parts.length === 2) {
			// MM/YY format (standard credit card expiration)
			const [month, year] = parts;
			const fullYear = year.length === 2 ? `20${year}` : year;
			// Use last day of the month at 23:59:59
			const lastDay = new Date(parseInt(fullYear), parseInt(month), 0).getDate();
			expirationDateISO = `${fullYear}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}T23:59:59`;
		} else if (parts.length === 3) {
			// MM/DD/YYYY format
			const [month, day, year] = parts;
			expirationDateISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59`;
		}
	}

	const args = {
		TenantID: parseInt(params.tenantId),
		sAccessCode: params.gateCode || "",
		UnitID: params.unitId,
		dStartDate: params.moveInDate,
		dEndDate: params.moveInEndDate,
		dcPaymentAmount: params.paymentAmount,
		iCreditCardType: creditCardType, // Auto-detected: 5=MC, 6=Visa, 7=Amex, 8=Discover, 9=Diners
		sCreditCardNumber: params.creditCardNumber || "",
		sCreditCardCVV: params.creditCardCVV || "",
		sCCTrack2: "",
		dExpirationDate: expirationDateISO,
		sBillingName: (params.firstName || "") + " " + (params.lastName || ""),
		sBillingAddress: params.billingAddress || "",
		sBillingZipCode: params.billingZipCode || "",
		InsuranceCoverageID: params.insuranceCoverageId || -999,
		ConcessionPlanID: params.concessionPlanId || -999,
		iSource: 5, // Website API
		sSource: "Website API",
		bUsePushRate: false,
		iPayMethod: 0, // 0 = Credit Card
		sABARoutingNum: "",
		sAccountNum: "",
		iAccountType: 1, // Consumer Checking (default)
		iKeypadZoneID: -1,
		iTimeZoneID: -1,
		iBillingFrequency: 3, // 3 = Monthly
		WaitingID: params.reservationWaitingId || -999,
		ChannelType: 1, // 1 = WebRate
		bTestMode: true, // Test mode enabled - credit card will not be processed
	};

	const response = await client.callMethod(
		"MoveInWithDiscount_v5",
		args,
		"callCenter",
		locationCode
	);

	// Response returns LedgerID in retCode (positive number)
	// Or error code if negative
	if (response.retCode < 0) {
		// Handle SiteLink error codes
		const errorMessages = {
			"-1": "Failed to save move in",
			"-2": "Unit ID is not available",
			"-3": "Unable to get insurance information/Invalid Insurance Coverage ID",
			"-4": "Unable to get Credit Card Type ID",
			"-5": "Unable to get payment Type ID",
			"-6": "Charge Description error",
			"-7": "Insurance category missing",
			"-8": "Administrative category missing",
			"-9": "Rent category missing",
			"-10": "Security category missing",
			"-11": "Payment amount does not match the required amount",
			"-12": "Get Time Zones data error",
			"-13": "Get Keypad Zones data error",
			"-14": "Credit Card number is invalid",
			"-17": "Unable to calculate Move In Cost/Invalid Concession Plan ID",
			"-20": "Site is not setup to use Authorize.Net or PPI PayMover",
			"-21": "No credit card configuration information found for this site",
			"-25": "Invalid unit ID",
			"-26": "Invalid keypad zone ID",
			"-27": "Invalid time zone ID",
			"-28": "Invalid billing frequency",
			"-29": "Invalid channel type",
			"-83": "Move in dates cannot exceed 2 months in the past",
			"-84": "Debit transactions require bTestMode = True",
			"-95": "Invalid TenantID",
			"-100": "Credit Card not being authorized",
		};

		const errorMsg =
			errorMessages[String(response.retCode)] ||
			response.retMsg ||
			"Unknown error";
		throw new ValidationError(
			`Move-in failed: ${errorMsg} (Code: ${response.retCode})`
		);
	}

	logInfo("PaymentsService", "Move-in completed", {
		tenantId: params.tenantId,
		ledgerId: response.retCode,
	});

	return {
		ledgerId: response.retCode, // Positive number = LedgerID for the new tenant
		leaseNumber: Array.isArray(response.data)
			? response.data[0]
			: response.data,
		success: true,
		message: "Move-in completed successfully",
		rawResponse: response,
	};
}

/**
 * Complete payment flow with validations
 *
 * @param {object} data - Payment data
 * @param {number} data.unitId - Unit ID
 * @param {string} data.moveInDate - Move-in date (ISO format)
 * @param {number} data.insuranceCoverageId - Insurance ID (-999 for none)
 * @param {number} data.concessionPlanId - Discount ID (-999 for none)
 * @param {number} data.reservationWaitingId - Reservation ID (optional, -999 if none)
 * @param {number} data.expectedTotal - Expected total from frontend
 * @param {string} data.tenant.firstName - First name
 * @param {string} data.lastName - Last name
 * @param {string} data.email - Email
 * @param {string} data.phone - Phone
 * @param {string} data.address - Address
 * @param {string} data.city - City
 * @param {string} data.state - State
 * @param {string} data.zipCode - Zip code
 * @param {object} data.payment - Payment details
 * @param {number} data.payment.type - Payment type (0=Credit Card, 2=Cash, 3=Debit Card, 4=ACH)
 * @param {string} data.payment.cardNumber - Credit card number (digits only)
 * @param {string} data.payment.cvv - CVV
 * @param {string} data.payment.expirationDate - Expiration date (MM/DD/YYYY)
 * @param {string} data.payment.billingName - Billing name
 * @param {string} data.payment.billingAddress - Billing address
 * @param {string} data.payment.billingZip - Billing zip code
 * @param {string} locationCode - Location code
 * @returns {Promise<object>} Complete payment result
 */
async function processPayment(data, locationCode) {
	logInfo("PaymentsService", "Starting payment flow", {
		unitId: data.unitId,
		email: data?.email,
		firstName: data?.firstName,
		lastName: data?.lastName,
		phone: data?.phone,
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
	const tenantResult = await reservationsService.createTenant(
		{
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone,
		},
		locationCode
	);

	logInfo("PaymentsService", "Tenant created", {
		tenantId: tenantResult.tenantId,
		tenantIdType: typeof tenantResult.tenantId,
		accessCode: tenantResult.accessCode,
	});

	// Step 4: Execute move-in
	// Extract dates from the first required charge in cost result
	const firstCharge =
		costResult.charges.find((c) => c.isRequiredAtMoveIn) ||
		costResult.charges[0];

	const moveInResult = await executeMoveIn(
		{
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone,
			creditCardNumber: data.creditCardNumber,
			creditCardCVV: data.creditCardCVV,
			creditCardExpirationDate: data.creditCardExpirationDate,
			billingAddress: data.billingAddress,
			billingZipCode: data.billingZipCode,
			tenantId: tenantResult.tenantId,
			gateCode: tenantResult.accessCode,
			unitId: data.unitId,
			moveInDate: firstCharge.startDate,
			moveInEndDate: firstCharge.endDate,
			paymentAmount: costResult.summary.totalDueAtMoveIn,
			insuranceCoverageId: data.insuranceCoverageId,
			concessionPlanId: data.concessionPlanId,
		},
		locationCode
	);

	logInfo("PaymentsService", "Payment flow completed", {
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
		success: true,
	};
}

module.exports = {
	validateUnitAvailabilityAndDiscount,
	validateCost,
	executeMoveIn,
	processPayment,
};
