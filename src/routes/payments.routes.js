/**
 * Payments Routes
 */

const router = require('express').Router()
const { asyncHandler } = require('../middleware/errorHandler')
const paymentsController = require('../controllers/payments.controller')
const { strictLimiter } = require('../middleware/rateLimiter')
const { requireRecaptcha } = require('../services/recaptcha.service')

/**
 * POST /api/:location/payments/process
 * Process payment and execute move-in
 *
 * SECURITY:
 * - Rate limited to 5 requests per hour per IP
 * - reCAPTCHA v3 validation (anti-bot)
 *
 * Body:
 * - tenantId: number (from reservation)
 * - gateCode: string (tenant access code)
 * - unitId: number
 * - moveInDate: string (ISO format)
 * - moveInEndDate: string (ISO format)
 * - insuranceCoverageId?: number (-999 for none)
 * - concessionPlanId?: number (-999 for none)
 * - reservationWaitingId?: number (-999 if no reservation)
 * - expectedTotal: number
 * - payment: object (card details)
 * - recaptchaToken: string
 */
router.post(
	'/process',
	strictLimiter,
	requireRecaptcha('submit_payment'),
	asyncHandler(paymentsController.processPayment)
)

module.exports = router
