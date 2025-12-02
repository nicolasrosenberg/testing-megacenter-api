/**
 * SiteLink Insurance API
 * 
 * Endpoints for insurance/protection plan options
 */

const router = require('express').Router()
const sitelink = require('./client')

module.exports = () => {

	/**
	 * GET /insurance
	 * 
	 * Get available insurance/protection plans
	 * 
	 * Query params:
	 * - locationCode: Location code (optional)
	 */
	router.get('/', async (req, res) => {
		try {
			const { locationCode } = req.query

			const result = await sitelink.callMethod(
				'InsuranceCoverageRetrieve_V3',
				{},
				'callCenter',
				locationCode
			)

			let plans = []
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				plans = tableData.map(plan => ({
					id: plan.InsuranceID || plan.iInsuranceID,
					name: plan.sName || plan.InsuranceName,
					description: plan.sDescription,
					coverageAmount: parseFloat(plan.dcCoverage || plan.dcCoverageAmount || 0),
					monthlyPremium: parseFloat(plan.dcPremium || plan.dcMonthlyPremium || 0),
					deductible: parseFloat(plan.dcDeductible || 0),
					provider: plan.sProvider || plan.InsuranceCompany,
					isRequired: plan.bRequired === 'true' || plan.bRequired === true,
					isDefault: plan.bDefault === 'true' || plan.bDefault === true,
					sortOrder: parseInt(plan.iSortOrder || 0)
				}))

				// Sort by coverage amount
				plans.sort((a, b) => a.coverageAmount - b.coverageAmount)
			}

			res.json({
				status: 'ok',
				plans,
				count: plans.length
			})

		} catch (e) {
			console.error('Insurance (list) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /insurance/:insuranceId
	 * 
	 * Get details for a specific insurance plan
	 */
	router.get('/:insuranceId', async (req, res) => {
		try {
			const { insuranceId } = req.params
			const { locationCode } = req.query

			// Get all insurance plans and filter
			const result = await sitelink.callMethod(
				'InsuranceCoverageRetrieve_V3',
				{},
				'callCenter',
				locationCode
			)

			let plan = null
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				const found = tableData.find(p => 
					(p.InsuranceID || p.iInsuranceID) == insuranceId
				)

				if (found) {
					plan = {
						id: found.InsuranceID || found.iInsuranceID,
						name: found.sName || found.InsuranceName,
						description: found.sDescription,
						coverageAmount: parseFloat(found.dcCoverage || found.dcCoverageAmount || 0),
						monthlyPremium: parseFloat(found.dcPremium || found.dcMonthlyPremium || 0),
						deductible: parseFloat(found.dcDeductible || 0),
						provider: found.sProvider || found.InsuranceCompany,
						isRequired: found.bRequired === 'true' || found.bRequired === true,
						isDefault: found.bDefault === 'true' || found.bDefault === true,
						// Additional details
						terms: found.sTerms,
						exclusions: found.sExclusions
					}
				}
			}

			if (!plan) {
				return res.status(404).json({
					status: 'error',
					msg: 'Insurance plan not found'
				})
			}

			res.json({
				status: 'ok',
				plan
			})

		} catch (e) {
			console.error('Insurance (get) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * POST /insurance/calculate
	 * 
	 * Calculate insurance cost for a unit
	 * 
	 * Body:
	 * - insuranceId: Insurance plan ID (required)
	 * - unitId: Unit ID (optional, for unit-specific rates)
	 * - moveInDate: Move-in date (optional, for prorated calculation)
	 */
	router.post('/calculate', async (req, res) => {
		try {
			const { insuranceId, unitId, moveInDate, locationCode } = req.body

			if (!insuranceId) {
				return res.status(400).json({
					status: 'error',
					msg: 'Missing required field: insuranceId'
				})
			}

			// Get insurance plan details
			const result = await sitelink.callMethod(
				'InsuranceCoverageRetrieve_V3',
				{},
				'callCenter',
				locationCode
			)

			let plan = null
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				plan = tableData.find(p => (p.InsuranceID || p.iInsuranceID) == insuranceId)
			}

			if (!plan) {
				return res.status(404).json({
					status: 'error',
					msg: 'Insurance plan not found'
				})
			}

			const monthlyPremium = parseFloat(plan.dcPremium || plan.dcMonthlyPremium || 0)
			
			// Calculate prorated amount if move-in date provided
			let proratedAmount = null
			if (moveInDate) {
				const moveIn = new Date(moveInDate)
				const daysInMonth = new Date(moveIn.getFullYear(), moveIn.getMonth() + 1, 0).getDate()
				const daysRemaining = daysInMonth - moveIn.getDate() + 1
				proratedAmount = (monthlyPremium / daysInMonth) * daysRemaining
			}

			res.json({
				status: 'ok',
				insuranceId: parseInt(insuranceId),
				monthlyPremium,
				proratedAmount: proratedAmount ? parseFloat(proratedAmount.toFixed(2)) : null,
				coverage: parseFloat(plan.dcCoverage || plan.dcCoverageAmount || 0),
				deductible: parseFloat(plan.dcDeductible || 0)
			})

		} catch (e) {
			console.error('Insurance (calculate) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	return router
}
