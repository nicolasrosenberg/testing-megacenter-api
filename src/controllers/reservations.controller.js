/**
 * Reservations Controller
 *
 * HTTP handlers for reservations endpoints
 */

const reservationsService = require('../services/reservations/reservations.service')
const reservationsTransformer = require('../services/reservations/reservations.transformer')
const { logInfo, logError } = require('../middleware/logger')

/**
 * Create Reservation
 * Complete flow: create tenant + create reservation
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function createReservation(req, res) {
	const locationCode = req.locationCode
	const locationSlug = req.locationSlug

	logInfo('ReservationsController', `createReservation called for ${locationSlug} (${locationCode})`)

	try {
		// Validate and normalize input
		const validatedData = reservationsTransformer.validateReservationInput(req.body)

		logInfo('ReservationsController', 'Input validated', {
			unitId: validatedData.unitId,
			firstName: validatedData.firstName,
			lastName: validatedData.lastName
		})

		// Execute reservation flow
		const result = await reservationsService.createReservationFlow(
			validatedData,
			locationCode
		)

		// Transform response
		const response = reservationsTransformer.transformReservationResponse(result)

		logInfo('ReservationsController', 'Reservation created successfully', {
			tenantId: result.tenantId,
			reservationId: result.reservationId
		})

		res.status(201).json({
			success: true,
			data: response
		})

	} catch (error) {
		// Handle validation errors
		if (error.errors && Array.isArray(error.errors)) {
			logError('ReservationsController', 'Validation error', {
				errors: error.errors
			})

			return res.status(400).json({
				success: false,
				error: 'Validation failed',
				details: error.errors
			})
		}

		// Re-throw other errors to be handled by error middleware
		throw error
	}
}

module.exports = {
	createReservation
}
