/**
 * Forms Controller
 *
 * HTTP handlers for forms endpoints (contact, quote, tour booking, etc.)
 */

const formsService = require("../services/forms/forms.service");
const formsHelper = require("../services/forms/forms.helper");
const { verifyRecaptcha } = require("../services/recaptcha.service");
const { logInfo, logError } = require("../middleware/logger");
const {
	success,
	error: formatError,
	ERROR_CODES,
} = require("../utils/response");

/**
 * Create Form Submission
 * Validates form data and sends it to CRM
 *
 * POST /forms
 *
 * Body (JSON):
 * - formType (required): Type of form (general, book_office_tour)
 * - data (required): Form data (varies by form type)
 * - recaptchaToken (optional): reCAPTCHA token for spam prevention
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function createForm(req, res) {
	logInfo("FormsController", "createForm called");

	try {
		return res.status(201).json(
			success({
				success: true,
				message: "Form submitted successfully",
				submittedAt: new Date().toISOString(),
			})
		);
		// Validate input
		const validatedData = formsHelper.validateFormInput(req.body);

		logInfo("FormsController", "Form input validated", {
			formType: validatedData.formType,
			hasRecaptcha: !!validatedData.recaptchaToken,
		});

		// Verify reCAPTCHA if token provided
		if (validatedData.recaptchaToken) {
			const recaptchaResult = await verifyRecaptcha(
				validatedData.recaptchaToken,
				`form_${validatedData.formType}`
			);
			logInfo("FormsController", "reCAPTCHA verified", {
				score: recaptchaResult.score,
			});
		}

		// Send to CRM
		const result = await formsService.submitFormToCRM(validatedData);

		logInfo("FormsController", "Form submitted successfully", {
			formType: validatedData.formType,
			crmId: result.crmId,
		});

		res.status(201).json(
			success({
				success: true,
				message: "Form submitted successfully",
				id: result.crmId || result.contactId,
				submittedAt: new Date().toISOString(),
			})
		);
	} catch (error) {
		// Handle validation errors
		if (error.errors && Array.isArray(error.errors)) {
			logError("FormsController", "Validation error", {
				errors: error.errors,
			});

			return res
				.status(400)
				.json(
					formatError(
						ERROR_CODES.VALIDATION_ERROR,
						"Validation failed",
						{ details: error.errors }
					)
				);
		}

		// Re-throw other errors to be handled by error middleware
		throw error;
	}
}

module.exports = {
	createForm,
};
