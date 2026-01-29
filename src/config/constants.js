/**
 * Application Constants
 *
 * Constants used for units endpoint
 */

// Channel types for pricing
const CHANNEL_TYPES = {
	STANDARD_RATE: 0,
	WEB_RATE: 1,
};

// Discount types (iAmtType)
const DISCOUNT_TYPES = {
	AMOUNT_OFF: 0, // Fixed amount discount
	PERCENTAGE_OFF: 1, // Percentage discount
	FIXED_RATE: 2, // Fixed price
};

// Available channels (iAvailableAt bitmask)
const AVAILABLE_CHANNELS = {
	CLIENT: 16,
	WEBSITE: 32,
	KIOSK: 64,
	CALL_CENTER: 128,
	SPAREFOOT: 256,
};

// iAvailableAt single values (when < 16)
const AVAILABLE_AT_VALUES = {
	EVERYWHERE: 0,
	CLIENT_ONLY: 1,
	WEBSITE_ONLY: 2,
	KIOSK_ONLY: 3,
	CALL_CENTER_ONLY: 4,
	SPAREFOOT_ONLY: 5,
};

// Tier levels for unit options
const TIER_LEVELS = {
	GOOD: "Standard",
	BETTER: "Plus",
	BEST: "Premium",
	PREMIUM: "Ultimate",
};

// Tier descriptions
const TIER_DESCRIPTIONS = {
	GOOD: "Perfect for everyday storage needs. Get reliable protection and secure access to your belongings at an affordable price.",
	BETTER: "Upgrade your storage experience with enhanced features and added convenience. Ideal for those who want more than just basic storage.",
	BEST: "Premium protection meets superior accessibility. Designed for customers who value their belongings and demand exceptional service.",
	PREMIUM:
		"The pinnacle of storage solutions. Maximum security, ultimate flexibility, and uncompromising quality for your most valuable possessions.",
};

// Special values for SiteLink API
const SPECIAL_VALUES = {
	NO_INSURANCE: -999,
	NO_DISCOUNT: -999,
	NO_WAITING_ID: -999,
};

module.exports = {
	CHANNEL_TYPES,
	DISCOUNT_TYPES,
	AVAILABLE_CHANNELS,
	AVAILABLE_AT_VALUES,
	TIER_LEVELS,
	TIER_DESCRIPTIONS,
	SPECIAL_VALUES,
};
