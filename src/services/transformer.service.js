/**
 * Transformer Service
 *
 * Transforms SiteLink SOAP responses to clean, frontend-friendly formats
 */

const config = require('../config')

/**
 * Parse boolean value from SiteLink
 * @param {any} value - Value to parse
 * @returns {boolean} Boolean value
 */
function parseBoolean(value) {
	return value === 'true' || value === true
}

/**
 * Parse decimal/number from SiteLink
 * @param {any} value - Value to parse
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {number} Parsed number
 */
function parseDecimal(value, decimals = 2) {
	const num = parseFloat(value) || 0
	return Number(num.toFixed(decimals))
}

/**
 * Parse integer from SiteLink
 * @param {any} value - Value to parse
 * @returns {number} Parsed integer
 */
function parseInt(value) {
	return Number.parseInt(value) || 0
}

/**
 * Transform unit type from UnitTypePriceList_v2
 * @param {object} sitelinkUnit - Raw unit type from SiteLink
 * @returns {object} Transformed unit type
 */
function transformUnitType(sitelinkUnit) {
	const width = parseDecimal(sitelinkUnit.dcWidth)
	const length = parseDecimal(sitelinkUnit.dcLength)
	const area = parseDecimal(sitelinkUnit.dcArea)

	return {
		unitTypeId: parseInt(sitelinkUnit.UnitTypeID),
		typeName: sitelinkUnit.sTypeName || '',

		// Dimensions
		width,
		length,
		area,

		// Display
		displaySize: `${width}' x ${length}'`,
		displayArea: `${area} sq ft`,

		// Features
		features: {
			climate: parseBoolean(sitelinkUnit.bClimate),
			inside: parseBoolean(sitelinkUnit.bInside),
			power: parseBoolean(sitelinkUnit.bPower),
			alarm: parseBoolean(sitelinkUnit.bAlarm),
			mobile: parseBoolean(sitelinkUnit.bMobile),
			floor: parseInt(sitelinkUnit.iFloor)
		},

		// Pricing
		pricing: {
			standard: parseDecimal(sitelinkUnit.dcStdRate),
			web: parseDecimal(sitelinkUnit.dcWebRate),
			board: parseDecimal(sitelinkUnit.dcBoardRate),
			preferred: parseDecimal(sitelinkUnit.dcPreferredRate),
			preferredChannelType: parseInt(sitelinkUnit.iPreferredChannelType),
			isPushRate: parseBoolean(sitelinkUnit.bPreferredIsPushRate),
			adminFee: parseDecimal(sitelinkUnit.dcAdminFee),
			reservationFee: parseDecimal(sitelinkUnit.dcReservationFee),
			securityDeposit: parseDecimal(sitelinkUnit.dcStdSecDep)
		},

		// Availability
		availability: {
			total: parseInt(sitelinkUnit.iTotalUnits),
			occupied: parseInt(sitelinkUnit.iTotalOccupied),
			vacant: parseInt(sitelinkUnit.iTotalVacant),
			reserved: parseInt(sitelinkUnit.iTotalReserved)
		},

		// First available unit
		firstAvailableUnit: sitelinkUnit.UnitID_FirstAvailable ? {
			unitId: parseInt(sitelinkUnit.UnitID_FirstAvailable),
			unitName: sitelinkUnit.sUnitName_FirstAvailable || '',
			description: sitelinkUnit.sUnitDesc_FirstAvailable || '',
			isRented: parseBoolean(sitelinkUnit.bRented_FirstAvailable)
		} : null,

		// Taxes
		tax: {
			rate1: parseDecimal(sitelinkUnit.dcTax1Rate_Rent, 4),
			rate2: parseDecimal(sitelinkUnit.dcTax2Rate_Rent, 4),
			charge1: parseBoolean(sitelinkUnit.bChargeTax1),
			charge2: parseBoolean(sitelinkUnit.bChargeTax2)
		},

		// Discount
		concessionId: parseInt(sitelinkUnit.ConcessionID) || null,

		// Meta
		siteId: parseInt(sitelinkUnit.SiteID),
		excludeFromInsurance: parseBoolean(sitelinkUnit.bExcludeFromInsurance)
	}
}

/**
 * Get discount type string from iAmtType
 * @param {number} iAmtType - SiteLink discount type
 * @returns {string} Discount type
 */
function getDiscountType(iAmtType) {
	switch (parseInt(iAmtType)) {
		case config.DISCOUNT_TYPES.AMOUNT_OFF:
			return 'amount_off'
		case config.DISCOUNT_TYPES.PERCENTAGE_OFF:
			return 'percentage_off'
		case config.DISCOUNT_TYPES.FIXED_RATE:
			return 'fixed_rate'
		default:
			return 'unknown'
	}
}

/**
 * Get discount value from concession plan
 * @param {object} discount - Raw discount from SiteLink
 * @returns {number} Discount value
 */
function getDiscountValue(discount) {
	const iAmtType = parseInt(discount.iAmtType)

	switch (iAmtType) {
		case config.DISCOUNT_TYPES.AMOUNT_OFF:
			return parseDecimal(discount.dcFixedDiscount)
		case config.DISCOUNT_TYPES.PERCENTAGE_OFF:
			return parseDecimal(discount.dcPCDiscount)
		case config.DISCOUNT_TYPES.FIXED_RATE:
			return parseDecimal(discount.dcChgAmt)
		default:
			return 0
	}
}

