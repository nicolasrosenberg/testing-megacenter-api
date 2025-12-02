/**
 * SiteLink Tenants API
 * 
 * Endpoints for tenant information and management
 */

const router = require('express').Router()
const sitelink = require('./client')

module.exports = () => {

	/**
	 * GET /tenants/:tenantId
	 * 
	 * Get tenant information
	 */
	router.get('/:tenantId', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { locationCode } = req.query

			const result = await sitelink.callMethod(
				'TenantInfoByTenantID',
				{ iTenantID: parseInt(tenantId) },
				'callCenter',
				locationCode
			)

			let tenant = null
			if (result.data?.Table) {
				const data = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				
				tenant = {
					id: data.iTenantID || data.TenantID,
					firstName: data.sFirstName,
					lastName: data.sLastName,
					email: data.sEmail,
					phone: data.sPhone,
					altPhone: data.sAltPhone,
					address: {
						street: data.sAddress,
						city: data.sCity,
						state: data.sState,
						zip: data.sZip
					},
					status: data.sStatus,
					moveInDate: data.dtMoveIn,
					balance: parseFloat(data.dcBalance || 0),
					autopayEnabled: data.bAutopay === 'true' || data.bAutopay === true
				}
			}

			if (!tenant) {
				return res.status(404).json({
					status: 'error',
					msg: 'Tenant not found'
				})
			}

			res.json({
				status: 'ok',
				tenant
			})

		} catch (e) {
			console.error('Tenants (get) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /tenants/:tenantId/units
	 * 
	 * Get all units rented by a tenant
	 */
	router.get('/:tenantId/units', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { locationCode } = req.query

			const result = await sitelink.callMethod(
				'LedgersByTenantID_v3',
				{ iTenantID: parseInt(tenantId) },
				'callCenter',
				locationCode
			)

			let units = []
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				units = tableData.map(unit => ({
					unitId: unit.iUnitID || unit.UnitID,
					unitName: unit.sUnitName,
					size: {
						width: parseFloat(unit.dcWidth || 0),
						depth: parseFloat(unit.dcDepth || 0),
						sqft: parseFloat(unit.dcSqFt || 0)
					},
					rent: parseFloat(unit.dcRent || 0),
					leaseId: unit.iLeaseID || unit.LeaseID,
					moveInDate: unit.dtMoveIn,
					nextBillDate: unit.dtNextBillDate,
					status: unit.sStatus
				}))
			}

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				units,
				count: units.length
			})

		} catch (e) {
			console.error('Tenants (units) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /tenants/search
	 * 
	 * Search for tenants by name, email, or phone
	 */
	router.get('/search', async (req, res) => {
		try {
			const { query, type = 'name', locationCode } = req.query

			if (!query) {
				return res.status(400).json({
					status: 'error',
					msg: 'Search query is required'
				})
			}

			const args = {}

			switch (type) {
				case 'email':
					args.sEmail = query
					break
				case 'phone':
					args.sPhone = query.replace(/\D/g, '')
					break
				case 'name':
				default:
					args.sSearchName = query
					break
			}

			const result = await sitelink.callMethod(
				'TenantSearchDetailed',
				args,
				'callCenter',
				locationCode
			)

			let tenants = []
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				tenants = tableData.map(t => ({
					id: t.iTenantID || t.TenantID,
					firstName: t.sFirstName,
					lastName: t.sLastName,
					email: t.sEmail,
					phone: t.sPhone,
					status: t.sStatus,
					unitName: t.sUnitName
				}))
			}

			res.json({
				status: 'ok',
				tenants,
				count: tenants.length
			})

		} catch (e) {
			console.error('Tenants (search) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * PUT /tenants/:tenantId
	 * 
	 * Update tenant information
	 * 
	 * Body:
	 * - email: Updated email (optional)
	 * - phone: Updated phone (optional)
	 * - altPhone: Updated alternate phone (optional)
	 * - address: Updated address object (optional)
	 */
	router.put('/:tenantId', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { email, phone, altPhone, address, locationCode } = req.body

			const args = {
				iTenantID: parseInt(tenantId)
			}

			// Add only provided fields
			if (email) args.sEmail = email
			if (phone) args.sPhone = phone.replace(/\D/g, '')
			if (altPhone) args.sAltPhone = altPhone.replace(/\D/g, '')
			if (address) {
				if (address.street) args.sAddress = address.street
				if (address.city) args.sCity = address.city
				if (address.state) args.sState = address.state
				if (address.zip) args.sZip = address.zip
			}

			const result = await sitelink.callMethod(
				'TenantUpdate_v3',
				args,
				'callCenter',
				locationCode
			)

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				message: 'Tenant updated successfully'
			})

		} catch (e) {
			console.error('Tenants (update) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /tenants/:tenantId/ledgers
	 * 
	 * Get tenant ledger information (for eSign)
	 */
	router.get('/:tenantId/ledgers', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { locationCode } = req.query

			const result = await sitelink.callMethod(
				'LedgersByTenantID_v3',
				{ iTenantID: parseInt(tenantId) },
				'callCenter',
				locationCode
			)

			let ledgers = []
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				ledgers = tableData.map(l => ({
					ledgerId: l.iLedgerID || l.LedgerID,
					unitId: l.iUnitID || l.UnitID,
					unitName: l.sUnitName,
					status: l.sStatus,
					moveInDate: l.dtMoveIn,
					moveOutDate: l.dtMoveOut,
					balance: parseFloat(l.dcBalance || 0)
				}))
			}

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				ledgers,
				count: ledgers.length
			})

		} catch (e) {
			console.error('Tenants (ledgers) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * POST /tenants/:tenantId/access-code
	 * 
	 * Generate or reset tenant access code
	 */
	router.post('/:tenantId/access-code', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { locationCode } = req.body

			const result = await sitelink.callMethod(
				'UpdateLockCode',
				{ iTenantID: parseInt(tenantId) },
				'callCenter',
				locationCode
			)

			let accessCode = null
			if (result.data?.Table) {
				const data = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				accessCode = data.sAccessCode || data.AccessCode
			}

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				accessCode,
				message: accessCode ? 'Access code generated' : 'Access code reset requested'
			})

		} catch (e) {
			console.error('Tenants (access-code) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * POST /tenants/:tenantId/move-out
	 * 
	 * Process move-out for a tenant
	 * 
	 * Body:
	 * - unitId: Unit ID to move out from (required)
	 * - moveOutDate: Move-out date (required)
	 * - reason: Move-out reason (optional)
	 */
	router.post('/:tenantId/move-out', async (req, res) => {
		try {
			const { tenantId } = req.params
			const { unitId, moveOutDate, reason = '', locationCode } = req.body

			if (!unitId || !moveOutDate) {
				return res.status(400).json({
					status: 'error',
					msg: 'unitId and moveOutDate are required'
				})
			}

			const result = await sitelink.callMethod(
				'MoveOut',
				{
					iTenantID: parseInt(tenantId),
					iUnitID: parseInt(unitId),
					dtMoveOut: moveOutDate,
					sMoveOutReason: reason
				},
				'callCenter',
				locationCode
			)

			res.json({
				status: 'ok',
				tenantId: parseInt(tenantId),
				unitId: parseInt(unitId),
				moveOutDate,
				message: 'Move-out processed successfully'
			})

		} catch (e) {
			console.error('Tenants (move-out) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	return router
}
