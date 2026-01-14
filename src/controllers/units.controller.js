/**
 * Units Controller
 *
 * HTTP handlers for units endpoints
 */

const unitsService = require('../services/units/units.service')
const discountsService = require('../services/discounts/discounts.service')
const unitsAggregator = require('../services/units/units.aggregator')
const unitsHelper = require('../services/units/units.helper')
const config = require('../config')
const { logInfo } = require('../middleware/logger')
const { success } = require('../utils/response')

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

	res.json(success(result))
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

	// Use helper to validate and get unit with discounts
	const result = await unitsHelper.validateAndGetUnitWithDiscounts(unitId, locationCode, true)

	res.json(success(result))
}

module.exports = {
	getUnitsGrouped,
	getUnitById
}
