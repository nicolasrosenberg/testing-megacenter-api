/**
 * Payments Controller
 *
 * HTTP handlers for payment endpoints
 */

const paymentsService = require("../services/payments/payments.service");
const { logInfo, logError } = require("../middleware/logger");

/**
 * Process Payment
 * Complete validation + move-in flow
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function processPayment(req, res) {
	const locationCode = req.locationCode;
	const locationSlug = req.locationSlug;

	logInfo(
		"PaymentsController",
		`processPayment called for ${locationSlug} (${locationCode})`
	);

	try {
		// Validate required fields
		const {
			firstName,
			lastName,
			email,
			phone,
			unitId,
			moveInDate,
			expectedTotal,
			creditCardType,
			creditCardNumber,
			creditCardCVV,
			creditCardExpirationDate,
			billingAddress,
			billingZipCode,
		} = req.body;

		// Check required fields
		if (
			!firstName ||
			!lastName ||
			!email ||
			!phone ||
			!unitId ||
			!moveInDate ||
			expectedTotal === undefined ||
			!creditCardType ||
			!creditCardNumber ||
			!creditCardCVV ||
			!creditCardExpirationDate ||
			!billingAddress ||
			!billingZipCode
		) {
			logError("PaymentsController", "Missing required fields", {
				required: [
					"firstName",
					"lastName",
					"email",
					"phone",
					"unitId",
					"moveInDate",
					"expectedTotal",
					"creditCardType",
					"creditCardNumber",
					"creditCardCVV",
					"creditCardExpirationDate",
					"billingAddress",
					"billingZipCode",
				],
			});
			return res.status(400).json({
				success: false,
				error: "Missing required fields",
				details: {
					required: [
						"firstName",
						"lastName",
						"email",
						"phone",
						"unitId",
						"moveInDate",
						"expectedTotal",
						"creditCardType",
						"creditCardNumber",
						"creditCardCVV",
						"creditCardExpirationDate",
						"billingAddress",
						"billingZipCode",
					],
				},
			});
		}

		// Optional fields with defaults
		const insuranceCoverageId = req.body.insuranceCoverageId || -999;
		const concessionPlanId = req.body.concessionPlanId || -999;

		logInfo("PaymentsController", "Processing payment", {
			firstName,
			lastName,
			email,
			phone,
			unitId,
			moveInDate,
			expectedTotal,
			insuranceCoverageId,
			concessionPlanId,
		});

		// Execute payment flow with all validations
		const result = await paymentsService.processPayment(
			{
				unitId: parseInt(unitId),
				firstName: firstName,
				lastName: lastName,
				email: email,
				phone: phone,
				moveInDate,
				insuranceCoverageId: parseInt(insuranceCoverageId),
				concessionPlanId: parseInt(concessionPlanId),
				expectedTotal: parseFloat(expectedTotal),
				creditCardType: parseInt(creditCardType),
				creditCardNumber: creditCardNumber,
				creditCardCVV: creditCardCVV,
				creditCardExpirationDate: creditCardExpirationDate,
				billingAddress: billingAddress,
				billingZipCode: billingZipCode,
			},
			locationCode
		);

		logInfo("PaymentsController", "Payment processed successfully", {
			ledgerId: result.ledgerId,
			tenantId: result.tenantId,
		});

		res.status(200).json({
			success: true,
			data: result,
		});
	} catch (error) {
		// Handle validation errors
		if (
			error.name === "ValidationError" ||
			error.name === "NotFoundError"
		) {
			logError("PaymentsController", "Payment validation failed", {
				error: error.message,
			});

			return res.status(400).json({
				success: false,
				error: error.message,
				type: error.name,
			});
		}

		// Re-throw other errors to be handled by error middleware
		throw error;
	}
}

module.exports = {
	processPayment,
};
