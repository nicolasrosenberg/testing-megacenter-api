/**
 * SiteLink Payments API
 * 
 * Endpoints for payment processing and validation
 */

const router = require('express').Router()
const sitelink = require('./client')

module.exports = () => {

	/**
	 * POST /payments
	 * 
	 * Process a payment for an existing tenant
	 * 
	 * Body:
	 * - tenantId: Tenant ID (required)
	 * - amount: Payment amount (required)
	 * - paymentMethod: 'card' or 'ach' (required)
	 * - payment: Payment details object (required)
	 * - description: Payment description (optional)
	 * - locationCode: Location code (optional)
	 */
	router.post('/', async (req, res) => {
		try {
			const {
				tenantId,
				amount,
				paymentMethod,
				payment,
				description = 'Online payment',
				locationCode
			} = req.body

			// Validate required fields
			if (!tenantId || !amount || !paymentMethod || !payment) {
				return res.status(400).json({
					status: 'error',
					msg: 'Missing required fields: tenantId, amount, paymentMethod, payment'
				})
			}

			const args = {
				iTenantID: parseInt(tenantId),
				dcAmount: parseFloat(amount),
				sDescription: description
			}

			// Add payment details based on method
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
				'PaymentSimpleWithSource_v3',
				args,
				'callCenter',
				locationCode
			)

			// Extract transaction info
			let transactionId = null
			let confirmationNumber = null
			let newBalance = null

			if (result.data?.Table) {
				const txData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				transactionId = txData.iTransactionID || txData.TransactionID
				confirmationNumber = txData.sConfirmation || result.retMsg
				newBalance = parseFloat(txData.dcBalance || txData.dcNewBalance || 0)
			}

			res.json({
				status: 'ok',
				transactionId,
				confirmationNumber,
				amount: parseFloat(amount),
				newBalance,
				message: 'Payment processed successfully'
			})

		} catch (e) {
			console.error('Payments (process) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /payments/balance/:tenantId
	 * 
	 * Get current balance for a tenant
	 */
	router.get('/balance/:tenantId', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { locationCode } = req.query

			const result = await sitelink.callMethod(
				'CustomerAccountsBalanceDetails_v2',
				{ iTenantID: parseInt(tenantId) },
				'callCenter',
				locationCode
			)

			let balance = null
			let dueDate = null
			let pastDueAmount = null

			if (result.data?.Table) {
				const balData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				balance = parseFloat(balData.dcBalance || balData.dcCurrentBalance || 0)
				dueDate = balData.dtDueDate
				pastDueAmount = parseFloat(balData.dcPastDue || 0)
			}

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				balance,
				dueDate,
				pastDueAmount,
				isPastDue: pastDueAmount > 0
			})

		} catch (e) {
			console.error('Payments (balance) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /payments/history/:tenantId
	 * 
	 * Get payment history for a tenant
	 */
	router.get('/history/:tenantId', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { locationCode, limit = 20 } = req.query

			const result = await sitelink.callMethod(
				'PaymentsByLedgerID',
				{ iTenantID: parseInt(tenantId) },
				'callCenter',
				locationCode
			)

			let payments = []
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				payments = tableData.map(tx => ({
					transactionId: tx.iTransactionID || tx.TransactionID,
					date: tx.dtDate || tx.dtPaymentDate,
					amount: parseFloat(tx.dcAmount || 0),
					type: tx.sType || tx.sPaymentType,
					method: tx.sMethod || tx.sPaymentMethod,
					description: tx.sDescription,
					confirmation: tx.sConfirmation
				})).slice(0, parseInt(limit))
			}

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				payments,
				count: payments.length
			})

		} catch (e) {
			console.error('Payments (history) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * POST /payments/autopay
	 * 
	 * Set up autopay for a tenant
	 * 
	 * Body:
	 * - tenantId: Tenant ID (required)
	 * - paymentMethod: 'card' or 'ach' (required)
	 * - payment: Payment details to save (required)
	 * - dayOfMonth: Day of month to charge (optional, defaults to due date)
	 * - locationCode: Location code (optional)
	 */
	router.post('/autopay', async (req, res) => {
		try {
			const {
				tenantId,
				paymentMethod,
				payment,
				dayOfMonth,
				locationCode
			} = req.body

			if (!tenantId || !paymentMethod || !payment) {
				return res.status(400).json({
					status: 'error',
					msg: 'Missing required fields: tenantId, paymentMethod, payment'
				})
			}

			const args = {
				iTenantID: parseInt(tenantId),
				bEnableAutopay: true
			}

			if (dayOfMonth) {
				args.iDayOfMonth = parseInt(dayOfMonth)
			}

			// Add payment details
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
				'TenantBillingInfoUpdate_v2',
				args,
				'callCenter',
				locationCode
			)

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				autopayEnabled: true,
				paymentMethod,
				message: 'Autopay setup completed successfully'
			})

		} catch (e) {
			console.error('Payments (autopay) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * DELETE /payments/autopay/:tenantId
	 * 
	 * Cancel autopay for a tenant
	 */
	router.delete('/autopay/:tenantId', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { locationCode } = req.query

			const result = await sitelink.callMethod(
				'TenantBillingInfoUpdate_v2',
				{
					iTenantID: parseInt(tenantId),
					bEnableAutopay: false
				},
				'callCenter',
				locationCode
			)

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				autopayEnabled: false,
				message: 'Autopay cancelled successfully'
			})

		} catch (e) {
			console.error('Payments (cancel autopay) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * POST /payments/validate-card
	 * 
	 * Validate a credit card (without charging)
	 */
	router.post('/validate-card', async (req, res) => {
		try {
			const { cardNumber, expMonth, expYear, cvv, billingZip } = req.body

			if (!cardNumber || !expMonth || !expYear) {
				return res.status(400).json({
					status: 'error',
					msg: 'Missing required fields: cardNumber, expMonth, expYear'
				})
			}

			// Basic card validation (Luhn algorithm)
			const cleanNumber = cardNumber.replace(/\D/g, '')
			let sum = 0
			let isEven = false

			for (let i = cleanNumber.length - 1; i >= 0; i--) {
				let digit = parseInt(cleanNumber[i])

				if (isEven) {
					digit *= 2
					if (digit > 9) digit -= 9
				}

				sum += digit
				isEven = !isEven
			}

			const isValidLuhn = sum % 10 === 0

			// Detect card type
			let cardType = 'unknown'
			if (/^4/.test(cleanNumber)) cardType = 'visa'
			else if (/^5[1-5]/.test(cleanNumber)) cardType = 'mastercard'
			else if (/^3[47]/.test(cleanNumber)) cardType = 'amex'
			else if (/^6(?:011|5)/.test(cleanNumber)) cardType = 'discover'

			// Check expiration
			const now = new Date()
			const expDate = new Date(parseInt(expYear) + (parseInt(expYear) < 100 ? 2000 : 0), parseInt(expMonth) - 1)
			const isExpired = expDate < now

			res.json({
				status: 'ok',
				valid: isValidLuhn && !isExpired,
				cardType,
				lastFour: cleanNumber.slice(-4),
				isExpired,
				errors: [
					...(!isValidLuhn ? ['Invalid card number'] : []),
					...(isExpired ? ['Card is expired'] : [])
				]
			})

		} catch (e) {
			console.error('Payments (validate) -> exception', e)
			res.status(500).json({
				status: 'error',
				msg: e.message
			})
		}
	})

	return router
}
