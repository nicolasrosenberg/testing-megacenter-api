/**
 * Move-In Transformer
 *
 * Transform move-in data between API and SiteLink formats
 */

/**
 * Validation schema for move-in input data
 */
const VALIDATION_SCHEMA = {
	// Unit & Date & Expected Total & Concession Plan
	unitId: { type: "number", required: true },
	moveInDate: { type: "date", required: true },
	expectedTotal: { type: "number", required: true },
	concessionPlanId: { type: "number", required: false, default: -999 },

	// Tenant Personal info
	tenantFirstName: { type: "string", required: true, trim: true },
	tenantLastName: { type: "string", required: true, trim: true },
	tenantEmail: {
		type: "email",
		required: true,
		trim: true,
		toLowerCase: true,
	},
	tenantPhone: { type: "phone", required: true },
	tenantAddress: { type: "string", required: true, trim: true },
	tenantAddress2: {
		type: "string",
		required: false,
		trim: true,
		default: "",
	},
	tenantCity: { type: "string", required: true, trim: true },
	tenantState: { type: "string", required: true, trim: true },
	tenantZipCode: { type: "string", required: true, trim: true },
	tenantDateOfBirth: { type: "date", required: true },
	tenantIsMilitary: { type: "boolean", required: true },

	// Tenant ID
	tenantIdType: {
		type: "enum",
		required: true,
		values: ["driver_license", "passport"],
	},
	tenantIdNumber: { type: "string", required: true, trim: true },
	tenantIdState: { type: "string", required: true, trim: true },
	tenantIdImageData: { type: "string", required: true },
	tenantIdImageFilename: {
		type: "string",
		required: false,
		trim: true,
		default: "",
	},

	// Storage Details
	storageUse: {
		type: "enum",
		required: true,
		values: ["personal", "business"],
	},
	storageDescription: { type: "string", required: true, trim: true },
	estimatedValue: { type: "number", required: true },
	businessName: { type: "string", required: false, trim: true, default: "" },
	taxId: { type: "string", required: false, trim: true, default: "" },
	alternateContactFirstName: {
		type: "string",
		required: false,
		trim: true,
		default: "",
	},
	alternateContactLastName: {
		type: "string",
		required: false,
		trim: true,
		default: "",
	},
	alternateContactEmail: {
		type: "string",
		required: false,
		trim: true,
		default: "",
	},
	alternateContactPhone: { type: "phone", required: false, default: "" },

	// Insurance
	insuranceCoverageId: { type: "number", required: false, default: -999 },
	insuranceCompanyName: {
		type: "string",
		required: false,
		trim: true,
		default: "",
	},
	insurancePolicyNumber: {
		type: "string",
		required: false,
		trim: true,
		default: "",
	},
	insuranceCoverageLevel: {
		type: "number",
		required: false,
		default: 0,
	},
	insurancePolicyStartDate: { type: "date", required: false },
	insurancePolicyEndDate: { type: "date", required: false },

	// Payment & Billing
	billingFirstName: { type: "string", required: true, trim: true },
	billingLastName: { type: "string", required: true, trim: true },
	billingAddress: { type: "string", required: true, trim: true },
	billingAddress2: {
		type: "string",
		required: false,
		trim: true,
		default: "",
	},
	billingCity: { type: "string", required: true, trim: true },
	billingState: { type: "string", required: true, trim: true },
	billingZipCode: { type: "string", required: true, trim: true },
	billingCardType: { type: "string", required: true, trim: true },
	billingCardNumber: { type: "string", required: true, trim: true },
	billingCardCVV: { type: "string", required: true, trim: true },
	billingCardExpirationDate: { type: "string", required: true, trim: true },

	// Autopay
	enableAutopay: { type: "boolean", required: false, default: false },
};

/**
 * Validate a single field based on schema
 *
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @param {object} schema - Field schema
 * @returns {object} { valid: boolean, error: string|null, normalizedValue: any }
 */
