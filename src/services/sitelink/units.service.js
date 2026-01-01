/**
 * SiteLink Units Service
 *
 * SOAP methods related to storage units
 */

const client = require('./client')
const config = require('../../config')

/**
 * Get unit type price list
 * Calls UnitTypePriceList_v2
 *
 * @param {number} channelType - Channel type (0=Standard, 1=Web)
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with unit types
 */
async function getUnitTypePriceList(channelType = config.CHANNEL_TYPES.WEB_RATE, locationCode = null) {
	return await client.callMethod(
		'UnitTypePriceList_v2',
		{},
		'callCenter',
		locationCode
	)
}

/**
 * Get available units only
 * Calls UnitsInformationAvailableUnitsOnly_v2
 *
 * @param {number} lngLastTimePolled - Last poll timestamp (0 for all)
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with available units
 */
async function getAvailableUnits(lngLastTimePolled = 0, locationCode = null) {
	return await client.callMethod(
		'UnitsInformationAvailableUnitsOnly_v2',
		{ lngLastTimePolled },
		'callCenter',
		locationCode
	)
}

/**
 * Get all units information (available + occupied)
 * Calls UnitsInformation_v3
 *
 * @param {number} lngLastTimePolled - Last poll timestamp (0 for all)
 * @param {boolean} includeExcluded - Include units excluded from website
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with all units
 */
async function getAllUnits(lngLastTimePolled = 0, includeExcluded = false, locationCode = null) {
	return await client.callMethod(
		'UnitsInformation_v3',
		{
			lngLastTimePolled,
			bReturnExcludedFromWebsiteUnits: includeExcluded
		},
		'callCenter',
		locationCode
	)
}

/**
 * Get unit by ID
 * Calls UnitsInformationByUnitID
 *
 * @param {number} unitId - Unit ID
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with unit details
 */
async function getUnitById(unitId, locationCode = null) {
	return await client.callMethod(
		'UnitsInformationByUnitID',
		{ iUnitID: unitId },
		'callCenter',
		locationCode
	)
}

/**
 * Calculate move-in cost with discount
 * Calls MoveInCostRetrieveWithDiscount_v2
 *
 * @param {object} params - Move-in parameters
 * @param {number} params.unitId - Unit ID
 * @param {string} params.moveInDate - Move-in date (ISO format)
 * @param {number} params.insuranceCoverageId - Insurance ID (-999 for none)
 * @param {number} params.concessionPlanId - Discount ID (-999 for none)
 * @param {number} params.channelType - Channel type (0=Standard, 1=Web)
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with cost breakdown
 */
async function calculateMoveInCost(params, locationCode = null) {
	const {
		unitId,
		moveInDate,
		insuranceCoverageId = config.SPECIAL_VALUES.NO_INSURANCE,
		concessionPlanId = config.SPECIAL_VALUES.NO_DISCOUNT,
		channelType = config.CHANNEL_TYPES.WEB_RATE
	} = params

	return await client.callMethod(
		'MoveInCostRetrieveWithDiscount_v2',
		{
			iUnitID: unitId,
			dMoveInDate: moveInDate,
			InsuranceCoverageID: insuranceCoverageId,
			ConcessionPlanID: concessionPlanId,
			ChannelType: channelType
		},
		'callCenter',
		locationCode
	)
}

module.exports = {
	getUnitTypePriceList,
	getAvailableUnits,
	getAllUnits,
	getUnitById,
	calculateMoveInCost
}
