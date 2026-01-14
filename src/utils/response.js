/**
 * Standard API Response Utilities
 *
 * Provides consistent response formatting across all endpoints
 */

/**
 * Creates a standardized success response
 * @param {Object} data - The response payload
 * @param {Object} meta - Optional metadata (pagination, location, etc.)
 * @returns {Object} Formatted success response
 */
const success = (data, meta = null) => {
  const response = {
    success: true,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
};

/**
 * Creates a standardized error response
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable error message
 * @param {Object} options - Optional error details
 * @param {Array} options.details - Validation error details
 * @param {number} options.retCode - SiteLink error code
 * @param {string} options.retMsg - SiteLink error message
 * @param {string} options.field - Field that caused the error
 * @returns {Object} Formatted error response
 */
const error = (code, message, options = {}) => {
  const response = {
    success: false,
    error: {
      code,
      message
    }
  };

  // Add optional fields if provided
  if (options.details) {
    response.error.details = options.details;
  }

  if (options.retCode !== undefined) {
    response.error.retCode = options.retCode;
  }

  if (options.retMsg) {
    response.error.retMsg = options.retMsg;
  }

  if (options.field) {
    response.error.field = options.field;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production' && options.stack) {
    response.error.stack = options.stack;
  }

  return response;
};

/**
 * Common error codes
 */
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SITELINK_ERROR: 'SITELINK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND'
};

module.exports = {
  success,
  error,
  ERROR_CODES
};
