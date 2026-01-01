/**
 * Units Routes
 *
 * Express routes for storage units endpoints
 */

const router = require('express').Router()
const unitsController = require('../controllers/units.controller')
const { asyncHandler } = require('../middleware/errorHandler')

/**
 * GET /:location/units
 *
 * Get units grouped by size and type with discounts, ready to display
 * Main endpoint for frontend unit listing
 */
router.get('/', asyncHandler(unitsController.getUnitsGrouped))

module.exports = router
