/**
 * SiteLink SOAP Client
 *
 * Shared SOAP client with error handling and logging
 */

const soap = require('soap')
const config = require('../../config')
const { SiteLinkError } = require('../../utils/errors')
const { logInfo, logError } = require('../../middleware/logger')

// Cache for SOAP clients
const clientCache = {}

/**
 * Create or get cached SOAP client
 * @param {string} type - 'callCenter'
 * @returns {Promise<object>} SOAP client
 */
async function getClient(type = 'callCenter') {
	const wsdl = config.sitelink.ENDPOINTS[type]

	if (!wsdl) {
		throw new Error(`Unknown endpoint type: ${type}`)
	}

	if (!clientCache[type]) {
		logInfo('SiteLink', `Creating SOAP client for ${type}`)

		clientCache[type] = await soap.createClientAsync(wsdl)

		logInfo('SiteLink', `SOAP client created for ${type}`)
	}

	return clientCache[type]
}

/**
 * Parse SiteLink diffgram response
 * @param {object} rawResponse - Raw SOAP response
 * @returns {object} Parsed response with data, retCode, and error info
 */
function parseResponse(rawResponse) {
	let data = null
	let retCode = 0
	let retMsg = ''
	let hasError = false

	if (rawResponse && typeof rawResponse === 'object') {
		// Check for diffgram response format
		if (rawResponse.diffgram?.NewDataSet) {
			const newDataSet = rawResponse.diffgram.NewDataSet

			// Check for RT (return table) with status codes
			if (newDataSet.RT) {
				const rtData = Array.isArray(newDataSet.RT) ? newDataSet.RT[0] : newDataSet.RT
				retCode = parseInt(rtData.Ret_Code) || 0
				retMsg = rtData.Ret_Msg || ''
				hasError = retCode < 0
			}

			// Extract actual data tables (exclude RT)
			data = {}
			for (const key in newDataSet) {
				if (key !== 'RT') {
					data[key] = newDataSet[key]
				}
			}

			// If only RT exists, use Ret_Msg as data
			if (Object.keys(data).length === 0 && retMsg) {
				data = retMsg
			}
		} else if (rawResponse.diffgram) {
			// Empty diffgram (no data)
			data = null
		} else {
			// Non-diffgram response
			data = rawResponse
		}
	} else if (typeof rawResponse === 'string') {
		data = rawResponse
	}

	return {
		data,
		retCode,
		retMsg,
		hasError,
		raw: rawResponse
	}
}

/**
 * Call a SiteLink SOAP method
 *
 * @param {string} methodName - SOAP method name
 * @param {object} args - Method arguments (credentials will be added automatically)
 * @param {string} clientType - 'callCenter' or 'reporting'
 * @param {string} locationCode - Optional location code override
 * @returns {Promise<object>} Parsed response
 * @throws {SiteLinkError} If API returns error
 */
async function callMethod(
	methodName,
	args = {},
	clientType = 'callCenter',
	locationCode = null
) {
	const client = await getClient(clientType)
	const baseArgs = config.sitelink.getBaseArgs(locationCode)
	const fullArgs = { ...baseArgs, ...args }

	// Get the async method name
	const asyncMethodName = `${methodName}Async`

	if (typeof client[asyncMethodName] !== 'function') {
		throw new Error(`Method ${methodName} not found in SiteLink ${clientType} API`)
	}

	logInfo('SiteLink', `Calling ${methodName}`, { args })

	try {
		const [result] = await client[asyncMethodName](fullArgs)

		// Get the result property (usually methodName + 'Result')
		const resultKey = `${methodName}Result`
		const rawResponse = result[resultKey]

		const parsed = parseResponse(rawResponse)

		logInfo('SiteLink', `${methodName} response`, {
			retCode: parsed.retCode,
			hasError: parsed.hasError,
			retMsg: parsed.retMsg
		})

		// Throw error if SiteLink returned error code
		if (parsed.hasError) {
			throw new SiteLinkError(parsed.retMsg, parsed.retCode, parsed.retMsg)
		}

		return parsed

	} catch (error) {
		// If it's already a SiteLinkError, re-throw
		if (error instanceof SiteLinkError) {
			logError('SiteLink', error, { methodName, args })
			throw error
		}

		// Wrap other errors
		logError('SiteLink', error, { methodName, args })
		throw new SiteLinkError(
			`Failed to call ${methodName}: ${error.message}`,
			-1,
			error.message
		)
	}
}

module.exports = {
	getClient,
	parseResponse,
	callMethod
}
