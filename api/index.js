/**
 * SiteLink API - Main Router
 * 
 * Aggregates all SiteLink API modules
 * 
 * Routes:
 * - /api/sitelink/locations - Facility locations
 * - /api/sitelink/units - Storage units
 * - /api/sitelink/reservations - Reservations
 * - /api/sitelink/movein - Move-in processing
 * - /api/sitelink/insurance - Insurance plans
 * - /api/sitelink/payments - Payment processing
 * - /api/sitelink/esign - Electronic signatures
 * - /api/sitelink/tenants - Tenant management
 */

const router = require('express').Router()
const sitelink = require('./client')

// Import modules
const locationsRouter = require('./locations')
const unitsRouter = require('./units')
const reservationsRouter = require('./reservations')
const moveinRouter = require('./movein')
const insuranceRouter = require('./insurance')
const paymentsRouter = require('./payments')
const esignRouter = require('./esign')
const tenantsRouter = require('./tenants')

module.exports = () => {

	/**
	 * GET /sitelink/methods
	 * List all available SOAP methods (for debugging)
	 */
	router.get('/methods', async (req, res) => {
		try {
			const { type = 'callCenter' } = req.query
			const methods = await sitelink.listMethods(type)
			res.json({
				status: 'ok',
				clientType: type,
				methods
			})
		} catch (e) {
			res.status(500).json({
				status: 'error',
				msg: e.message
			})
		}
	})

	// Health check / API info
	router.get('/', (req, res) => {
		res.json({
			status: 'ok',
			api: 'SiteLink Integration',
			version: '1.0.0',
			endpoints: {
				locations: {
					'GET /locations': 'List all locations',
					'GET /locations/:code': 'Get location details'
				},
				units: {
					'GET /units/available': 'List available units',
					'GET /units/sizes': 'Get unit sizes summary',
					'GET /units/:id': 'Get unit details'
				},
				reservations: {
					'POST /reservations': 'Create reservation',
					'GET /reservations/:id': 'Get reservation',
					'DELETE /reservations/:id': 'Cancel reservation',
					'GET /reservations': 'List reservations'
				},
				movein: {
					'POST /movein/calculate': 'Calculate move-in costs',
					'POST /movein': 'Process new tenant move-in',
					'POST /movein/existing': 'Process existing tenant move-in',
					'GET /movein/promo/:code': 'Validate promo code'
				},
				insurance: {
					'GET /insurance': 'List insurance plans',
					'GET /insurance/:id': 'Get insurance plan details',
					'POST /insurance/calculate': 'Calculate insurance cost'
				},
				payments: {
					'POST /payments': 'Process payment',
					'GET /payments/balance/:tenantId': 'Get tenant balance',
					'GET /payments/history/:tenantId': 'Get payment history',
					'POST /payments/autopay': 'Setup autopay',
					'DELETE /payments/autopay/:tenantId': 'Cancel autopay',
					'POST /payments/validate-card': 'Validate credit card'
				},
				esign: {
					'POST /esign/create-lease-url': 'Create eSign lease URL',
					'GET /esign/completed': 'eSign completion callback',
					'GET /esign/status/:tenantId': 'Get eSign status',
					'POST /esign/resend': 'Resend eSign invitation'
				},
				tenants: {
					'GET /tenants/:id': 'Get tenant info',
					'GET /tenants/:id/units': 'Get tenant units',
					'GET /tenants/search': 'Search tenants',
					'PUT /tenants/:id': 'Update tenant',
					'GET /tenants/:id/ledgers': 'Get tenant ledgers',
					'POST /tenants/:id/access-code': 'Reset access code',
					'POST /tenants/:id/move-out': 'Process move-out'
				}
			}
		})
	})

	// Mount sub-routers
	router.use('/locations', locationsRouter())
	router.use('/units', unitsRouter())
	router.use('/reservations', reservationsRouter())
	router.use('/movein', moveinRouter())
	router.use('/insurance', insuranceRouter())
	router.use('/payments', paymentsRouter())
	router.use('/esign', esignRouter())
	router.use('/tenants', tenantsRouter())

	// Global error handler for SiteLink routes
	router.use((err, req, res, next) => {
		console.error('SiteLink API Error:', err)
		
		res.status(err.status || 500).json({
			status: 'error',
			msg: err.message || 'Internal server error',
			retCode: err.retCode,
			path: req.path
		})
	})

	return router
}
