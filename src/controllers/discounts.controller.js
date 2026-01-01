/**
 * Discounts Controller
 *
 * Handles HTTP requests for discounts
 */

const discountsService = require('../services/sitelink/discounts.service')
const discountsTransformer = require('../services/discounts.transformer')

/**
 * Get discounts for location
 * GET /:location/discounts
 */
async function getDiscounts(req, res) {
	const locationCode = req.locationCode

	const rawData = await discountsService.getDiscountPlans(locationCode)
	const transformed = discountsTransformer.transformDiscountPlans(rawData)

	res.json({
		location: req.params.location,
		locationCode: locationCode,
		...transformed
	})
}

module.exports = {
	getDiscounts
}
