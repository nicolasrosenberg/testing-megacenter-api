/**
 * Location Configuration
 *
 * Maps location slugs to SiteLink location codes
 */

const LOCATIONS = {
	brickell: "L010",
	memorial: "L012",
	willowbrook: "L008",
	demo: "DEMO",
};

/**
 * Get location code from slug
 * @param {string} slug - Location slug (brickell, memorial, willowbrook)
 * @returns {string|null} Location code or null if not found
 */
function getLocationCode(slug) {
	return LOCATIONS[slug?.toLowerCase()] || null;
}

/**
 * Validate location slug
 * @param {string} slug - Location slug
 * @returns {boolean} True if valid
 */
function isValidLocation(slug) {
	return slug?.toLowerCase() in LOCATIONS;
}

/**
 * Get all location slugs
 * @returns {string[]} Array of location slugs
 */
function getLocationSlugs() {
	return Object.keys(LOCATIONS);
}

module.exports = {
	LOCATIONS,
	getLocationCode,
	isValidLocation,
	getLocationSlugs,
};
