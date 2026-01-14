/**
 * Move-In Controller
 *
 * HTTP handlers for move-in endpoints
 */

const moveInService = require('../services/move-in/move-in.service');
const moveInTransformer = require('../services/move-in/move-in.transformer');
const { logInfo, logError } = require('../middleware/logger');
const { success, error: formatError, ERROR_CODES } = require('../utils/response');

/**
 * Process Move-In
 * Complete validation + move-in flow
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function processMoveIn(req, res) {
	const locationCode = req.locationCode;
	const locationSlug = req.locationSlug;

	logInfo('MoveInController', `processMoveIn called for ${locationSlug} (${locationCode})`);

	try {
		// Validate and normalize input
		const validatedData = moveInTransformer.validateMoveInInput(req.body);

		logInfo('MoveInController', 'Input validated', {
			unitId: validatedData.unitId,
			firstName: validatedData.firstName,
			lastName: validatedData.lastName,
		});

		// Execute move-in flow with all validations
		const result = await moveInService.processMoveIn(validatedData, locationCode);

		// Transform response
		const response = moveInTransformer.transformMoveInResponse(result);

		logInfo('MoveInController', 'Move-in processed successfully', {
			ledgerId: result.ledgerId,
			tenantId: result.tenantId,
		});

		res.status(200).json(success(response));
	} catch (error) {
		// Handle validation errors
		if (error.errors && Array.isArray(error.errors)) {
			logError('MoveInController', 'Validation error', {
				errors: error.errors,
			});

			return res.status(400).json(
				formatError(
					ERROR_CODES.VALIDATION_ERROR,
					'Validation failed',
					{ details: error.errors }
				)
			);
		}

		if (error.name === 'ValidationError' || error.name === 'NotFoundError') {
			logError('MoveInController', 'Move-in validation failed', {
				error: error.message,
			});

			const errorCode = error.name === 'NotFoundError'
				? ERROR_CODES.NOT_FOUND
				: ERROR_CODES.VALIDATION_ERROR;
			const statusCode = error.name === 'NotFoundError' ? 404 : 400;

			return res.status(statusCode).json(
				formatError(errorCode, error.message)
			);
		}

		// Re-throw other errors to be handled by error middleware
		throw error;
	}
}

module.exports = {
	processMoveIn,
};