function validateField(fieldName, value, schema) {
	// Handle required fields
	if (schema.required) {
		if (
			value === undefined ||
			value === null ||
			(typeof value === "string" && value.trim() === "")
		) {
			return {
				valid: false,
				error: `${fieldName} is required`,
				normalizedValue: null,
			};
		}
	} else {
		// Optional field - use default if not provided
		if (value === undefined || value === null || value === "") {
			return {
				valid: true,
				error: null,
				normalizedValue:
					schema.default !== undefined ? schema.default : null,
			};
		}
	}

	// Validate and normalize by type
	let normalizedValue = value;

	switch (schema.type) {
		case "string":
			if (typeof value !== "string") {
				return {
					valid: false,
					error: `${fieldName} must be a string`,
					normalizedValue: null,
				};
			}
			if (schema.trim) {
				normalizedValue = value.trim();
			}
			if (schema.toLowerCase) {
				normalizedValue = normalizedValue.toLowerCase();
			}
			break;

		case "number":
			if (typeof value !== "number" || isNaN(value)) {
				return {
					valid: false,
					error: `${fieldName} must be a number`,
					normalizedValue: null,
				};
			}
			normalizedValue = value;
			break;

		case "boolean":
			normalizedValue = value === true || value === "true";
			break;

		case "date":
			if (!isValidDate(value)) {
				return {
					valid: false,
					error: `${fieldName} must be a valid ISO date string`,
					normalizedValue: null,
				};
			}
			// Format date to ISO 8601 with time set to 00:00:00 UTC
			const date = new Date(value);
			date.setUTCHours(0, 0, 0, 0);
			normalizedValue = date.toISOString();
			break;

		case "email":
			if (typeof value !== "string" || !isValidEmail(value)) {
				return {
					valid: false,
					error: `${fieldName} must be a valid email address`,
					normalizedValue: null,
				};
			}
			normalizedValue = value.trim();
			if (schema.toLowerCase) {
				normalizedValue = normalizedValue.toLowerCase();
			}
			break;

		case "phone":
			if (typeof value !== "string") {
				return {
					valid: false,
					error: `${fieldName} must be a valid phone number`,
					normalizedValue: null,
				};
			}
			try {
				normalizedValue = normalizePhone(value);
			} catch (error) {
				return {
					valid: false,
					error: `${fieldName}: ${error.message}`,
					normalizedValue: null,
				};
			}
			break;

		case "enum":
			if (!schema.values.includes(value)) {
				return {
					valid: false,
					error: `${fieldName} must be one of: ${schema.values.join(", ")}`,
					normalizedValue: null,
				};
			}
			normalizedValue = value;
			break;

		default:
			return {
				valid: false,
				error: `Unknown validation type for ${fieldName}`,
				normalizedValue: null,
			};
	}

	return { valid: true, error: null, normalizedValue };
}

/**
 * Validate and normalize move-in input data
 *
 * @param {object} data - Raw input data from request
 * @returns {object} Validated and normalized data
 * @throws {Error} If required fields are missing or invalid
 */
function validateMoveInInput(data) {
	const errors = [];
	const normalizedData = {};

	// Validate all fields in schema
	for (const [fieldName, schema] of Object.entries(VALIDATION_SCHEMA)) {
		const result = validateField(fieldName, data[fieldName], schema);

		if (!result.valid) {
			errors.push(result.error);
		} else if (result.normalizedValue !== null) {
			normalizedData[fieldName] = result.normalizedValue;
		}
	}

	// Throw if any validation errors
	if (errors.length > 0) {
		const error = new Error("Validation failed");
		error.errors = errors;
		throw error;
	}

	return normalizedData;
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
	let normalized = phone.replace(/[^\d+]/g, "");

	// Validate reasonable length (5-20 characters)
	if (normalized.length < 5 || normalized.length > 20) {
		throw new Error("Phone number must be between 5 and 20 digits");
	}

	// Validate format: only one + at the beginning if it exists
	const plusCount = (normalized.match(/\+/g) || []).length;
	if (plusCount > 1 || (plusCount === 1 && normalized[0] !== "+")) {
		throw new Error("Invalid phone number format");
	}

	return normalized;
}

module.exports = {
	validateMoveInInput,
	transformMoveInResponse,
};
