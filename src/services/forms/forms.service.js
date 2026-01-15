/**
 * Forms Service
 *
 * Handles form submissions to HighLevel CRM via HTTP
 */

const { logInfo, logError } = require('../../middleware/logger')
const { FORM_TYPES } = require('./forms.helper')

const HIGHLEVEL_API_URL = process.env.HIGHLEVEL_API_URL || 'https://rest.gohighlevel.com/v1'
const HIGHLEVEL_API_KEY = process.env.HIGHLEVEL_API_KEY

/**
 * Submit form to HighLevel CRM
 * @param {object} formData - Validated form data
 * @returns {object} CRM response
 */
async function submitFormToCRM(formData) {
	const { formType, data } = formData

	if (!HIGHLEVEL_API_KEY) {
		logError('FormsService', 'HighLevel API key not configured')
		throw new Error('CRM integration not configured')
	}

	try {
		// Prepare contact payload for HighLevel
		const payload = buildHighLevelPayload(formType, data)

		logInfo('FormsService', 'Sending form to HighLevel', {
			formType,
			email: data.email
		})

		// Send to HighLevel API
		const response = await fetch(`${HIGHLEVEL_API_URL}/contacts/`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${HIGHLEVEL_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		})

		if (!response.ok) {
			const errorText = await response.text()
			logError('FormsService', 'HighLevel API error', {
				status: response.status,
				error: errorText
			})
			throw new Error(`HighLevel API error: ${response.status}`)
		}

		const result = await response.json()

		logInfo('FormsService', 'Form submitted to HighLevel successfully', {
			contactId: result.contact?.id
		})

		return {
			crmId: result.contact?.id || result.id,
			contactId: result.contact?.id || result.id,
			raw: result
		}

	} catch (error) {
		logError('FormsService', 'Error submitting form to CRM', {
			error: error.message,
			formType
		})
		throw error
	}
}

/**
 * Build HighLevel API payload
 * @param {string} formType - Type of form
 * @param {object} data - Form data
 * @returns {object} HighLevel payload
 */
function buildHighLevelPayload(formType, data) {
	// Base contact info
	const payload = {
		email: data.email,
		phone: data.phone,
		firstName: data.firstName,
		lastName: data.lastName,
		name: `${data.firstName} ${data.lastName}`,
		source: `website_${formType}`,
		tags: [formType]
	}

	// Custom fields based on form type
	const customFields = {}

	switch (formType) {
		case FORM_TYPES.GENERAL:
			customFields.space_type = data.spaceType
			customFields.location = data.location
			customFields.message = data.message
			break

		case FORM_TYPES.BOOK_OFFICE_TOUR:
			customFields.space_type = data.spaceType
			customFields.seats_needed = data.seatsNeeded
			break
	}

	// Add any additional data fields not already included
	Object.keys(data).forEach(key => {
		if (!['firstName', 'lastName', 'email', 'phone', 'spaceType', 'location', 'message', 'seatsNeeded'].includes(key)) {
			customFields[key] = data[key]
		}
	})

	if (Object.keys(customFields).length > 0) {
		payload.customFields = customFields
	}

	return payload
}

module.exports = {
	submitFormToCRM
}
