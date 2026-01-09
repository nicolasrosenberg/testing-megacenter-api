/**
 * Reservations Transformer
 *
 * Transform reservation data between API and SiteLink formats
 */

/**
 * Validate and normalize reservation input data
 *
 * @param {object} data - Raw input data from request
 * @returns {object} Validated and normalized data
 * @throws {Error} If required fields are missing or invalid
 */
function validateReservationInput(data) {
	const errors = [];

	// Required fields
	if (!data.unitId || typeof data.unitId !== "number") {
		errors.push("unitId is required and must be a number");
	}

	if (
		!data.firstName ||
		typeof data.firstName !== "string" ||
		data.firstName.trim() === ""
	) {
		errors.push("firstName is required and must be a non-empty string");
	}

	if (
		!data.lastName ||
		typeof data.lastName !== "string" ||
		data.lastName.trim() === ""
	) {
		errors.push("lastName is required and must be a non-empty string");
	}

	if (
		!data.email ||
		typeof data.email !== "string" ||
		!isValidEmail(data.email)
	) {
		errors.push("email is required and must be a valid email address");
	}

	if (
		!data.phone ||
		typeof data.phone !== "string" ||
		data.phone.trim() === ""
	) {
		errors.push("phone is required and must be a non-empty string");
	}

	if (!data.moveInDate || !isValidDate(data.moveInDate)) {
		errors.push(
			"moveInDate is required and must be a valid ISO date string"
		);
	}

	if (errors.length > 0) {
		const error = new Error("Validation failed");
		error.errors = errors;
		throw error;
	}

	// Normalize data
	return {
		unitId: data.unitId,
		firstName: data.firstName.trim(),
		lastName: data.lastName.trim(),
		email: data.email.trim().toLowerCase(),
		phone: normalizePhone(data.phone),
		moveInDate: data.moveInDate,
		comment: data.comment ? String(data.comment).trim() : "",
		address: data.address ? String(data.address).trim() : "",
		city: data.city ? String(data.city).trim() : "",
		state: data.state ? String(data.state).trim() : "",
		zipCode: data.zipCode ? String(data.zipCode).trim() : "",
		concessionId: data.concessionId || -999,
	};
}

/**
 * Transform reservation service result to API response format
 *
 * @param {object} result - Result from reservations service
 * @param {number} result.tenantId - Tenant ID
 * @param {string} result.accessCode - Access code
 * @param {number} result.reservationId - Waiting list ID
 * @param {string} result.globalWaitingNum - Global waiting number
 * @returns {object} Formatted API response
 */
function transformReservationResponse(result) {
	return {
		tenantId: result.tenantId,
		reservationId: result.reservationId,
		accessCode: result.accessCode,
	};
}

/**
 * Helper: Validate email format
 * Mejorado para prevenir inyección y emails maliciosos
 *
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
	// Regex más estricto para emails
	const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	// Validaciones adicionales
	if (!emailRegex.test(email)) {
		return false;
	}

	// Prevenir emails muy largos (posible ataque)
	if (email.length > 254) {
		return false;
	}

	// Prevenir múltiples @ (algunos parsers pueden ser vulnerables)
	if ((email.match(/@/g) || []).length !== 1) {
		return false;
	}

	return true;
}

/**
 * Helper: Validate ISO date string
 *
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid ISO date
 */
function isValidDate(dateString) {
	const date = new Date(dateString);
	return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Helper: Normalize phone number (remove non-digits, keep +)
 * Mejorado para validar formato y prevenir inputs maliciosos
 *
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone number
 */
function normalizePhone(phone) {
	// Keep only digits and leading +
	let normalized = phone.replace(/[^\d+]/g, "");

	// Validar longitud razonable (5-20 caracteres)
	if (normalized.length < 5 || normalized.length > 20) {
		throw new Error('Phone number must be between 5 and 20 digits');
	}

	// Validar formato: solo un + al inicio si existe
	const plusCount = (normalized.match(/\+/g) || []).length;
	if (plusCount > 1 || (plusCount === 1 && normalized[0] !== '+')) {
		throw new Error('Invalid phone number format');
	}

	return normalized;
}

module.exports = {
	validateReservationInput,
	transformReservationResponse,
};
