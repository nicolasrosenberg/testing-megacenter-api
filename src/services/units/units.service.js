/**
 * SiteLink Units Service
 *
 * SOAP methods related to storage units
 */

const client = require('../shared/client')
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
 * Get unit information by unit ID
 * Calls UnitsInformationByUnitID
 *
 * @param {number} unitId - Unit ID
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with unit information
 */
async function getUnitById(unitId, locationCode = null) {
	return await client.callMethod(
		'UnitsInformationByUnitID',
		{ UnitID: unitId },
		'callCenter',
		locationCode
	)
}

module.exports = {
	getUnitTypePriceList,
	getUnitById
}
