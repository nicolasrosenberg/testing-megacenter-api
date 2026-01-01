/**
 * Units Controller
 *
 * Business logic for storage units endpoints
 * Implements unit grouping and filtering logic from API-INVENTORY-FLOW.md
 */

const unitsService = require('../services/sitelink/units.service')
const discountsService = require('../services/sitelink/discounts.service')
const transformer = require('../services/transformer.service')
const config = require('../config')
const { logInfo } = require('../middleware/logger')

/**
 * Assign tier to unit option based on position and total count
 * @param {number} index - Option index (0-based)
 * @param {number} total - Total number of options
 * @returns {string} Tier level
 */
function assignTier(index, total) {
	if (total === 1) return config.TIER_LEVELS.GOOD
	if (total === 2) return index === 0 ? config.TIER_LEVELS.GOOD : config.TIER_LEVELS.BETTER
	if (total === 3) {
		if (index === 0) return config.TIER_LEVELS.GOOD
		if (index === 1) return config.TIER_LEVELS.BETTER
		return config.TIER_LEVELS.BEST
	}

	// 4+ options: divide into quarters
	const quarter = total / 4
	if (index < quarter) return config.TIER_LEVELS.GOOD
	if (index < quarter * 2) return config.TIER_LEVELS.BETTER
	if (index < quarter * 3) return config.TIER_LEVELS.BEST
	return config.TIER_LEVELS.PREMIUM
}

