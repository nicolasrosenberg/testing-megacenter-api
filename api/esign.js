/**
 * SiteLink eSign API
 * 
 * Endpoints for electronic signature lease creation
 * Migrated from original sitelink.js
 */

const router = require('express').Router()
const sitelink = require('./client')

module.exports = () => {

	/**
	 * POST /esign/create-lease-url
	 * 
	 * Creates an eSign lease URL for a tenant
	 * 
	 * Body parameters:
	 * - tenantId: Tenant ID (required)
	 * - ledgerId: Ledger ID (required)
	 * - formIds: Form IDs (optional, empty string for default forms)
	 * - returnUrl: URL to redirect after signing (optional)
	 * - locationCode: Location code (optional, uses default)
	 */
	router.post('/create-lease-url', async (req, res) => {
		try {
			const { tenantId, ledgerId, formIds = '', returnUrl, locationCode } = req.body

			// Validate required parameters
			if (!tenantId || !ledgerId) {
				return res.status(400).json({ 
					status: 'error', 
					msg: 'tenantId and ledgerId are required' 
				})
			}

			// Default return URL if not provided
			const finalReturnUrl = returnUrl || `${req.protocol}://${req.get('host')}/api/sitelink/esign/completed`

			// Prepare arguments
			const args = {
				iTenantID: parseInt(tenantId),
				iLedgerID: parseInt(ledgerId),
				sFormIDs: formIds,
				sReturnUrl: finalReturnUrl
			}

			console.log('eSign -> Calling SiteLinkeSignCreateLeaseURL_v2', {
				tenantId,
				ledgerId,
				returnUrl: finalReturnUrl
			})

			const result = await sitelink.callMethod(
				'SiteLinkeSignCreateLeaseURL_v2',
				args,
				'callCenter',
				locationCode
			)

			// Extract URL from response
			let url = result.retMsg || ''

			// If retMsg doesn't contain URL, check data
			if (!url.startsWith('http') && result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				url = tableData.sURL || tableData.URL || tableData.Ret_Msg || ''
			}

			if (!url || !url.startsWith('http')) {
				return res.status(400).json({
					status: 'error',
					msg: 'Failed to generate lease URL',
					details: result.retMsg
				})
			}

			res.json({
				status: 'ok',
				url,
				tenantId: parseInt(tenantId),
				ledgerId: parseInt(ledgerId)
			})

		} catch (e) {
			console.error('eSign (create-lease-url) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({ 
				status: 'error', 
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /esign/completed
	 * 
	 * Callback endpoint after signing is completed
	 * SiteLink redirects the user here after completing the signature
	 */
	router.get('/completed', async (req, res) => {
		try {
			// Get query parameters from SiteLink callback
			const callbackData = req.query

			console.log('eSign -> Completed callback', callbackData)

			// Return success page
			res.send(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Firma Completada | Megacenter</title>
					<meta name="viewport" content="width=device-width, initial-scale=1">
					<style>
						* { box-sizing: border-box; }
						body {
							font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
							display: flex;
							justify-content: center;
							align-items: center;
							min-height: 100vh;
							margin: 0;
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							padding: 20px;
						}
						.container {
							text-align: center;
							padding: 40px;
							background: white;
							border-radius: 16px;
							box-shadow: 0 10px 40px rgba(0,0,0,0.2);
							max-width: 450px;
							width: 100%;
						}
						.icon {
							width: 80px;
							height: 80px;
							background: #4CAF50;
							border-radius: 50%;
							display: flex;
							align-items: center;
							justify-content: center;
							margin: 0 auto 24px;
						}
						.icon svg {
							width: 40px;
							height: 40px;
							fill: white;
						}
						h1 { 
							color: #333;
							margin: 0 0 12px;
							font-size: 24px;
						}
						p { 
							color: #666;
							margin: 0 0 8px;
							line-height: 1.5;
						}
						.btn {
							display: inline-block;
							margin-top: 24px;
							padding: 12px 32px;
							background: #667eea;
							color: white;
							text-decoration: none;
							border-radius: 8px;
							font-weight: 500;
							transition: background 0.2s;
						}
						.btn:hover {
							background: #5a6fd6;
						}
					</style>
				</head>
				<body>
					<div class="container">
						<div class="icon">
							<svg viewBox="0 0 24 24">
								<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
							</svg>
						</div>
						<h1>¡Firma Completada!</h1>
						<p>Gracias por completar el proceso de firma electrónica.</p>
						<p>Recibirá una copia del contrato en su correo electrónico.</p>
						<a href="/" class="btn">Volver al Inicio</a>
					</div>
				</body>
				</html>
			`)

		} catch (e) {
			console.error('eSign (completed) -> exception', e)
			res.status(500).json({ 
				status: 'error', 
				msg: e.message 
			})
		}
	})

	/**
	 * GET /esign/status/:tenantId
	 * 
	 * Check eSign status for a tenant
	 */
	router.get('/status/:tenantId', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { ledgerId, locationCode } = req.query

			const args = {
				iTenantID: parseInt(tenantId)
			}

			if (ledgerId) {
				args.iLedgerID = parseInt(ledgerId)
			}

			const result = await sitelink.callMethod(
				'SiteLinkeSignAndeFilesRetrieve',
				args,
				'callCenter',
				locationCode
			)

			let status = null
			if (result.data?.Table) {
				const statusData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				
				status = {
					tenantId: parseInt(tenantId),
					ledgerId: statusData.iLedgerID || ledgerId,
					status: statusData.sStatus,
					signedDate: statusData.dtSignedDate,
					sentDate: statusData.dtSentDate,
					forms: statusData.sFormNames
				}
			}

			res.json({
				status: 'ok',
				esign: status
			})

		} catch (e) {
			console.error('eSign (status) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({ 
				status: 'error', 
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * POST /esign/resend
	 * 
	 * Resend eSign invitation email
	 */
	router.post('/resend', async (req, res) => {
		try {
			const { tenantId, ledgerId, email, locationCode } = req.body

			if (!tenantId || !ledgerId) {
				return res.status(400).json({
					status: 'error',
					msg: 'tenantId and ledgerId are required'
				})
			}

			const args = {
				iTenantID: parseInt(tenantId),
				iLedgerID: parseInt(ledgerId)
			}

			if (email) {
				args.sEmail = email
			}

			const result = await sitelink.callMethod(
				'SendLeaseInformationEmail',
				args,
				'callCenter',
				locationCode
			)

			res.json({
				status: 'ok',
				message: 'eSign invitation resent successfully',
				tenantId: parseInt(tenantId),
				ledgerId: parseInt(ledgerId)
			})

		} catch (e) {
			console.error('eSign (resend) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({ 
				status: 'error', 
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	return router
}
