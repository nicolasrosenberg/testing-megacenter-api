const { Resend } = require("resend");
const { logInfo, logError } = require("../../middleware/logger");
const locationsData = require("../../utils/locations");
const { getLocationSlug } = require("../../config/locations");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendReservationConfirmation(data, locationCode) {
	try {
		// Get location data
		const locationSlug = getLocationSlug(locationCode);
		const location = locationSlug ? locationsData[locationSlug] : null;

		if (!location) {
			logError("MailingService", "Invalid location code", {
				locationCode,
			});
			throw new Error(`Invalid location code: ${locationCode}`);
		}

		logInfo("MailingService", "Sending reservation confirmation email", {
			email: data.email,
			reservationId: data.reservationId,
			location: location.name,
		});

		const variables = {
			...data,
			locationName: location.title,
			locationAddress: location.fullAddress,
			locationPhone: location.phone,
			locationEmail: location.email,
			locationWebsite: location.url,
			locationMap: location.mapQuery,
			locationAccessHours: location.accessHours,
			locationOfficeHours: location.officeHours,
			locationMap: location.mapQuery,
		};

		console.log("VARIABLES", variables);

		const result = await resend.emails.send({
			from: "onboarding@resend.dev",
			to: data.email,
			template: {
				id: "reservation-confirmed",
				variables,
			},
		});

		console.log(result);

		logInfo("MailingService", "Email sent successfully", {
			emailId: result.data?.id,
		});

		return result;
	} catch (error) {
		logError("MailingService", "Failed to send email", {
			error: error.message,
			email: data.email,
		});
		throw error;
	}
}

module.exports = {
	sendReservationConfirmation,
};
