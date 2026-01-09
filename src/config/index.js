/**
 * Main Configuration
 *
 * Central configuration module that exports all config
 */

const sitelink = require('./sitelink')
const constants = require('./constants')
const locations = require('./locations')

module.exports = {
	// SiteLink configuration
	sitelink,

	// Locations configuration
	locations,

	// Constants
	...constants,

	// App configuration
	app: {
		port: process.env.PORT || 80,
		env: process.env.NODE_ENV || 'development',
		allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : null
	}
}
