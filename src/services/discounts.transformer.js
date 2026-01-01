/**
 * Discounts Transformer
 *
 * Transforms raw discount data from SiteLink into clean, readable format
 */

const discountsService = require('./sitelink/discounts.service')

/**
 * Get discount type as string
 * @param {number} iAmtType - Discount type code
 * @returns {string} Discount type
 */
function getDiscountTypeString(iAmtType) {
	switch (parseInt(iAmtType)) {
		case 0:
			return 'fixed_amount'
		case 1:
			return 'percentage'
		case 2:
			return 'fixed_price'
		default:
			return 'unknown'
	}
}

/**
 * Get discount value based on type
 * @param {object} discount - Raw discount object
 * @returns {number} Discount value
 */
function getDiscountValue(discount) {
	switch (parseInt(discount.iAmtType)) {
		case 0:
			return parseFloat(discount.dcFixedDiscount) || 0
		case 1:
			return parseFloat(discount.dcPCDiscount) || 0
		case 2:
			return parseFloat(discount.dcChgAmt) || 0
		default:
			return 0
	}
}

/**
 * Check if discount is available on website
 * @param {object} discount - Raw discount object
 * @returns {boolean} True if available on website
 */
function isAvailableOnWebsite(discount) {
	const availableAt = parseInt(discount.iAvailableAt) || 0

	// Check if disabled
	if (discount.dDisabled !== null && discount.dDisabled !== undefined) {
		return false
	}

	// Check if available at website (bit flags: 1=CallCenter, 2=Website, 4=kiosk, etc)
	// 2 = Website only
	// 3 = CallCenter + Website
	// 6 = Website + Kiosk
	// etc
	return (availableAt & 2) === 2
}

/**
 * Get available channels
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
		.filter(isAvailableOnWebsite)
		.map(plan => {
			const concessionId = parseInt(plan.ConcessionID)
			const restrictions = restrictionsMap[concessionId] || []

			return {
				id: concessionId,
				name: plan.sPlanName || '',
				description: plan.sDescription || plan.sPlanName || '',
				comment: plan.sComment || '',
				type: getDiscountTypeString(plan.iAmtType),
				value: getDiscountValue(plan),
				maxAmountOff: parseFloat(plan.dcMaxAmountOff) || 0,
				duration: {
					neverExpires: plan.bNeverExpires === 'true',
					expiresInMonths: parseInt(plan.iExpirMonths) || 0,
					appliesInMonth: parseInt(plan.iInMonth) || 1
				},
				prepay: {
					requiresPrepay: plan.bPrepay === 'true',
					prepaidMonths: parseInt(plan.iPrePaidMonths) || 0
				},
				availability: {
					channels: getAvailableChannels(plan.iAvailableAt),
					isCorporate: plan.bForCorp === 'true'
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
					globalNum: parseInt(plan.iConcessionGlobalNum) || 0,
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
	transformDiscountPlans,
	getDiscountTypeString,
	getDiscountValue,
	isAvailableOnWebsite,
	getAvailableChannels
}
