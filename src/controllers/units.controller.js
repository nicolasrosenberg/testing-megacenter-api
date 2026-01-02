/**
 * Units Controller
 *
 * HTTP handlers for units endpoints
 */

const unitsService = require('../services/units/units.service')
const discountsService = require('../services/discounts/discounts.service')
const unitsAggregator = require('../services/units/units.aggregator')
const unitsTransformer = require('../services/units/units.transformer')
const config = require('../config')
const { logInfo } = require('../middleware/logger')

/**
 * Get Units Grouped by Size and Type
 * Main endpoint that implements the complete inventory flow
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function getUnitsGrouped(req, res) {
	const locationCode = req.locationCode
	const locationSlug = req.locationSlug

	logInfo('UnitsController', `getUnitsGrouped called for ${locationSlug} (${locationCode})`)

	// Fetch data in parallel
	const [unitTypesResponse, discountsResponse] = await Promise.all([
		unitsService.getUnitTypePriceList(config.CHANNEL_TYPES.WEB_RATE, locationCode),
		discountsService.getDiscountPlans(locationCode)
	])

	// Extract and normalize data
	const unitTypesRaw = unitTypesResponse.data.Table
	const discountPlansRaw = discountsResponse.data.ConcessionPlans
	const concessionUnitTypesRaw = discountsResponse.data.ConcessionUnitTypes

	const unitTypes = Array.isArray(unitTypesRaw) ? unitTypesRaw : (unitTypesRaw ? [unitTypesRaw] : [])
	const discountPlans = Array.isArray(discountPlansRaw) ? discountPlansRaw : (discountPlansRaw ? [discountPlansRaw] : [])
	const concessionUnitTypes = Array.isArray(concessionUnitTypesRaw) ? concessionUnitTypesRaw : (concessionUnitTypesRaw ? [concessionUnitTypesRaw] : [])

	logInfo('UnitsController', 'Data fetched', {
		unitTypes: unitTypes.length,
		discountPlans: discountPlans.length,
		concessionUnitTypes: concessionUnitTypes.length
	})

	// Aggregate and group units
	const result = unitsAggregator.aggregateUnits(unitTypes, discountPlans, concessionUnitTypes)

	logInfo('UnitsController', 'Groups created', {
		totalGroups: result.length
	})

	res.json({
		success: true,
		data: result
	})
}

/**
 * Get Unit by ID
 * Endpoint to retrieve detailed information for a specific unit with applicable discounts
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function getUnitById(req, res) {
	const locationCode = req.locationCode
	const locationSlug = req.locationSlug
	const unitId = req.params.id

	logInfo('UnitsController', `getUnitById called for unit ${unitId} at ${locationSlug} (${locationCode})`)

	// Fetch data in parallel
	const [unitResponse, discountsResponse] = await Promise.all([
		unitsService.getUnitById(unitId, locationCode),
		discountsService.getDiscountPlans(locationCode)
	])

	// Extract unit data
	const unitRaw = unitResponse.data.Table
	const unit = Array.isArray(unitRaw) ? unitRaw[0] : unitRaw

	if (!unit) {
		return res.status(404).json({
			success: false,
			error: 'Unit not found'
		})
	}

	// Transform unit data
	const transformedUnit = unitsTransformer.transformUnit(unit)

	// Extract and normalize discount data
	const discountPlansRaw = discountsResponse.data.ConcessionPlans
	const concessionUnitTypesRaw = discountsResponse.data.ConcessionUnitTypes

	const discountPlans = Array.isArray(discountPlansRaw) ? discountPlansRaw : (discountPlansRaw ? [discountPlansRaw] : [])
	const concessionUnitTypes = Array.isArray(concessionUnitTypesRaw) ? concessionUnitTypesRaw : (concessionUnitTypesRaw ? [concessionUnitTypesRaw] : [])

	// Build discount restrictions map
	const restrictionsMap = require('../services/discounts/discounts.service').buildDiscountRestrictionsMap(concessionUnitTypes)

	// Process and filter discounts (only website-available)
	const discountsTransformer = require('../services/discounts/discounts.transformer')
	const applicableDiscounts = []
	let colorIndex = 0

	discountPlans.forEach(discountRaw => {
		const discount = discountsTransformer.transformDiscount(discountRaw, colorIndex)

		// Filter: only website-available discounts
		if (discountsTransformer.isDiscountAvailableOnWebsite(discount)) {
			// Check if discount applies to this specific unit
			if (require('../services/discounts/discounts.service').discountAppliesToUnit(
				discount.concessionId,
				transformedUnit.unitTypeId,
				transformedUnit.width,
				transformedUnit.length,
				restrictionsMap
			)) {
				applicableDiscounts.push(discount)
				colorIndex++
			}
		}
	})

	// Find best discount
	const { findBestDiscount } = require('../utils/pricing')
	const bestDiscount = findBestDiscount(applicableDiscounts, transformedUnit.pricing.web)

	// Calculate effective price
	const effectiveMonthly = discountsTransformer.calculateEffectivePrice(
		transformedUnit.pricing.web,
		bestDiscount
	)

	// Add discount info to response
	const result = {
		...transformedUnit,
		pricing: {
			...transformedUnit.pricing,
			effectiveMonthly
		},
		discount: bestDiscount,
		applicableDiscounts
	}

	logInfo('UnitsController', `Unit ${unitId} retrieved successfully`, {
		hasDiscount: !!bestDiscount,
		applicableDiscountsCount: applicableDiscounts.length
	})

	res.json({
		success: true,
		data: result
	})
}

module.exports = {
	getUnitsGrouped,
	getUnitById
}