/**
 * Generate display text for discount
 * @param {object} discount - Transformed discount
 * @returns {string} Display text
 */
function generateDiscountDisplayText(discount) {
	switch (discount.type) {
		case 'amount_off':
			return `$${discount.value} OFF`
		case 'percentage_off':
			return discount.value === 100 ? '1ST MONTH FREE' : `${discount.value}% OFF`
		case 'fixed_rate':
			return `FIRST MONTH $${discount.value}`
		default:
			return discount.name
	}
}

/**
 * Generate explanation for discount
 * @param {object} discount - Transformed discount
 * @returns {string} Explanation
 */
function generateDiscountExplanation(discount) {
	const monthText = discount.appliesToMonth > 0
		? ` in month ${discount.appliesToMonth}`
		: ''

	switch (discount.type) {
		case 'amount_off':
			return `Save $${discount.value}${monthText}.`
		case 'percentage_off':
			if (discount.value === 100) {
				return `You don't pay the first month. You start paying from the second month.`
			}
			return `Save ${discount.value}% off your rent${monthText}.`
		case 'fixed_rate':
			return `Pay only $${discount.value} for your first month.`
		default:
			return discount.description || discount.name
	}
}

/**
 * Transform discount plan from DiscountPlansRetrieve
 * @param {object} sitelinkDiscount - Raw discount from SiteLink
 * @param {number} colorIndex - Index for color assignment
 * @returns {object} Transformed discount
 */
function transformDiscount(sitelinkDiscount, colorIndex = 0) {
	const concessionId = parseInt(sitelinkDiscount.ConcessionID)
	const type = getDiscountType(sitelinkDiscount.iAmtType)
	const value = getDiscountValue(sitelinkDiscount)
	const appliesToMonth = parseInt(sitelinkDiscount.iInMonth) || 0

	const discount = {
		concessionId,
		name: sitelinkDiscount.sPlanName || '',
		description: sitelinkDiscount.sDescription || '',
		comment: sitelinkDiscount.sComment || '',
		type,
		value,
		appliesToMonth,

		// Timing
		neverExpires: parseBoolean(sitelinkDiscount.bNeverExpires),
		expiresInMonths: parseInt(sitelinkDiscount.iExpirMonths),
		applyAtMoveIn: parseBoolean(sitelinkDiscount.bApplyAtMoveIn),
		prorateAtMoveIn: parseBoolean(sitelinkDiscount.bProrateAtMoveIn),

		// Requirements
		requiresPrepay: parseBoolean(sitelinkDiscount.bPrepay),
		prepaidMonths: parseInt(sitelinkDiscount.iPrePaidMonths),

		// Restrictions
		maxDiscount: parseDecimal(sitelinkDiscount.dcMaxAmountOff),
		forAllUnits: parseBoolean(sitelinkDiscount.bForAllUnits),
		forCorporate: parseBoolean(sitelinkDiscount.bForCopr),

		// Availability
		availableAt: parseInt(sitelinkDiscount.iAvailableAt),
		showOn: parseInt(sitelinkDiscount.iShowOn),

		// Rounding
		shouldRound: parseBoolean(sitelinkDiscount.bRound),
		roundTo: parseDecimal(sitelinkDiscount.dcRoundTo),

		// Status
		isDisabled: sitelinkDiscount.dDisabled !== null && sitelinkDiscount.dDisabled !== undefined,

		// Visual
		color: config.DISCOUNT_COLORS[colorIndex % config.DISCOUNT_COLORS.length]
	}

	// Generate display text and explanation
	discount.displayText = generateDiscountDisplayText(discount)
	discount.explanation = generateDiscountExplanation(discount)

	return discount
}

/**
 * Calculate effective monthly price with discount
 * Based on API-INVENTORY-FLOW.md logic
 *
 * @param {number} basePrice - Base monthly price (webRate)
 * @param {object} discount - Transformed discount object (or null)
 * @returns {number} Effective monthly price
 */
function calculateEffectivePrice(basePrice, discount) {
	if (!discount) {
		return basePrice
	}

	// If discount applies to specific month (temporary), show regular price
	// Because customer will pay full price most months
	if (discount.appliesToMonth > 0) {
		return basePrice
	}

	// Permanent discounts (appliesToMonth = 0)
	switch (discount.type) {
		case 'amount_off':
			return Math.max(0, basePrice - discount.value)

		case 'percentage_off':
			return basePrice * (1 - discount.value / 100)

		case 'fixed_rate':
			// Fixed rate is always the effective price
			return discount.value

		default:
			return basePrice
	}
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
		return false
	}

	const availableAt = discount.availableAt

	// If bitmask (>= 16), check for website bit (32)
	if (availableAt >= 16) {
		return (availableAt & config.AVAILABLE_CHANNELS.WEBSITE) !== 0
	}

	// If single value, check for everywhere (0) or website only (2)
	return availableAt === config.AVAILABLE_AT_VALUES.EVERYWHERE ||
		availableAt === config.AVAILABLE_AT_VALUES.WEBSITE_ONLY
}

module.exports = {
	parseBoolean,
	parseDecimal,
	parseInt,
	transformUnitType,
	transformDiscount,
	calculateEffectivePrice,
	isDiscountAvailableOnWebsite,
	getDiscountType,
	getDiscountValue,
	generateDiscountDisplayText,
	generateDiscountExplanation
}