/**
 * Get Units Grouped by Size and Type
 * Main endpoint that implements the complete inventory flow
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function getUnitsGrouped(req, res) {
	// Location code is injected by locationHandler middleware
	const locationCode = req.locationCode
	const locationSlug = req.locationSlug

	logInfo('UnitsController', `getUnitsGrouped called for ${locationSlug} (${locationCode})`)

	// Step 1: Fetch data in parallel
	const [unitTypesResponse, discountsResponse] = await Promise.all([
		unitsService.getUnitTypePriceList(config.CHANNEL_TYPES.WEB_RATE, locationCode),
		discountsService.getDiscountPlans(locationCode)
	])

	// Extract tables
	const unitTypesRaw = unitTypesResponse.data.Table
	const discountPlansRaw = discountsResponse.data.ConcessionPlans
	const concessionUnitTypesRaw = discountsResponse.data.ConcessionUnitTypes

	// Ensure arrays
	const unitTypes = Array.isArray(unitTypesRaw) ? unitTypesRaw : (unitTypesRaw ? [unitTypesRaw] : [])
	const discountPlans = Array.isArray(discountPlansRaw) ? discountPlansRaw : (discountPlansRaw ? [discountPlansRaw] : [])
	const concessionUnitTypes = Array.isArray(concessionUnitTypesRaw) ? concessionUnitTypesRaw : (concessionUnitTypesRaw ? [concessionUnitTypesRaw] : [])

	logInfo('UnitsController', 'Data fetched', {
		unitTypes: unitTypes.length,
		discountPlans: discountPlans.length,
		concessionUnitTypes: concessionUnitTypes.length
	})

	// Step 2: Build discount restrictions map
	const restrictionsMap = discountsService.buildDiscountRestrictionsMap(concessionUnitTypes)

	// Step 3: Process and filter discounts
	const discountsMap = new Map()
	let colorIndex = 0

	discountPlans.forEach(discountRaw => {
		const discount = transformer.transformDiscount(discountRaw, colorIndex)

		// Filter: only website-available discounts
		if (transformer.isDiscountAvailableOnWebsite(discount)) {
			discountsMap.set(discount.concessionId, discount)
			colorIndex++
		}
	})

	logInfo('UnitsController', 'Discounts filtered', {
		totalDiscounts: discountPlans.length,
		websiteDiscounts: discountsMap.size
	})

	// Step 4: Filter unit types with availability
	const availableUnitTypes = unitTypes.filter(ut =>
		transformer.parseInt(ut.iTotalVacant) > 0
	)

	logInfo('UnitsController', 'Unit types filtered', {
		totalUnitTypes: unitTypes.length,
		availableUnitTypes: availableUnitTypes.length
	})

	// Step 5: Group by dimension + type
	const groups = {}

	availableUnitTypes.forEach(unitTypeRaw => {
		const unitType = transformer.transformUnitType(unitTypeRaw)

		// Create group key: {width}x{length}:{typeName}
		const groupKey = `${unitType.width}x${unitType.length}:${unitType.typeName}`

		if (!groups[groupKey]) {
			groups[groupKey] = {
				key: groupKey,
				width: unitType.width,
				length: unitType.length,
				area: unitType.area,
				typeName: unitType.typeName,
				options: []
			}
		}

		const group = groups[groupKey]

		// Find applicable discounts for this unit type
		const applicableDiscounts = []

		discountsMap.forEach(discount => {
			if (discountsService.discountAppliesToUnit(
				discount.concessionId,
				unitType.unitTypeId,
				unitType.width,
				unitType.length,
				restrictionsMap
			)) {
				applicableDiscounts.push(discount)
			}
		})

		// Get best discount (highest savings in absolute amount)
		const bestDiscount = applicableDiscounts.length > 0
			? applicableDiscounts.reduce((best, current) => {
				if (!best) return current

				const bestSavings = best.type === 'fixed_rate'
					? (unitType.pricing.web - best.value)
					: (best.type === 'amount_off' ? best.value : unitType.pricing.web * best.value / 100)

				const currentSavings = current.type === 'fixed_rate'
					? (unitType.pricing.web - current.value)
					: (current.type === 'amount_off' ? current.value : unitType.pricing.web * current.value / 100)

				return currentSavings > bestSavings ? current : best
			}, null)
			: null

		// Calculate effective monthly price
		const effectiveMonthly = transformer.calculateEffectivePrice(
			unitType.pricing.web,
			bestDiscount
		)

		// Create option
		const option = {
			unitTypeId: unitType.unitTypeId,
			tier: '', // Will be assigned later
			description: unitTypeRaw.sUnitDesc_FirstAvailable || '',

			features: {
				climate: unitType.features.climate,
				inside: unitType.features.inside,
				power: unitType.features.power,
				alarm: unitType.features.alarm,
				floor: unitType.features.floor,
				mobile: unitType.features.mobile,
				typeName: unitType.typeName
			},

			pricing: {
				standard: unitType.pricing.standard,
				web: unitType.pricing.web,
				preferred: unitType.pricing.preferred,
				effectiveMonthly
			},

			availability: {
				total: unitType.availability.total,
				occupied: unitType.availability.occupied,
				vacant: unitType.availability.vacant,
				reserved: unitType.availability.reserved,
				firstAvailableUnitId: unitType.firstAvailableUnit?.unitId || null,
				firstAvailableUnitName: unitType.firstAvailableUnit?.unitName || null,
				isAvailable: unitType.availability.vacant > 0
			},

			discount: bestDiscount,

			fees: {
				admin: unitType.pricing.adminFee,
				reservation: unitType.pricing.reservationFee
			},

			tax: {
				rate1: unitType.tax.rate1,
				rate2: unitType.tax.rate2,
				charge1: unitType.tax.charge1,
				charge2: unitType.tax.charge2
			}
		}

		group.options.push(option)
	})

	// Step 6: Process each group
	const result = Object.values(groups).map(group => {
		// Sort options by effective price (lowest to highest)
		group.options.sort((a, b) => a.pricing.effectiveMonthly - b.pricing.effectiveMonthly)

		// Assign tiers
		group.options.forEach((option, index) => {
			option.tier = assignTier(index, group.options.length)
		})

		// Extract common description
		const descriptions = [...new Set(group.options.map(o => o.description).filter(d => d))]
		const commonDescription = descriptions.length === 1 ? descriptions[0] : ''

		// Extract common discount
		// A discount is only "common" if ALL options in the group have the same discount
		const discountIds = [...new Set(
			group.options
				.filter(o => o.discount)
				.map(o => o.discount.concessionId)
		)]

		const commonDiscount = (
			discountIds.length === 1 &&
			group.options.every(option => option.discount?.concessionId === discountIds[0])
		) ? group.options.find(o => o.discount)?.discount : null

		// If common discount exists, remove from individual options
		if (commonDiscount) {
			group.options.forEach(option => {
				if (option.discount?.concessionId === commonDiscount.concessionId) {
					option.discount = null
				}
			})
		}

		// Calculate min prices
		const webPrices = group.options.map(o => o.pricing.web).filter(p => p > 0)
		const effectivePrices = group.options.map(o => o.pricing.effectiveMonthly).filter(p => p > 0)

		return {
			id: group.key,
			key: group.key,
			width: group.width,
			length: group.length,
			area: group.area,
			typeName: group.typeName,

			displayName: `${group.width}' x ${group.length}'`,
			displayType: group.typeName,
			displaySize: `${group.area} sq ft`,

			description: commonDescription,
			commonDiscount,

			options: group.options,

			minPrice: webPrices.length > 0 ? Math.min(...webPrices) : 0,
			minPriceWithDiscount: effectivePrices.length > 0 ? Math.min(...effectivePrices) : 0,
			totalAvailable: group.options.reduce((sum, o) => sum + o.availability.vacant, 0)
		}
	})

	// Step 7: Sort by area, then type name
	result.sort((a, b) => {
		if (a.area !== b.area) {
			return a.area - b.area
		}
		return a.typeName.localeCompare(b.typeName)
	})

	logInfo('UnitsController', 'Groups created', {
		totalGroups: result.length
	})

	res.json({
		success: true,
		data: result
	})
}

module.exports = {
	getUnitsGrouped
}
