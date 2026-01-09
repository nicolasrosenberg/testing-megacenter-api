/**
 * Reservations Routes
 *
 * Routes for creating reservations
 * Base path: /:location/reservations
 */

const router = require('express').Router()
const { asyncHandler } = require('../middleware/errorHandler')
const reservationsController = require('../controllers/reservations.controller')
const { strictLimiter } = require('../middleware/rateLimiter')
const { requireRecaptcha } = require('../services/recaptcha.service')

/**
 * POST /:location/reservations
 * Create a new reservation
 *
 * SECURITY:
 * - Rate limited to 5 requests per hour per IP
 * - reCAPTCHA v3 validation (anti-bot)
 *
 * Body:
 * {
 *   unitId: number (required),
 *   firstName: string (required),
 *   lastName: string (required),
 *   email: string (required),
 *   phone: string (required),
 *   moveInDate: string (ISO date, required),
 *   recaptchaToken: string (required),
 *   comment?: string,
 *   address?: string,
 *   city?: string,
 *   state?: string,
 *   zipCode?: string,
 *   concessionId?: number
 * }
 */
router.post('/',
	strictLimiter,
	requireRecaptcha('submit_reservation'),
	asyncHandler(reservationsController.createReservation)
)

module.exports = router
