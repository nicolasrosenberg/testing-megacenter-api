/**
 * Discounts Transformer
 *
 * Transforms discount data from SiteLink into clean, frontend-friendly format
 */

const config = require("../../config");
const { parseBoolean, parseDecimal, parseInt } = require("../../utils/parsers");
const discountsService = require("./discounts.service");

/**
 * Get discount type string from iAmtType
 * @param {number} iAmtType - SiteLink discount type
 * @returns {string} Discount type
 */
function getDiscountType(iAmtType) {
	switch (parseInt(iAmtType)) {
		case config.DISCOUNT_TYPES.AMOUNT_OFF:
			return "amount_off";
		case config.DISCOUNT_TYPES.PERCENTAGE_OFF:
			return "percentage_off";
		case config.DISCOUNT_TYPES.FIXED_RATE:
			return "fixed_rate";
		default:
			return "unknown";
	}
}

/**
 * Get discount value from concession plan
 * @param {object} discount - Raw discount from SiteLink
 * @returns {number} Discount value
 */
function getDiscountValue(discount) {
	const iAmtType = parseInt(discount.iAmtType);

	switch (iAmtType) {
		case config.DISCOUNT_TYPES.AMOUNT_OFF:
			return parseDecimal(discount.dcFixedDiscount);
		case config.DISCOUNT_TYPES.PERCENTAGE_OFF:
			return parseDecimal(discount.dcPCDiscount);
		case config.DISCOUNT_TYPES.FIXED_RATE:
			return parseDecimal(discount.dcChgAmt);
		default:
			return 0;
	}
}

/**
 * Generate display text for discount
 * @param {object} discount - Transformed discount
 * @returns {string} Display text
 */
function generateDiscountDisplayText(discount) {
	const month = Number(discount.appliesToMonth || 1);
	const months = Number(discount.expiresInMonths || 1);

	// --- discountPart (lo tuyo, casi igual) ---
	let discountPart = "";

	if (discount.type === "amount_off") {
		discountPart = `$${discount.value.toFixed(2)} OFF`;
	} else if (discount.type === "percentage_off") {
		const v = Number(discount.value);
		discountPart = v === 100 ? "FREE" : `${v}% OFF`;
	} else if (discount.type === "fixed_rate") {
		discountPart = `ONLY $${Number(discount.value).toFixed(2)}`;
	} else {
		discountPart = discount.name;
	}

	// --- timing/duration (arreglado) ---
	// 1) Duración 1 mes: se habla como "FIRST MONTH" o "MONTH N"
	if (months === 1) {
		const timingPart = month === 1 ? "FIRST MONTH" : `MONTH ${month}`;

		// si es 1 mes, NO agregues "FOR 1 MONTH" (redundante)
		// "FIRST MONTH FREE" / "MONTH 2 50% OFF"
		return `${timingPart} - ${discountPart}`.replace(/\s+/g, " ").trim();
	}

	// 2) Duración >1 mes:
	// - si parte en mes 1: "FIRST X MONTHS"
	// - si parte en mes N: "X MONTHS (FROM MONTH N)"
	const timingPart =
		month === 1
			? `FIRST ${months} MONTHS`
			: `${months} MONTHS (FROM MONTH ${month})`;

	return `${timingPart} - ${discountPart}`.replace(/\s+/g, " ").trim();
}

/**
 * Generate explanation for discount
 * @param {object} discount - Transformed discount
 * @returns {string} Explanation
 */
function generateDiscountExplanation(discount) {
	const monthText =
		discount.appliesToMonth > 0
			? ` in month ${discount.appliesToMonth}`
			: "";

	switch (discount.type) {
		case "amount_off":
			return `Save $${discount.value}${monthText}.`;
		case "percentage_off":
			if (discount.value === 100) {
				return `You don't pay the first month. You start paying from the second month.`;
			}
			return `Save ${discount.value}% off your rent${monthText}.`;
		case "fixed_rate":
			return `Pay only $${discount.value} for your first month.`;
		default:
			return discount.description || discount.name;
	}
}

/**
 * Transform discount plan from DiscountPlansRetrieve
 * @param {object} sitelinkDiscount - Raw discount from SiteLink
 * @returns {object} Transformed discount
 */
function transformDiscount(sitelinkDiscount) {
	const concessionId = parseInt(sitelinkDiscount.ConcessionID);
	const type = getDiscountType(sitelinkDiscount.iAmtType);
	const value = getDiscountValue(sitelinkDiscount);
	const appliesToMonth = parseInt(sitelinkDiscount.iInMonth) || 0;

	const discount = {
		concessionId,
		name: sitelinkDiscount.sPlanName || "",

		type,
		value,
		appliesToMonth,

		// Timing
		neverExpires: parseBoolean(sitelinkDiscount.bNeverExpires),
		expiresInMonths: parseInt(sitelinkDiscount.iExpirMonths),

		// Availability
		availableAt: parseInt(sitelinkDiscount.iAvailableAt),

		// Status
		isDisabled:
			sitelinkDiscount.dDisabled !== null &&
			sitelinkDiscount.dDisabled !== undefined,
	};

	// Generate display text and explanation
	discount.displayText = generateDiscountDisplayText(discount);
	discount.explanation = generateDiscountExplanation(discount);

	return discount;
}

