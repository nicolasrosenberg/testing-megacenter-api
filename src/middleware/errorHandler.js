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
		return res.status(err.statusCode || 500).json({
			status: 'error',
			message: getSiteLinkErrorMessage(err.retCode) || err.message,
			retCode: err.retCode,
			retMsg: err.retMsg,
			...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
		})
	}

	// Handle validation errors
	if (err.isValidationError) {
		return res.status(400).json({
			status: 'error',
			message: err.message,
			field: err.field,
			...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
		})
	}

	// Handle not found errors
	if (err.isNotFoundError) {
		return res.status(404).json({
			status: 'error',
			message: err.message,
			...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
		})
	}

	// Handle custom API errors
	if (err instanceof APIError) {
		return res.status(err.statusCode).json({
			status: 'error',
			message: err.message,
			...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
		})
	}

	// Handle SOAP/network errors
	if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
		return res.status(503).json({
			status: 'error',
			message: 'SiteLink service temporarily unavailable. Please try again.'
		})
	}

	// Default error (500)
	res.status(err.statusCode || 500).json({
		status: 'error',
		message: process.env.NODE_ENV === 'production'
			? 'Internal server error'
			: err.message,
		...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
	})
}

/**
 * 404 Not Found handler
 * Register before error handler but after all routes
 */
function notFoundHandler(req, res, next) {
	res.status(404).json({
		status: 'error',
		message: 'Endpoint not found',
		path: req.path
	})
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
