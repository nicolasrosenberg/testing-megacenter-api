/**
 * Logger Middleware
 *
 * Structured logging for all requests and responses
 */

/**
 * Request logger middleware
 */
function requestLogger(req, res, next) {
	const start = Date.now()

	// Log request
	console.log('Request ->', {
		method: req.method,
		path: req.path,
		query: req.query,
		ip: req.ip,
		userAgent: req.get('user-agent'),
		timestamp: new Date().toISOString()
	})

	// Log response on finish
	res.on('finish', () => {
		const duration = Date.now() - start
		console.log('Response ->', {
			method: req.method,
			path: req.path,
			statusCode: res.statusCode,
			duration: `${duration}ms`,
			timestamp: new Date().toISOString()
		})
	})

	next()
}

/**
 * Log info message
 */
function logInfo(context, message, data = {}) {
	console.log(`[INFO] ${context} -> ${message}`, {
		...data,
		timestamp: new Date().toISOString()
	})
}

/**
 * Log warning
 */
function logWarn(context, message, data = {}) {
	console.warn(`[WARN] ${context} -> ${message}`, {
		...data,
		timestamp: new Date().toISOString()
	})
}

/**
 * Log error
 */
function logError(context, error, data = {}) {
	console.error(`[ERROR] ${context} ->`, {
		message: error.message,
		name: error.name,
		retCode: error.retCode,
		stack: error.stack,
		...data,
		timestamp: new Date().toISOString()
	})
}

module.exports = {
	requestLogger,
	logInfo,
	logWarn,
	logError
}
