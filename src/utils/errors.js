/**
 * Custom Error Classes
 *
 * Defines custom error types for better error handling throughout the application
 */

/**
 * Base API Error
 */
class APIError extends Error {
	constructor(message, statusCode = 500, retCode = null) {
		super(message)
		this.name = this.constructor.name
		this.statusCode = statusCode
		this.retCode = retCode
		Error.captureStackTrace(this, this.constructor)
	}
}

/**
 * SiteLink SOAP API Error
 */
class SiteLinkError extends APIError {
	constructor(message, retCode, retMsg = null) {
		const statusCode = mapSiteLinkErrorToHTTP(retCode)
		super(message || retMsg || 'SiteLink API error', statusCode, retCode)
		this.retMsg = retMsg
		this.isSiteLinkError = true
	}
}

/**
 * Validation Error
 */
class ValidationError extends APIError {
	constructor(message, field = null) {
		super(message, 400)
		this.field = field
		this.isValidationError = true
	}
}

/**
 * Not Found Error
 */
class NotFoundError extends APIError {
	constructor(resource = 'Resource') {
		super(`${resource} not found`, 404)
		this.isNotFoundError = true
	}
}

/**
 * Cache Error
 */
class CacheError extends APIError {
	constructor(message) {
		super(`Cache error: ${message}`, 500)
		this.isCacheError = true
	}
}

/**
 * Configuration Error
 */
class ConfigError extends APIError {
	constructor(message) {
		super(`Configuration error: ${message}`, 500)
		this.isConfigError = true
	}
}

/**
 * Map SiteLink error codes to HTTP status codes
 * Based on official SiteLink API documentation (docs/api.json)
 * @param {number} retCode - SiteLink return code
 * @returns {number} HTTP status code
 */
function mapSiteLinkErrorToHTTP(retCode) {
	const errorMap = {
		// Success
		'1': 200,    // Success

		// Not found / No data (4xx)
		'0': 404,    // No data found
		'-24': 404,  // Invalid Ledger ID
		'-25': 404,  // Invalid Unit ID
		'-95': 404,  // Invalid Tenant ID

		// Bad request (4xx)
		'-2': 409,   // Unit not available / Invalid concession / Duplicate gate code / Error saving
		'-3': 400,   // Invalid concession plan ID / Invalid insurance coverage ID / Failed to get tenant data
		'-4': 400,   // Failed to save tenant update / Unable to get Credit Card Type ID
		'-5': 400,   // Error calling function / Unable to get payment Type ID
		'-6': 400,   // General Failure
		'-7': 400,   // Failed to get tenant schema
		'-11': 400,  // Payment amount mismatch
		'-14': 400,  // Credit card number is invalid
		'-17': 400,  // Invalid Concession Plan ID
		'-20': 400,  // Site not setup for Authorize.Net
		'-21': 400,  // No credit card config for site
		'-26': 400,  // Invalid keypad zone ID / Error getting rent tax rates
		'-27': 400,  // Invalid time zone ID
		'-28': 400,  // Invalid billing frequency
		'-29': 400,  // Invalid channel type
		'-83': 400,  // Move in dates cannot exceed 2 months in past
		'-84': 400,  // Debit transactions require bTestMode
		'-100': 402, // Credit Card not authorized (Payment Required)

		// Server errors (5xx)
		'-1': 500,   // General failure / Unable to connect to database / Last name and access code required
	}

	return errorMap[String(retCode)] || 500
}

/**
 * Get user-friendly error message from SiteLink error code
 * Based on official SiteLink API documentation (docs/api.json)
 * @param {number} retCode - SiteLink return code
 * @returns {string} User-friendly message
 */
function getSiteLinkErrorMessage(retCode) {
	const messages = {
		// Success
		'1': 'Success',

		// Not found
		'0': 'No data available.',
		'-24': 'Lease not found.',
		'-25': 'Unit not found.',
		'-95': 'Tenant not found.',

		// General errors
		'-1': 'Unable to process request. Please try again.',
		'-2': 'The selected unit is no longer available or there was an error saving.',
		'-3': 'Invalid discount or insurance selection.',
		'-4': 'Failed to save information.',
		'-5': 'Error processing request.',
		'-6': 'General failure.',
		'-7': 'Failed to retrieve data schema.',

		// Payment errors
		'-11': 'Payment amount has changed. Please review and try again.',
		'-14': 'Invalid credit card number.',
		'-17': 'Invalid discount code.',
		'-20': 'Site not setup for credit card processing.',
		'-21': 'No credit card configuration found.',
		'-100': 'Credit card payment was declined.',

		// Validation errors
		'-26': 'Invalid access zone or tax rate configuration.',
		'-27': 'Invalid time zone.',
		'-28': 'Invalid billing frequency.',
		'-29': 'Invalid rate type.',
		'-83': 'Move-in date cannot be more than 2 months in the past.',
		'-84': 'Debit transactions are not available in production mode.',
	}

	return messages[String(retCode)] || 'An error occurred while processing your request.'
}

module.exports = {
	APIError,
	SiteLinkError,
	ValidationError,
	NotFoundError,
	CacheError,
	ConfigError,
	mapSiteLinkErrorToHTTP,
	getSiteLinkErrorMessage
}
