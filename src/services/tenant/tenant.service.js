/**
 * Tenant Service
 *
 * Service for managing tenants in SiteLink
 * Used by both reservations and move-in flows
 */

const client = require("../shared/client");
const { logInfo } = require("../../middleware/logger");

/**
 * Helper: Remove null/undefined fields and empty strings for date fields
 * SiteLink SOAP doesn't accept empty strings for certain types
 */
function cleanSoapArgs(args) {
	const cleaned = {};
	for (const [key, value] of Object.entries(args)) {
		// Skip null/undefined
		if (value === null || value === undefined) {
			continue;
		}
		// Skip empty strings for date fields (dDOB, etc)
		if (key.startsWith("d") && value === "") {
			continue;
		}
		cleaned[key] = value;
	}
	return cleaned;
}

async function createTenant(data, locationCode = null) {
	const args = cleanSoapArgs({
		// Primary contact
		sFName: data.firstName,
		sLName: data.lastName,
		sEmail: data.email,
		sPhone: data.phone,
		sAddr1: data.address,
		sAddr2: data.address2,
		sCity: data.city,
		sRegion: data.state,
		sPostalCode: data.zipCode,
		dDOB: data.dateOfBirth,

		// ID
		sLicense: data.idNumber,
		sLicRegion: data.idState,

		// Alternate contact
		sFNameAlt: data.altFirstName || "",
		sLNameAlt: data.altLastName || "",
		sEmailAlt: data.altEmail || "",
		sPhoneAlt: data.altPhone || "",

		// Company & Storage details
		bCommercial: data.storageUse === "business" ? true : false,
		bCompanyIsTenant: data.storageUse === "business" ? true : false,
		sCompany: data.companyName || "",
		sTaxID: data.taxId || "",
		sTenNote: `Storage description: ${data.storageDescription}. Estimated value: ${data.estimatedValue}.`,
	});

	logInfo("TenantService", "Creating tenant", {
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
	});

	const response = await client.callMethod(
		"TenantNewDetailed_v3",
		args,
		"callCenter",
		locationCode,
	);

	// Extract TenantID and AccessCode from RT table
	// According to SiteLink docs, RT contains: Ret_Code, TenantID, AccessCode
	const rtData = Array.isArray(response.data.RT)
		? response.data.RT[0]
		: response.data.RT;

	// Validate tenant was created successfully
	if (!rtData || !rtData.TenantID) {
		throw new Error(
			`Failed to create tenant: ${response.retMsg || "Unknown error"}`,
		);
	}

	logInfo("TenantService", "Tenant created", {
		tenantId: rtData.TenantID,
		accessCode: rtData.AccessCode,
	});

	return {
		tenantId: parseInt(rtData.TenantID),
		accessCode: rtData.AccessCode,
		rawResponse: response,
	};
}

async function updateTenantMilitaryStatus(
	tenantId,
	militaryStatus,
	locationCode = null,
) {
	const args = cleanSoapArgs({
		TenantID: tenantId,
		bMilitary: militaryStatus,
	});

	logInfo("TenantService", "Updating tenant military status", {
		tenantId: tenantId,
		militaryStatus: militaryStatus,
	});

	const response = await client.callMethod(
		"TenantUpdateMilitary",
		args,
		"callCenter",
		locationCode,
	);

	// Extract result from RT table
	const rtData = Array.isArray(response.data.RT)
		? response.data.RT[0]
		: response.data.RT;

	// Validate response - TenantUpdateMilitary returns Ret_Code (not TenantID)
	// Ret_Code values: TenantID on success, or error codes:
	// (-1) Invalid TenantID, (-2) Failed to save, (-3) Cannot find Military Marketing Type
	const retCode = parseInt(rtData?.Ret_Code);
	if (!rtData || !retCode || retCode < 0) {
		const errorMsg =
			retCode === -1
				? "Invalid TenantID"
				: retCode === -2
					? "Failed to save the update"
					: retCode === -3
						? "Cannot find Military Marketing Type"
						: response.retMsg || "Unknown error";
		throw new Error(`Failed to update military status: ${errorMsg}`);
	}

	logInfo("TenantService", "Military status updated", {
		tenantId: rtData.Ret_Code,
	});

	return {
		tenantId: parseInt(rtData.Ret_Code),
		rawResponse: response,
	};
}

async function updateTenantIdImage(
	tenantId,
	imageData,
	imageFilename,
	locationCode = null,
) {
	const args = cleanSoapArgs({
		iTenantID: tenantId,
		aryImageBytes: imageData,
		sFileName: imageFilename,
	});
	logInfo("TenantService", "Updating tenant ID image", {
		tenantId: tenantId,
		imageFilename: imageFilename,
	});

	const response = await client.callMethod(
		"TenantImageUpload",
		args,
		"callCenter",
		locationCode,
	);

	// Extract result from RT table
	const rtData = Array.isArray(response.data.RT)
		? response.data.RT[0]
		: response.data.RT;

	// Validate response - TenantImageUpload returns Ret_Code
	// Ret_Code values: Success status on success, or error codes:
	// (-1) Unit name and Access code are both blank, (-2) Failed to retrieve data from the servers
	const retCode = parseInt(rtData?.Ret_Code);
	if (!rtData || !retCode || retCode < 0) {
		const errorMsg = retCode === -1 ? "Unit name and Access code are both blank"
			: retCode === -2 ? "Failed to retrieve data from the servers"
			: rtData?.Ret_Msg || response.retMsg || "Unknown error";
		throw new Error(`Failed to upload tenant ID image: ${errorMsg}`);
	}

	logInfo("TenantService", "Tenant ID image uploaded", {
		tenantId: tenantId,
		retCode: retCode,
	});

	return {
		retCode: retCode,
		message: rtData.Ret_Msg,
		rawResponse: response,
	};
}
module.exports = {
	createTenant,
	updateTenantMilitaryStatus,
	updateTenantIdImage,
};
