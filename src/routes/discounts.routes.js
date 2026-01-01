/**
 * Discounts Routes
 *
 * Express routes for discounts endpoints
 */

const router = require('express').Router()
const discountsController = require('../controllers/discounts.controller')
const { asyncHandler } = require('../middleware/errorHandler')

/**
 * GET /:location/discounts
 *
 * Get all discount plans for a location
 */
router.get('/', asyncHandler(discountsController.getDiscounts))

module.exports = router
