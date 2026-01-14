/**
 * Move-In Routes
 *
 * Routes for processing move-in operations
 * Base path: /:location/move-in
 */

const router = require('express').Router();
const { asyncHandler } = require('../middleware/errorHandler');
const moveInController = require('../controllers/move-in.controller');
const { strictLimiter } = require('../middleware/rateLimiter');
const { requireRecaptcha } = require('../services/recaptcha.service');

/**
 * POST /:location/move-in/process
 * Process move-in and execute payment
 *
 * SECURITY:
 * - Rate limited to 5 requests per hour per IP
 * - reCAPTCHA v3 validation (anti-bot)
 *
 * Body:
 * {
 *   // Personal Information
 *   firstName: string (required),
 *   lastName: string (required),
 *   email: string (required),
 *   phone: string (required),
 *
 *   // Unit & Date
 *   unitId: number (required),
 *   moveInDate: string (ISO format, required),
 *
 *   // Optional Discount/Insurance
 *   insuranceCoverageId?: number (-999 for none, default),
 *   concessionPlanId?: number (-999 for none, default),
 *
 *   // Payment
 *   expectedTotal: number (required),
 *   creditCardType: number (required),
 *   creditCardNumber: string (required),
 *   creditCardCVV: string (required),
 *   creditCardExpirationDate: string (MM/YY format, required),
 *
 *   // Billing
 *   billingAddress: string (required),
 *   billingZipCode: string (required),
 *
 *   // Autopay (optional)
 *   enableAutopay?: boolean (default: false),
 *
 *   // reCAPTCHA
 *   recaptchaToken: string (required)
 * }
 *
 * Response:
 * {
 *   ledgerId: number,
 *   leaseNumber: string,
 *   tenantId: number,
 *   accessCode: string,
 *   unitId: number,
 *   unitName: string,
 *   totalPaid: number,
 *   moveInDate: string,
 *   autopayEnabled: boolean,
 *   eSignUrl: string (URL for tenant to sign lease online),
 *   success: true
 * }
 */
router.post(
	'/process',
	strictLimiter,
	requireRecaptcha('submit_move_in'),
	asyncHandler(moveInController.processMoveIn)
);

module.exports = router;
