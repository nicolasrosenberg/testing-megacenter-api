/**
 * Insurance Controller
 *
 * Handles HTTP requests for insurance coverage plans
 */

const insuranceService = require('../services/insurance/insurance.service')
const insuranceTransformer = require('../services/insurance/insurance.transformer')

/**
 * Get insurance plans for location
 * GET /:location/insurance
 */
async function getInsurance(req, res) {
	const locationCode = req.locationCode

	const rawData = await insuranceService.getInsurancePlans(locationCode)
	const transformed = insuranceTransformer.transformInsurancePlans(rawData)

	res.json({
		location: req.params.location,
		locationCode: locationCode,
		...transformed
	})
}

module.exports = {
	getInsurance
}
