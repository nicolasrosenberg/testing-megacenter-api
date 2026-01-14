/**
 * Move-In Helpers
 *
 * Helper functions for move-in operations
 */

const { CREDIT_CARD_TYPES } = require('./move-in.constants');

/**
 * Map credit card type string to SiteLink credit card type ID
 *
 * @param {string} cardType - Credit card type string (visa, mastercard, amex, discover, dinersclub)
 * @returns {number} Credit card type ID for SiteLink
 */
function mapCardTypeToId(cardType) {
	const cardTypeMap = {
		visa: CREDIT_CARD_TYPES.VISA,
		mastercard: CREDIT_CARD_TYPES.MASTERCARD,
		amex: CREDIT_CARD_TYPES.AMEX,
		discover: CREDIT_CARD_TYPES.DISCOVER,
		dinersclub: CREDIT_CARD_TYPES.DINERS,
	};

	// Normalize to lowercase and get the ID
	const normalizedType = cardType?.toLowerCase?.();
	return cardTypeMap[normalizedType] || CREDIT_CARD_TYPES.VISA; // Default to Visa
}

/**
 * Convert expiration date to ISO format YYYY-MM-DDT23:59:59
 * Supports MM/YY (credit card format) or MM/DD/YYYY
 *
 * @param {string} expirationDate - Expiration date (MM/YY or MM/DD/YYYY)
 * @returns {string} ISO format date string
 */
function convertExpirationDateToISO(expirationDate) {
	if (!expirationDate) {
		return '';
	}

	const parts = expirationDate.split('/');

	if (parts.length === 2) {
		// MM/YY format (standard credit card expiration)
		const [month, year] = parts;
		const fullYear = year.length === 2 ? `20${year}` : year;
		// Use last day of the month at 23:59:59
		const lastDay = new Date(parseInt(fullYear), parseInt(month), 0).getDate();
		return `${fullYear}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}T23:59:59`;
	} else if (parts.length === 3) {
		// MM/DD/YYYY format
		const [month, day, year] = parts;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59`;
	}

	return '';
}

/**
 * Build billing name from first and last name
 *
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Full billing name
 */
function buildBillingName(firstName, lastName) {
	return `${firstName || ''} ${lastName || ''}`.trim();
}

module.exports = {
	mapCardTypeToId,
	convertExpirationDateToISO,
	buildBillingName,
};
