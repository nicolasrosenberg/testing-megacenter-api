/**
 * SiteLink Insurance Service
 *
 * SOAP methods related to insurance coverage
 */

const client = require("../shared/client");

/**
 * Get all insurance coverage plans
 * Calls InsuranceCoverageRetrieve
 *
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with insurance plans
 */
async function getInsurancePlans(locationCode = null) {
	return await client.callMethod(
		"InsuranceCoverageRetrieve",
		{},
		"callCenter",
		locationCode,
	);
}

async function addInsuranceCoverage(
	ledgerId,
	policyNumber,
	companyName,
	coverage,
	startDate,
	endDate,
	locationCode,
) {
	const args = {
		LedgerID: parseInt(ledgerId),
		sPolicyNumber: policyNumber,
		sDescription: companyName,
		dcCoverageLevel: parseFloat(coverage),
		dStartDate: startDate,
		dEndDate: endDate,
		bCancel: false,
	};
	const response = await client.callMethod(
		"LedgerProofOfInsuranceUpdate",
		args,
		"callCenter",
		locationCode,
	);

	// Extract result from RT table
	const rtData = Array.isArray(response.data.RT)
		? response.data.RT[0]
		: response.data.RT;

	// Validate response - LedgerProofOfInsuranceUpdate returns Ret_Code
	// Ret_Code values: Ledger ID on success, or error codes:
	// (0) - Update not required
	// (-1) - Error getting Ledger data from the server
	// (-2) - Failed to save the update
	// (-3) - Ledger updated but failed to get tenant note schema
	// (-4) - Ledger updated but failed to save the tenant note
	const retCode = parseInt(rtData?.Ret_Code);
	if (!rtData || isNaN(retCode) || retCode < 1) {
		const errorMsg =
			retCode === 0
				? "Update not required"
				: retCode === -1
					? "Error getting Ledger data from the server"
					: retCode === -2
						? "Failed to save the update"
						: retCode === -3
							? "Ledger updated but failed to get tenant note schema"
							: retCode === -4
								? "Ledger updated but failed to save the tenant note"
								: rtData?.Ret_Msg ||
									response.retMsg ||
									"Unknown error";
		throw new Error(`Failed to add insurance coverage: ${errorMsg}`);
	}

	return {
		ledgerId: retCode,
		message: rtData.Ret_Msg,
		rawResponse: response,
	};
}

module.exports = {
	getInsurancePlans,
	addInsuranceCoverage,
};
