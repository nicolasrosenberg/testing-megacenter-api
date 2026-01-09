/**
 * SiteLink Insurance Service
 *
 * SOAP methods related to insurance coverage
 */

const client = require('../shared/client')

/**
 * Get all insurance coverage plans
 * Calls InsuranceCoverageRetrieve
 *
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with insurance plans
 */
async function getInsurancePlans(locationCode = null) {
	return await client.callMethod(
		'InsuranceCoverageRetrieve',
		{},
		'callCenter',
		locationCode
	)
}

module.exports = {
	getInsurancePlans
}
