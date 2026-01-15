/**
 * Forms Helper
 *
 * Validates form data
 */

const FORM_TYPES = {
	GENERAL: 'general',
	BOOK_OFFICE_TOUR: 'book_office_tour'
}

/**
 * Validate form input
 * @param {object} body - Request body
 * @returns {object} Validated data
 */
function validateFormInput(body) {
	const errors = []
	const { formType, data, recaptchaToken } = body

	// Validate form type
	if (!formType) {
		errors.push({ field: 'formType', message: 'Form type is required' })
	} else if (!Object.values(FORM_TYPES).includes(formType)) {
		errors.push({
			field: 'formType',
			message: `Invalid form type. Must be one of: ${Object.values(FORM_TYPES).join(', ')}`
		})
	}

	// Validate data object
	if (!data || typeof data !== 'object') {
		errors.push({ field: 'data', message: 'Form data is required and must be an object' })
	} else {
		// Validate required fields based on form type
		const fieldErrors = validateFormFields(formType, data)
		errors.push(...fieldErrors)
	}

	if (errors.length > 0) {
		const error = new Error('Validation failed')
		error.errors = errors
		throw error
	}

	return {
		formType,
		data,
		recaptchaToken
	}
}

/**
 * Validate form fields based on type
 * @param {string} formType - Type of form
 * @param {object} data - Form data
 * @returns {array} Array of errors
 */
function validateFormFields(formType, data) {
	const errors = []

	// Common fields for all forms
	if (!data.firstName || !data.firstName.trim()) {
		errors.push({ field: 'data.firstName', message: 'First name is required' })
	}

	if (!data.lastName || !data.lastName.trim()) {
		errors.push({ field: 'data.lastName', message: 'Last name is required' })
	}

	if (!data.email || !data.email.trim()) {
		errors.push({ field: 'data.email', message: 'Email is required' })
	} else if (!isValidEmail(data.email)) {
		errors.push({ field: 'data.email', message: 'Invalid email format' })
	}

	if (!data.phone || !data.phone.trim()) {
		errors.push({ field: 'data.phone', message: 'Phone is required' })
	}

	// Type-specific validations
	switch (formType) {
		case FORM_TYPES.GENERAL:
			if (!data.spaceType) {
				errors.push({ field: 'data.spaceType', message: 'Space type is required' })
			} else if (!['storage', 'office'].includes(data.spaceType)) {
				errors.push({ field: 'data.spaceType', message: 'Space type must be "storage" or "office"' })
			}

			if (!data.location || !data.location.trim()) {
				errors.push({ field: 'data.location', message: 'Location is required' })
			}

			if (!data.message || !data.message.trim()) {
				errors.push({ field: 'data.message', message: 'Message is required' })
			}
			break

		case FORM_TYPES.BOOK_OFFICE_TOUR:
			if (!data.spaceType) {
				errors.push({ field: 'data.spaceType', message: 'Space type is required' })
			} else if (!['private', 'coworking', 'general'].includes(data.spaceType)) {
				errors.push({ field: 'data.spaceType', message: 'Space type must be "private", "coworking", or "general"' })
			}

			if (!data.seatsNeeded) {
				errors.push({ field: 'data.seatsNeeded', message: 'Seats needed is required' })
			} else if (!Number.isInteger(Number(data.seatsNeeded)) || Number(data.seatsNeeded) < 1) {
				errors.push({ field: 'data.seatsNeeded', message: 'Seats needed must be a positive number' })
			}
			break
	}

	return errors
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

module.exports = {
	FORM_TYPES,
	validateFormInput
}
