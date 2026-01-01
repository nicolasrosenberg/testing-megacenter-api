/**
 * Main Router
 *
 * Aggregates all route modules with location-based routing
 * Route structure: /:location/resource
 */

const router = require('express').Router()
const { asyncHandler } = require('../middleware/errorHandler')
const locationHandler = require('../middleware/locationHandler')
const config = require('../config')

// Import route modules
const unitsRoutes = require('./units.routes')
const discountsRoutes = require('./discounts.routes')

/**
 * Health check / API info
 */
router.get('/', (req, res) => {
	const locations = config.locations.getLocationSlugs()

	res.json({
		status: 'ok',
		api: 'Megacenter SiteLink API',
		version: '2.0.0',
		locations: locations,
		endpoints: {
			units: {
				'GET /:location/units': 'Get units grouped by size and type with discounts, ready to display'
			},
			discounts: {
				'GET /:location/discounts': 'Get discount plans for a location'
			}
		},
		example: {
			url: `/brickell/units`,
			description: 'Get grouped units for Brickell location'
		}
	})
})

/**
 * Location-based routes
 * All routes require :location parameter (brickell, memorial, willowbrook)
 */
router.use('/:location', asyncHandler(locationHandler))
router.use('/:location/units', unitsRoutes)
router.use('/:location/discounts', discountsRoutes)

module.exports = router
