/**
 * Insurance Routes
 *
 * Express routes for insurance coverage endpoints
 */

const router = require('express').Router()
const insuranceController = require('../controllers/insurance.controller')
const { asyncHandler } = require('../middleware/errorHandler')

/**
 * GET /:location/insurance
 *
 * Get all insurance coverage plans for a location
 */
router.get('/', asyncHandler(insuranceController.getInsurance))

module.exports = router
