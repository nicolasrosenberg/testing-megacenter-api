/**
 * Application Constants
 *
 * Constants used for units endpoint
 */

// Channel types for pricing
const CHANNEL_TYPES = {
	STANDARD_RATE: 0,
	WEB_RATE: 1
}

// Discount types (iAmtType)
const DISCOUNT_TYPES = {
	AMOUNT_OFF: 0,       // Fixed amount discount
	PERCENTAGE_OFF: 1,   // Percentage discount
	FIXED_RATE: 2        // Fixed price
}

// Available channels (iAvailableAt bitmask)
const AVAILABLE_CHANNELS = {
	CLIENT: 16,
	WEBSITE: 32,
	KIOSK: 64,
	CALL_CENTER: 128,
	SPAREFOOT: 256
}

// iAvailableAt single values (when < 16)
const AVAILABLE_AT_VALUES = {
	EVERYWHERE: 0,
	CLIENT_ONLY: 1,
	WEBSITE_ONLY: 2,
	KIOSK_ONLY: 3,
	CALL_CENTER_ONLY: 4,
	SPAREFOOT_ONLY: 5
}

// Tier levels for unit options
const TIER_LEVELS = {
	GOOD: 'Good',
	BETTER: 'Better',
	BEST: 'Best',
	PREMIUM: 'Premium'
}

// Discount colors (17 colors for unique identification)
const DISCOUNT_COLORS = [
	'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
	'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
	'fuchsia', 'pink', 'rose'
]

// Special values for SiteLink API
const SPECIAL_VALUES = {
	NO_INSURANCE: -999,
	NO_DISCOUNT: -999,
	NO_WAITING_ID: -999
}

module.exports = {
	CHANNEL_TYPES,
	DISCOUNT_TYPES,
	AVAILABLE_CHANNELS,
	AVAILABLE_AT_VALUES,
	TIER_LEVELS,
	DISCOUNT_COLORS,
	SPECIAL_VALUES
}