/**
 * Check if discount is available on website
 * Based on SiteLink API documentation for iAvailableAt field
 *
 * @param {object} discount - Transformed discount
 * @returns {boolean} True if available on website
 */
function isDiscountAvailableOnWebsite(discount) {
	// Check if disabled
	if (discount.isDisabled) {
		return false;
	}

	const availableAt = discount.availableAt;

	// If bitmask (>= 16), check for website bit (32)
	if (availableAt >= 16) {
		return (availableAt & config.AVAILABLE_CHANNELS.WEBSITE) !== 0;
	}

	// If single value, check for everywhere (0) or website only (2)
	return (
		availableAt === config.AVAILABLE_AT_VALUES.EVERYWHERE ||
		availableAt === config.AVAILABLE_AT_VALUES.WEBSITE_ONLY
	);
}

/**
 * Check if raw discount from SiteLink is available on website
 * @param {object} discount - Raw discount object from SiteLink
 * @returns {boolean} True if available on website
 */
function isRawDiscountAvailableOnWebsite(discount) {
	const availableAt = parseInt(discount.iAvailableAt) || 0;

	// Check if disabled
	if (discount.dDisabled !== null && discount.dDisabled !== undefined) {
		return false;
	}

	// Check if available at website (bit flags: 1=CallCenter, 2=Website, 4=kiosk, etc)
	return (availableAt & 2) === 2;
}

/**
 * Get available channels from iAvailableAt flags
 * @param {number} iAvailableAt - Availability flags
 * @returns {string[]} Array of channel names
 */
function getAvailableChannels(iAvailableAt) {
	const flags = parseInt(iAvailableAt) || 0;
	const channels = [];

	if (flags & 1) channels.push("call_center");
	if (flags & 2) channels.push("website");
	if (flags & 4) channels.push("kiosk");
	if (flags & 8) channels.push("mobile");

	return channels;
}

/**
 * Transform raw discount plans into clean format
 * @param {object} rawData - Raw data from DiscountPlansRetrieve
 * @returns {object} Transformed discount data
 */
function transformDiscountPlans(rawData) {
	if (!rawData || !rawData.data) {
		return {
			plans: [],
			restrictions: {},
		};
	}

	const concessionPlans = rawData.data.ConcessionPlans || [];
	const concessionUnitTypes = rawData.data.ConcessionUnitTypes || [];

	// Build restrictions map
	const restrictionsMap =
		discountsService.buildDiscountRestrictionsMap(concessionUnitTypes);

	// Transform plans
	const plans = concessionPlans
		.filter(isRawDiscountAvailableOnWebsite)
		.map((plan) => {
			const concessionId = parseInt(plan.ConcessionID);
			const restrictions = restrictionsMap[concessionId] || [];

			return {
				id: concessionId,
				name: plan.sPlanName || "",
				description: plan.sDescription || plan.sPlanName || "",
				comment: plan.sComment || "",
				type: getDiscountType(plan.iAmtType),
				value: getDiscountValue(plan),
				maxAmountOff: parseDecimal(plan.dcMaxAmountOff),
				duration: {
					neverExpires: parseBoolean(plan.bNeverExpires),
					expiresInMonths: parseInt(plan.iExpirMonths),
					appliesInMonth: parseInt(plan.iInMonth) || 1,
				},
				prepay: {
					requiresPrepay: parseBoolean(plan.bPrepay),
					prepaidMonths: parseInt(plan.iPrePaidMonths),
				},
				availability: {
					channels: getAvailableChannels(plan.iAvailableAt),
					isCorporate: parseBoolean(plan.bForCorp),
				},
				restrictions: {
					appliesToAllUnits: restrictions.length === 0,
					unitTypes: restrictions.map((r) => ({
						unitTypeId: r.unitTypeId,
						width: r.width,
						length: r.length,
					})),
				},
				metadata: {
					globalNum: parseInt(plan.iConcessionGlobalNum),
					created: plan.dCreated || null,
					updated: plan.dUpdated || null,
				},
			};
		});

	return {
		plans,
		restrictions: restrictionsMap,
	};
}

module.exports = {
	getDiscountType,
	getDiscountValue,
	generateDiscountDisplayText,
	generateDiscountExplanation,
	transformDiscount,
	isDiscountAvailableOnWebsite,
	transformDiscountPlans,
	getAvailableChannels,
};
