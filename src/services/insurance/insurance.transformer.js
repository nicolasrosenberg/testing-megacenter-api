/**
 * Insurance Transformer
 *
 * Transforms insurance data from SiteLink into clean, frontend-friendly format
 */

const { parseDecimal, parseInt } = require('../../utils/parsers')

/**
 * Transform insurance plan from InsuranceCoverageRetrieve
 * @param {object} sitelinkInsurance - Raw insurance plan from SiteLink
 * @returns {object} Transformed insurance plan
 */
function transformInsurancePlan(sitelinkInsurance) {
	return {
		insuranceCoverageId: parseInt(sitelinkInsurance.InsurCoverageID),
		siteId: parseInt(sitelinkInsurance.SiteID),
		coverage: parseDecimal(sitelinkInsurance.dcCoverage),
		premium: parseDecimal(sitelinkInsurance.dcPremium),
		monthlyPremium: parseDecimal(sitelinkInsurance.dcPremium),
		description: sitelinkInsurance.sCoverageDesc || '',
		provider: sitelinkInsurance.sProvidor || '',
		theftCoveragePercent: parseDecimal(sitelinkInsurance.dcPCTheft) || 0
	}
}

/**
 * Transform raw insurance plans into clean format
 * @param {object} rawData - Raw data from InsuranceCoverageRetrieve
 * @returns {object} Transformed insurance data
 */
function transformInsurancePlans(rawData) {
	if (!rawData || !rawData.data) {
		return {
			plans: []
		}
	}

	const insuranceTable = rawData.data.Table || []

	// Transform plans
	const plans = (Array.isArray(insuranceTable) ? insuranceTable : [insuranceTable])
		.map(transformInsurancePlan)
		.sort((a, b) => a.coverage - b.coverage) // Sort by coverage amount ascending

	return {
		plans
	}
}

module.exports = {
	transformInsurancePlan,
	transformInsurancePlans
}
