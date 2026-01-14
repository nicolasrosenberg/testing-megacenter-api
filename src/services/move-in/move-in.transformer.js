/**
 * Move-In Transformer
 *
 * Transform move-in data between API and SiteLink formats
 */

/**
 * Validate and normalize move-in input data
 *
 * @param {object} data - Raw input data from request
 * @returns {object} Validated and normalized data
 * @throws {Error} If required fields are missing or invalid
 */
function validateMoveInInput(data) {
	const errors = [];

	// Required fields - Personal Info
	if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim() === '') {
		errors.push('firstName is required and must be a non-empty string');
	}

	if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim() === '') {
		errors.push('lastName is required and must be a non-empty string');
	}

	if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) {
		errors.push('email is required and must be a valid email address');
	}

	if (!data.phone || typeof data.phone !== 'string' || data.phone.trim() === '') {
		errors.push('phone is required and must be a non-empty string');
	}

	// Required fields - Unit & Date
	if (!data.unitId || typeof data.unitId !== 'number') {
		errors.push('unitId is required and must be a number');
	}

	if (!data.moveInDate || !isValidDate(data.moveInDate)) {
		errors.push('moveInDate is required and must be a valid ISO date string');
	}

	// Required fields - Payment
	if (data.expectedTotal === undefined || typeof data.expectedTotal !== 'number') {
		errors.push('expectedTotal is required and must be a number');
	}

	if (!data.creditCardType || typeof data.creditCardType !== 'string') {
		errors.push('creditCardType is required and must be a string (visa, mastercard, amex, discover, dinersclub)');
	}

	if (!data.creditCardNumber || typeof data.creditCardNumber !== 'string') {
		errors.push('creditCardNumber is required and must be a string');
	}

	if (!data.creditCardCVV || typeof data.creditCardCVV !== 'string') {
		errors.push('creditCardCVV is required and must be a string');
	}

	if (!data.creditCardExpirationDate || typeof data.creditCardExpirationDate !== 'string') {
		errors.push('creditCardExpirationDate is required and must be a string');
	}

	// Required fields - Billing
	if (!data.billingAddress || typeof data.billingAddress !== 'string') {
		errors.push('billingAddress is required and must be a string');
	}

	if (!data.billingZipCode || typeof data.billingZipCode !== 'string') {
		errors.push('billingZipCode is required and must be a string');
	}

	if (errors.length > 0) {
		const error = new Error('Validation failed');
		error.errors = errors;
		throw error;
	}

	// Normalize data
	return {
		// Personal info
		firstName: data.firstName.trim(),
		lastName: data.lastName.trim(),
		email: data.email.trim().toLowerCase(),
		phone: normalizePhone(data.phone),

		// Unit & Date
		unitId: data.unitId,
		moveInDate: data.moveInDate,

		// Optional discount/insurance
		insuranceCoverageId: data.insuranceCoverageId || -999,
		concessionPlanId: data.concessionPlanId || -999,

		// Payment
		expectedTotal: data.expectedTotal,
		creditCardType: data.creditCardType.trim().toLowerCase(),
		creditCardNumber: data.creditCardNumber.trim(),
		creditCardCVV: data.creditCardCVV.trim(),
		creditCardExpirationDate: data.creditCardExpirationDate.trim(),

		// Billing
		billingAddress: data.billingAddress.trim(),
		billingZipCode: data.billingZipCode.trim(),

		// Autopay (opcional)
		enableAutopay: data.enableAutopay === true || data.enableAutopay === 'true',
	};
}

/**
 * Transform move-in service result to API response format
 *
 * @param {object} result - Result from move-in service
 * @returns {object} Formatted API response
 */
function transformMoveInResponse(result) {
	return {
		ledgerId: result.ledgerId,
		leaseNumber: result.leaseNumber,
		tenantId: result.tenantId,
		accessCode: result.accessCode,
		unitId: result.unitId,
		unitName: result.unitName,
		totalPaid: result.totalPaid,
		moveInDate: result.moveInDate,
		autopayEnabled: result.autopayEnabled || false,
		eSignUrl: result.eSignUrl,
		success: true,
	};
}

/**
 * Helper: Validate email format
 * Prevents injection and malicious emails
 *
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
	// Stricter regex for emails
	const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	// Additional validations
	if (!emailRegex.test(email)) {
		return false;
	}

	// Prevent very long emails (possible attack)
	if (email.length > 254) {
		return false;
	}

	// Prevent multiple @ (some parsers can be vulnerable)
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
 * Validates format and prevents malicious inputs
 *
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone number
 */
function normalizePhone(phone) {
	// Keep only digits and leading +
	let normalized = phone.replace(/[^\d+]/g, '');

	// Validate reasonable length (5-20 characters)
	if (normalized.length < 5 || normalized.length > 20) {
		throw new Error('Phone number must be between 5 and 20 digits');
	}

	// Validate format: only one + at the beginning if it exists
	const plusCount = (normalized.match(/\+/g) || []).length;
	if (plusCount > 1 || (plusCount === 1 && normalized[0] !== '+')) {
		throw new Error('Invalid phone number format');
	}

	return normalized;
}

module.exports = {
	validateMoveInInput,
	transformMoveInResponse,
};
