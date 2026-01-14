/**
 * Error Handler Middleware
 *
 * Centralized error handling for all API routes
 */

const {
	APIError,
	SiteLinkError,
	ValidationError,
	NotFoundError,
	getSiteLinkErrorMessage
} = require('../utils/errors')

const { error: formatError, ERROR_CODES } = require('../utils/response')

/**
 * Main error handler middleware
 * Must be registered AFTER all routes
 */
function errorHandler(err, req, res, next) {
	// Log error with context
	console.error('Error Handler ->', {
		name: err.name,
		message: err.message,
		statusCode: err.statusCode,
		retCode: err.retCode,
		path: req.path,
		method: req.method,
		timestamp: new Date().toISOString()
	})

	// Log stack trace in development
	if (process.env.NODE_ENV !== 'production') {
		console.error('Stack trace:', err.stack)
	}

	// Handle SiteLink errors
	if (err.isSiteLinkError || err.retCode) {
		return res.status(err.statusCode || 500).json(
			formatError(
				ERROR_CODES.SITELINK_ERROR,
				getSiteLinkErrorMessage(err.retCode) || err.message,
				{
					retCode: err.retCode,
					retMsg: err.retMsg,
					stack: err.stack
				}
			)
		)
	}

	// Handle validation errors
	if (err.isValidationError) {
		return res.status(400).json(
			formatError(
				ERROR_CODES.VALIDATION_ERROR,
				err.message,
				{
					field: err.field,
					stack: err.stack
				}
			)
		)
	}

	// Handle not found errors
	if (err.isNotFoundError) {
		return res.status(404).json(
			formatError(
				ERROR_CODES.NOT_FOUND,
				err.message,
				{
					stack: err.stack
				}
			)
		)
	}

	// Handle custom API errors
	if (err instanceof APIError) {
		return res.status(err.statusCode).json(
			formatError(
				ERROR_CODES.BAD_REQUEST,
				err.message,
				{
					stack: err.stack
				}
			)
		)
	}

	// Handle SOAP/network errors
	if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
		return res.status(503).json(
			formatError(
				ERROR_CODES.SERVICE_UNAVAILABLE,
				'SiteLink service temporarily unavailable. Please try again.'
			)
		)
	}

	// Default error (500)
	res.status(err.statusCode || 500).json(
		formatError(
			ERROR_CODES.INTERNAL_ERROR,
			process.env.NODE_ENV === 'production'
				? 'Internal server error'
				: err.message,
			{
				stack: err.stack
			}
		)
	)
}

/**
 * 404 Not Found handler
 * Register before error handler but after all routes
 */
function notFoundHandler(req, res, next) {
	res.status(404).json(
		formatError(
			ERROR_CODES.ENDPOINT_NOT_FOUND,
			`Endpoint not found: ${req.path}`
		)
	)
}

/**
 * Async route wrapper to catch async errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next)
	}
}

module.exports = {
	errorHandler,
	notFoundHandler,
	asyncHandler
}
