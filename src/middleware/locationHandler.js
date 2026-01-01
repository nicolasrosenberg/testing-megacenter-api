/**
 * Location Handler Middleware
 *
 * Extracts location from path and validates it
 */

const config = require('../config')
const { ValidationError } = require('../utils/errors')

/**
 * Extract and validate location from path
 * Injects req.locationCode for use in controllers/services
 *
 * Usage: Place this middleware before your route handlers
 * Route structure: /:location/resource
 *
 * Example: GET /brickell/units/grouped
 *          req.params.location = 'brickell'
 *          req.locationCode = 'L010'
 */
function locationHandler(req, res, next) {
	const locationSlug = req.params.location

	if (!locationSlug) {
		throw new ValidationError('Location is required')
	}

	const locationCode = config.locations.getLocationCode(locationSlug)

	if (!locationCode) {
		const validLocations = config.locations.getLocationSlugs()
		throw new ValidationError(
			`Invalid location: ${locationSlug}. Valid locations: ${validLocations.join(', ')}`
		)
	}

	// Inject location code into request for controllers to use
	req.locationCode = locationCode
	req.locationSlug = locationSlug

	next()
}

module.exports = locationHandler
