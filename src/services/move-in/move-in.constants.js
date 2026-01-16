/**
 * Move-In Constants
 *
 * Constants for move-in operations
 */

/**
 * SiteLink error codes for MoveInWithDiscount_v5
 * Negative retCode values indicate errors
 */
const MOVE_IN_ERROR_CODES = {
	'-1': 'Failed to save move in',
	'-2': 'Unit ID is not available',
	'-3': 'Unable to get insurance information/Invalid Insurance Coverage ID',
	'-4': 'Unable to get Credit Card Type ID',
	'-5': 'Unable to get payment Type ID',
	'-6': 'Charge Description error',
	'-7': 'Insurance category missing',
	'-8': 'Administrative category missing',
	'-9': 'Rent category missing',
	'-10': 'Security category missing',
	'-11': 'Payment amount does not match the required amount',
	'-12': 'Get Time Zones data error',
	'-13': 'Get Keypad Zones data error',
	'-14': 'Credit Card number is invalid',
	'-17': 'Unable to calculate Move In Cost/Invalid Concession Plan ID',
	'-20': 'Site is not setup to use Authorize.Net or PPI PayMover',
	'-21': 'No credit card configuration information found for this site',
	'-25': 'Invalid unit ID',
	'-26': 'Invalid keypad zone ID',
	'-27': 'Invalid time zone ID',
	'-28': 'Invalid billing frequency',
	'-29': 'Invalid channel type',
	'-83': 'Move in dates cannot exceed 2 months in the past',
	'-84': 'Debit transactions require bTestMode = True',
	'-95': 'Invalid TenantID',
	'-100': 'Credit Card not being authorized',
};

/**
 * Credit card types for SiteLink
 * Based on BIN (Bank Identification Number) ranges
 */
const CREDIT_CARD_TYPES = {
	MASTERCARD: 5,
	VISA: 6,
	AMEX: 7,
	DISCOVER: 8,
	DINERS: 9,
};

/**
 * Payment method types
 */
const PAYMENT_METHODS = {
	CREDIT_CARD: 0,
	CASH: 2,
	DEBIT_CARD: 3,
	ACH: 4,
};

/**
 * Default values for optional fields
 */
const DEFAULTS = {
	INSURANCE_COVERAGE_ID: -999, // No insurance
	CONCESSION_PLAN_ID: -999, // No discount
	RESERVATION_WAITING_ID: -999, // No reservation
	SOURCE: 5, // Website
	SOURCE_NAME: 'Website API',
	CHANNEL_TYPE: 1, // WebRate
	BILLING_FREQUENCY: 3, // Monthly
	ACCOUNT_TYPE: 1, // Consumer Checking
	KEYPAD_ZONE_ID: -1,
	TIME_ZONE_ID: -1,
};

/**
 * E-Sign configuration
 */
const ESIGN_CONFIG = {
	RETURN_BASE_URL: process.env.ESIGN_RETURN_BASE_URL || 'http://localhost:3000',
	FORM_IDS: '', // Empty = all default forms
};

module.exports = {
	MOVE_IN_ERROR_CODES,
	CREDIT_CARD_TYPES,
	PAYMENT_METHODS,
	DEFAULTS,
	ESIGN_CONFIG,
};
