/**
 * Discounts Transformer
 *
 * Transforms discount data from SiteLink into clean, frontend-friendly format
 */

const config = require('../../config')
const { parseBoolean, parseDecimal, parseInt } = require('../../utils/parsers')
const discountsService = require('./discounts.service')

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

/**
 * Check if raw discount from SiteLink is available on website
 * @param {object} discount - Raw discount object from SiteLink
 * @returns {boolean} True if available on website
 */
function isRawDiscountAvailableOnWebsite(discount) {
	const availableAt = parseInt(discount.iAvailableAt) || 0

	// Check if disabled
	if (discount.dDisabled !== null && discount.dDisabled !== undefined) {
		return false
	}

	// Check if available at website (bit flags: 1=CallCenter, 2=Website, 4=kiosk, etc)
	return (availableAt & 2) === 2
}

/**
 * Get available channels from iAvailableAt flags
 * @param {number} iAvailableAt - Availability flags
 * @returns {string[]} Array of channel names
 */
function getAvailableChannels(iAvailableAt) {
	const flags = parseInt(iAvailableAt) || 0
	const channels = []

	if (flags & 1) channels.push('call_center')
	if (flags & 2) channels.push('website')
	if (flags & 4) channels.push('kiosk')
	if (flags & 8) channels.push('mobile')

	return channels
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
			restrictions: {}
		}
	}

	const concessionPlans = rawData.data.ConcessionPlans || []
	const concessionUnitTypes = rawData.data.ConcessionUnitTypes || []

	// Build restrictions map
	const restrictionsMap = discountsService.buildDiscountRestrictionsMap(
		concessionUnitTypes
	)

	// Transform plans
	const plans = concessionPlans
		.filter(isRawDiscountAvailableOnWebsite)
		.map(plan => {
			const concessionId = parseInt(plan.ConcessionID)
			const restrictions = restrictionsMap[concessionId] || []

			return {
				id: concessionId,
				name: plan.sPlanName || '',
				description: plan.sDescription || plan.sPlanName || '',
				comment: plan.sComment || '',
				type: getDiscountType(plan.iAmtType),
				value: getDiscountValue(plan),
				maxAmountOff: parseDecimal(plan.dcMaxAmountOff),
				duration: {
					neverExpires: parseBoolean(plan.bNeverExpires),
					expiresInMonths: parseInt(plan.iExpirMonths),
					appliesInMonth: parseInt(plan.iInMonth) || 1
				},
				prepay: {
					requiresPrepay: parseBoolean(plan.bPrepay),
					prepaidMonths: parseInt(plan.iPrePaidMonths)
				},
				availability: {
					channels: getAvailableChannels(plan.iAvailableAt),
					isCorporate: parseBoolean(plan.bForCorp)
				},
				restrictions: {
					appliesToAllUnits: restrictions.length === 0,
					unitTypes: restrictions.map(r => ({
						unitTypeId: r.unitTypeId,
						width: r.width,
						length: r.length
					}))
				},
				metadata: {
					globalNum: parseInt(plan.iConcessionGlobalNum),
					created: plan.dCreated || null,
					updated: plan.dUpdated || null
				}
			}
		})

	return {
		plans,
		restrictions: restrictionsMap
	}
}

module.exports = {
	getDiscountType,
	getDiscountValue,
	generateDiscountDisplayText,
	generateDiscountExplanation,
	transformDiscount,
	calculateEffectivePrice,
	isDiscountAvailableOnWebsite,
	transformDiscountPlans,
	getAvailableChannels
}
