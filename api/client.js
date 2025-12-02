/**
 * SiteLink SOAP Client
 * 
 * Shared SOAP client configuration and utilities for SiteLink API
 */

const soap = require('soap')

// SiteLink SOAP endpoints
const ENDPOINTS = {
	callCenter: {
		url: 'https://api.smdservers.net/CCWs_3.5/CallCenterWs.asmx',
		wsdl: 'https://api.smdservers.net/CCWs_3.5/CallCenterWs.asmx?wsdl'
	},
	reporting: {
		url: 'https://api.smdservers.net/CCWs_3.5/ReportingWs.asmx',
		wsdl: 'https://api.smdservers.net/CCWs_3.5/ReportingWs.asmx?wsdl'
	}
}

// Cache for SOAP clients
const clientCache = {}

/**
 * Get SiteLink credentials from environment variables
 */
function getCredentials() {
	const corpCode = process.env.SITELINK_CORP_CODE
	const locationCode = process.env.SITELINK_LOCATION_CODE
	const userName = process.env.SITELINK_USERNAME
	const password = process.env.SITELINK_PASSWORD

	if (!corpCode || !locationCode || !userName || !password) {
		throw new Error('SiteLink credentials not configured. Check environment variables.')
	}

	return { corpCode, locationCode, userName, password }
}

/**
 * Get base SOAP arguments with credentials
 */
function getBaseArgs(locationCodeOverride = null) {
	const { corpCode, locationCode, userName, password } = getCredentials()

	return {
		sCorpCode: corpCode,
		sLocationCode: locationCodeOverride || locationCode,
		sCorpUserName: userName,
		sCorpPassword: password
	}
}

/**
 * Create or get cached SOAP client
 * @param {string} type - 'callCenter' or 'reporting'
 */
async function getClient(type = 'callCenter') {
	if (!ENDPOINTS[type]) {
		throw new Error(`Unknown endpoint type: ${type}`)
	}

	if (!clientCache[type]) {
		const endpoint = ENDPOINTS[type]
		clientCache[type] = await soap.createClientAsync(endpoint.wsdl, {
			endpoint: endpoint.url
		})
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
 * @param {string} methodName - SOAP method name
 * @param {object} args - Method arguments (credentials will be added automatically)
 * @param {string} clientType - 'callCenter' or 'reporting'
 * @param {string} locationCode - Optional location code override
 */
async function callMethod(methodName, args = {}, clientType = 'callCenter', locationCode = null) {
	const client = await getClient(clientType)
	const baseArgs = getBaseArgs(locationCode)
	
	const fullArgs = { ...baseArgs, ...args }
	
	// Get the async method name
	const asyncMethodName = `${methodName}Async`
	
	if (typeof client[asyncMethodName] !== 'function') {
		throw new Error(`Method ${methodName} not found in SiteLink ${clientType} API`)
	}

	console.log(`SiteLink -> Calling ${methodName}`, JSON.stringify(args, null, 2))
	
	const [result] = await client[asyncMethodName](fullArgs)
	
	// Get the result property (usually methodName + 'Result')
	const resultKey = `${methodName}Result`
	const rawResponse = result[resultKey]
	
	const parsed = parseResponse(rawResponse)
	
	console.log(`SiteLink -> ${methodName} response:`, { 
		retCode: parsed.retCode, 
		hasError: parsed.hasError,
		retMsg: parsed.retMsg
	})

	if (parsed.hasError) {
		const error = new Error(parsed.retMsg || 'SiteLink API error')
		error.retCode = parsed.retCode
		error.retMsg = parsed.retMsg
		throw error
	}

	return parsed
}

/**
 * List all available methods in a SOAP client
 * @param {string} clientType - 'callCenter' or 'reporting'
 */
async function listMethods(clientType = 'callCenter') {
	const client = await getClient(clientType)
	return client.describe()
}

module.exports = {
	ENDPOINTS,
	getCredentials,
	getBaseArgs,
	getClient,
	parseResponse,
	callMethod,
	listMethods
}
