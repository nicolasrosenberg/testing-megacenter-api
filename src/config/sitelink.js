/**
 * SiteLink Configuration
 *
 * Configuration for SiteLink API
 */

const { ConfigError } = require('../utils/errors')

// SiteLink SOAP endpoints
const ENDPOINTS = {
	callCenter: 'https://api.smdservers.net/CCWs_3.5/CallCenterWs.asmx?wsdl'
}

/**
 * Get credentials from environment variables
 * @param {string} locationCode - Location code (required, passed from route)
 * @returns {object} Credentials object
 * @throws {ConfigError} If credentials are not configured
 */
function getCredentials(locationCode) {
	const corpCode = process.env.SITELINK_CORP_CODE
	const userName = process.env.SITELINK_USERNAME
	const password = process.env.SITELINK_PASSWORD

	if (!corpCode || !userName || !password) {
		throw new ConfigError(
			'SiteLink credentials not configured. Check environment variables: ' +
			'SITELINK_CORP_CODE, SITELINK_USERNAME, SITELINK_PASSWORD'
		)
	}

	if (!locationCode) {
		throw new ConfigError('Location code is required')
	}

	return {
		corpCode,
		locationCode,
		userName,
		password
	}
}

/**
 * Get base SOAP arguments with credentials
 * @param {string} locationCode - Location code (required, passed from route)
 * @returns {object} Base SOAP arguments
 */
function getBaseArgs(locationCode) {
	const creds = getCredentials(locationCode)

	return {
		sCorpCode: creds.corpCode,
		sLocationCode: creds.locationCode,
		sCorpUserName: creds.userName,
		sCorpPassword: creds.password
	}
}

/**
 * Validate that credentials are configured
 * Note: Only validates shared credentials, not location codes (those come from routes)
 * @throws {ConfigError} If credentials are missing
 */
function validateConfig() {
	const corpCode = process.env.SITELINK_CORP_CODE
	const userName = process.env.SITELINK_USERNAME
	const password = process.env.SITELINK_PASSWORD

	if (!corpCode || !userName || !password) {
		throw new ConfigError(
			'SiteLink credentials not configured. Check environment variables: ' +
			'SITELINK_CORP_CODE, SITELINK_USERNAME, SITELINK_PASSWORD'
		)
	}

	console.log('SiteLink configuration validated')
	return true
}

module.exports = {
	ENDPOINTS,
	getCredentials,
	getBaseArgs,
	validateConfig
}
