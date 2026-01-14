/**
 * Discounts Controller
 *
 * Handles HTTP requests for discounts
 */

const discountsService = require('../services/discounts/discounts.service')
const discountsTransformer = require('../services/discounts/discounts.transformer')
const { success } = require('../utils/response')

/**
 * Get discounts for location
 * GET /:location/discounts
 */
async function getDiscounts(req, res) {
	const locationCode = req.locationCode

	const rawData = await discountsService.getDiscountPlans(locationCode)
	const transformed = discountsTransformer.transformDiscountPlans(rawData)

	res.json(
		success(
			transformed,
			{
				location: req.params.location,
				locationCode: locationCode
			}
		)
	)
}

module.exports = {
	getDiscounts
}
