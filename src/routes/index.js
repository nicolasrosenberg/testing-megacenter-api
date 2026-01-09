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
const insuranceRoutes = require('./insurance.routes')
const reservationsRoutes = require('./reservations.routes')
const costRoutes = require('./cost.routes')
const paymentsRoutes = require('./payments.routes')

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
				'GET /:location/units': 'Get units grouped by size and type with discounts, ready to display',
				'GET /:location/units/:id': 'Get detailed information for a specific unit'
			},
			discounts: {
				'GET /:location/discounts': 'Get discount plans for a location'
			},
			insurance: {
				'GET /:location/insurance': 'Get insurance coverage plans for a location'
			},
			reservations: {
				'POST /:location/reservations': 'Create a new reservation (tenant + waiting list entry)'
			},
			cost: {
				'POST /:location/cost/calculate': 'Calculate move-in cost with discounts and insurance (WebRate channel)'
			},
			payments: {
				'POST /:location/payments/process': 'Process payment and execute move-in with validations'
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
router.use('/:location/insurance', insuranceRoutes)
router.use('/:location/reservations', reservationsRoutes)
router.use('/:location/cost', costRoutes)
router.use('/:location/payments', paymentsRoutes)

module.exports = router
