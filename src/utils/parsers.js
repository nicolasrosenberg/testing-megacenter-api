/**
 * Shared Parsers
 *
 * Helper functions to parse SiteLink SOAP response values
 */

/**
 * Parse boolean value from SiteLink
 * @param {any} value - Value to parse
 * @returns {boolean} Boolean value
 */
function parseBoolean(value) {
	return value === 'true' || value === true
}

/**
 * Parse decimal/number from SiteLink
 * @param {any} value - Value to parse
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {number} Parsed number
 */
function parseDecimal(value, decimals = 2) {
	const num = parseFloat(value) || 0
	return Number(num.toFixed(decimals))
}

/**
 * Parse integer from SiteLink
 * @param {any} value - Value to parse
 * @returns {number} Parsed integer
 */
function parseInt(value) {
	return Number.parseInt(value) || 0
}

module.exports = {
	parseBoolean,
	parseDecimal,
	parseInt
}
