/**
 * SiteLink Move-In API
 * 
 * Endpoints for calculating costs and processing move-ins
 */

const router = require('express').Router()
const sitelink = require('./client')

module.exports = () => {

	/**
	 * POST /movein/calculate
	 * 
	 * Calculate move-in costs for a unit
	 * 
	 * Body:
	 * - unitId: Unit ID (required)
	 * - moveInDate: Move-in date (required)
	 * - insuranceId: Insurance coverage ID (optional)
	 * - promoCode: Promotional code (optional)
	 * - locationCode: Location code (optional)
	 */
	router.post('/calculate', async (req, res) => {
		try {
			const {
				unitId,
				moveInDate,
				insuranceId,
				promoCode,
				locationCode
			} = req.body

			if (!unitId || !moveInDate) {
				return res.status(400).json({
					status: 'error',
					msg: 'Missing required fields: unitId, moveInDate'
				})
			}

			const args = {
				iUnitID: parseInt(unitId),
				dtMoveIn: moveInDate
			}

			// Add optional parameters if provided
			if (insuranceId) {
				args.iInsuranceID = parseInt(insuranceId)
			}

			const result = await sitelink.callMethod(
				'MoveInCostRetrieveWithDiscount_v4',
				args,
				'callCenter',
				locationCode
			)

			let costs = null
			if (result.data?.Table) {
				const costData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table

				costs = {
					rent: parseFloat(costData.dcRent || costData.dcMonthlyRate || 0),
					proratedRent: parseFloat(costData.dcProratedRent || 0),
					adminFee: parseFloat(costData.dcAdminFee || 0),
					insurance: parseFloat(costData.dcInsurance || 0),
					deposit: parseFloat(costData.dcDeposit || 0),
					tax: parseFloat(costData.dcTax || 0),
					total: parseFloat(costData.dcTotal || costData.dcTotalDue || 0),
					// Additional breakdown
					daysProrated: parseInt(costData.iDaysProrated || 0),
					nextBillDate: costData.dtNextBillDate
				}
			}

			// Validate promo code if provided
			let promoDiscount = null
			if (promoCode) {
				try {
					const promoResult = await sitelink.callMethod(
						'DiscountPlansRetrieve',
						{},
						'callCenter',
						locationCode
					)

					if (promoResult.data?.Table) {
						const promoData = Array.isArray(promoResult.data.Table) 
							? promoResult.data.Table[0] 
							: promoResult.data.Table
						
						promoDiscount = {
							valid: true,
							code: promoCode,
							description: promoData.sDescription,
							discountAmount: parseFloat(promoData.dcDiscount || 0),
							discountType: promoData.sDiscountType
						}
					}
				} catch (promoError) {
					promoDiscount = {
						valid: false,
						code: promoCode,
						message: promoError.message
					}
				}
			}

			res.json({
				status: 'ok',
				unitId: parseInt(unitId),
				moveInDate,
				costs,
				promoDiscount
			})

		} catch (e) {
			console.error('MoveIn (calculate) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * POST /movein
	 * 
	 * Process a move-in (new tenant)
	 * 
	 * Body (all required unless noted):
	 * - unitId: Unit ID
	 * - firstName: Tenant first name
	 * - lastName: Tenant last name
	 * - email: Tenant email
	 * - phone: Tenant phone
	 * - address: Tenant street address
	 * - city: Tenant city
	 * - state: Tenant state
	 * - zip: Tenant zip code
	 * - moveInDate: Move-in date
	 * - paymentMethod: 'card' or 'ach'
	 * - payment: Payment details object
	 * - insuranceId: Insurance coverage ID (optional)
	 * - promoCode: Promotional code (optional)
	 * - reservationId: If converting from reservation (optional)
	 * - locationCode: Location code (optional)
	 */
	router.post('/', async (req, res) => {
		try {
			const {
				unitId,
				firstName,
				lastName,
				email,
				phone,
				address,
				city,
				state,
				zip,
				moveInDate,
				paymentMethod,
				payment,
				insuranceId,
				promoCode,
				reservationId,
				locationCode
			} = req.body

			// Validate required fields
			const requiredFields = ['unitId', 'firstName', 'lastName', 'email', 'phone', 
				'address', 'city', 'state', 'zip', 'moveInDate', 'paymentMethod', 'payment']
			const missing = requiredFields.filter(f => !req.body[f])
			
			if (missing.length > 0) {
				return res.status(400).json({
					status: 'error',
					msg: `Missing required fields: ${missing.join(', ')}`
				})
			}

			// Build move-in arguments
			const args = {
				// Unit info
				iUnitID: parseInt(unitId),
				dtMoveIn: moveInDate,
				// Tenant info
				sFirstName: firstName,
				sLastName: lastName,
				sEmail: email,
				sPhone: phone.replace(/\D/g, ''),
				sAddress: address,
				sCity: city,
				sState: state,
				sZip: zip.toString().replace(/\D/g, '')
			}

			// Add optional parameters
			if (insuranceId) {
				args.iInsuranceID = parseInt(insuranceId)
			}

			if (promoCode) {
				args.sPromoCode = promoCode
			}

			if (reservationId) {
				args.iReservationID = parseInt(reservationId)
			}

			// Add payment information
			if (paymentMethod === 'card') {
				args.sCCNumber = payment.cardNumber.replace(/\D/g, '')
				args.sCCExpMonth = payment.expMonth.toString().padStart(2, '0')
				args.sCCExpYear = payment.expYear.toString().slice(-2)
				args.sCCCVV = payment.cvv
				args.sCCName = payment.nameOnCard || `${firstName} ${lastName}`
				args.sCCZip = payment.billingZip || zip
			} else if (paymentMethod === 'ach') {
				args.sRoutingNumber = payment.routingNumber
				args.sAccountNumber = payment.accountNumber
				args.sAccountType = payment.accountType || 'checking' // checking or savings
				args.sAccountName = payment.accountName || `${firstName} ${lastName}`
			}

			// Call MoveInWithDiscount_v7 for new tenants
			const result = await sitelink.callMethod(
				'MoveInWithDiscount_v7',
				args,
				'callCenter',
				locationCode
			)

			// Extract tenant and lease info
			let tenantId = null
			let leaseId = null
			let confirmationNumber = null

			if (result.data?.Table) {
				const moveInData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				tenantId = moveInData.iTenantID || moveInData.TenantID
				leaseId = moveInData.iLeaseID || moveInData.LeaseID
				confirmationNumber = moveInData.sConfirmation || result.retMsg
			}

			res.json({
				status: 'ok',
				tenantId,
				leaseId,
				confirmationNumber,
				unitId: parseInt(unitId),
				moveInDate,
				message: 'Move-in completed successfully'
			})

		} catch (e) {
			console.error('MoveIn (process) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * POST /movein/existing
	 * 
	 * Process a move-in for an existing tenant
	 * 
	 * Body:
	 * - tenantId: Existing tenant ID (required)
	 * - unitId: Unit ID (required)
	 * - moveInDate: Move-in date (required)
	 * - paymentMethod: 'card' or 'ach'
	 * - payment: Payment details object
	 * - insuranceId: Insurance coverage ID (optional)
	 * - promoCode: Promotional code (optional)
	 * - locationCode: Location code (optional)
	 */
	router.post('/existing', async (req, res) => {
		try {
			const {
				tenantId,
				unitId,
				moveInDate,
				paymentMethod,
				payment,
				insuranceId,
				promoCode,
				locationCode
			} = req.body

			if (!tenantId || !unitId || !moveInDate || !paymentMethod || !payment) {
				return res.status(400).json({
					status: 'error',
					msg: 'Missing required fields: tenantId, unitId, moveInDate, paymentMethod, payment'
				})
			}

			const args = {
				iTenantID: parseInt(tenantId),
				iUnitID: parseInt(unitId),
				dtMoveIn: moveInDate
			}

			if (insuranceId) {
				args.iInsuranceID = parseInt(insuranceId)
			}

			if (promoCode) {
				args.sPromoCode = promoCode
			}

			// Add payment information
			if (paymentMethod === 'card') {
				args.sCCNumber = payment.cardNumber.replace(/\D/g, '')
				args.sCCExpMonth = payment.expMonth.toString().padStart(2, '0')
				args.sCCExpYear = payment.expYear.toString().slice(-2)
				args.sCCCVV = payment.cvv
				args.sCCName = payment.nameOnCard
				args.sCCZip = payment.billingZip
			} else if (paymentMethod === 'ach') {
				args.sRoutingNumber = payment.routingNumber
				args.sAccountNumber = payment.accountNumber
				args.sAccountType = payment.accountType || 'checking'
				args.sAccountName = payment.accountName
			}

			const result = await sitelink.callMethod(
				'MoveIn',
				args,
				'callCenter',
				locationCode
			)

			let leaseId = null
			let confirmationNumber = null

			if (result.data?.Table) {
				const moveInData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				leaseId = moveInData.iLeaseID || moveInData.LeaseID
				confirmationNumber = moveInData.sConfirmation || result.retMsg
			}

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				leaseId,
				confirmationNumber,
				unitId: parseInt(unitId),
				moveInDate,
				message: 'Move-in completed successfully'
			})

		} catch (e) {
			console.error('MoveIn (existing) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /movein/promo/:code
	 * 
	 * Validate a promotional code
	 */
	router.get('/promo/:code', async (req, res) => {
		try {
			const { code } = req.params
			const { unitId, locationCode } = req.query

			const args = {
				sPromoCode: code
			}

			if (unitId) {
				args.iUnitID = parseInt(unitId)
			}

			const result = await sitelink.callMethod(
				'DiscountPlansRetrieve',
				{},
				'callCenter',
				locationCode
			)

			// Find the matching promo code in discount plans
			let promo = null
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				const promoData = tableData.find(p => p.sPromoCode === code || p.sDiscountPlanName === code)
				
				if (promoData) {
					promo = {
						valid: true,
						code: code,
						description: promoData.sDescription || promoData.sDiscountPlanName,
						discountAmount: parseFloat(promoData.dcDiscount || promoData.dcDiscountAmount || 0),
						discountType: promoData.sDiscountType,
						discountMonths: parseInt(promoData.iMonths || promoData.iDiscountMonths || 0),
						startDate: promoData.dtStartDate,
						endDate: promoData.dtEndDate
					}
				}
			}

			res.json({
				status: 'ok',
				promo
			})

		} catch (e) {
			console.error('MoveIn (promo) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				valid: false
			})
		}
	})

	return router
}
