/**
 * SiteLink Reservations API
 * 
 * Endpoints for managing unit reservations (without payment)
 */

const router = require('express').Router()
const sitelink = require('./client')

module.exports = () => {

	/**
	 * POST /reservations
	 * 
	 * Create a new reservation
	 * 
	 * Body:
	 * - unitId: Unit ID to reserve (required)
	 * - firstName: Customer first name (required)
	 * - lastName: Customer last name (required)
	 * - email: Customer email (required)
	 * - phone: Customer phone (required)
	 * - moveInDate: Expected move-in date (required)
	 * - notes: Additional notes (optional)
	 * - locationCode: Location code (optional, uses default)
	 */
	router.post('/', async (req, res) => {
		try {
			const {
				unitId,
				firstName,
				lastName,
				email,
				phone,
				moveInDate,
				notes = '',
				locationCode
			} = req.body

			// Validate required fields
			if (!unitId || !firstName || !lastName || !email || !phone || !moveInDate) {
				return res.status(400).json({
					status: 'error',
					msg: 'Missing required fields: unitId, firstName, lastName, email, phone, moveInDate'
				})
			}

			const args = {
				iUnitID: parseInt(unitId),
				sFirstName: firstName,
				sLastName: lastName,
				sEmail: email,
				sPhone: phone.replace(/\D/g, ''), // Remove non-digits
				dtMoveIn: moveInDate,
				sNotes: notes,
				// Additional optional fields
				sAddress: req.body.address || '',
				sCity: req.body.city || '',
				sState: req.body.state || '',
				sZip: req.body.zip || ''
			}

			const result = await sitelink.callMethod(
				'ReservationNewWithSource_v6',
				args,
				'callCenter',
				locationCode
			)

			// Extract reservation ID from response
			let reservationId = null
			let tenantId = null

			if (result.data?.Table) {
				const resData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				reservationId = resData.ReservationID || resData.iReservationID
				tenantId = resData.TenantID || resData.iTenantID
			} else if (result.retMsg) {
				// Sometimes the ID is in the return message
				const match = result.retMsg.match(/(\d+)/)
				if (match) reservationId = match[1]
			}

			res.json({
				status: 'ok',
				reservationId,
				tenantId,
				unitId: parseInt(unitId),
				moveInDate,
				message: 'Reservation created successfully'
			})

		} catch (e) {
			console.error('Reservations (create) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /reservations/:reservationId
	 * 
	 * Get reservation details
	 */
	router.get('/:reservationId', async (req, res) => {
		try {
			const { reservationId } = req.params
			const { locationCode } = req.query

			const result = await sitelink.callMethod(
				'ReservationList_v3',
				{ iReservationID: parseInt(reservationId) },
				'callCenter',
				locationCode
			)

			let reservation = null
			if (result.data?.Table) {
				const resData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				
				reservation = {
					reservationId: resData.ReservationID,
					tenantId: resData.TenantID,
					unitId: resData.UnitID,
					unitName: resData.sUnitName,
					firstName: resData.sFirstName,
					lastName: resData.sLastName,
					email: resData.sEmail,
					phone: resData.sPhone,
					moveInDate: resData.dtMoveIn,
					expirationDate: resData.dtExpiration,
					status: resData.sStatus,
					createdDate: resData.dtCreated
				}
			}

			if (!reservation) {
				return res.status(404).json({
					status: 'error',
					msg: 'Reservation not found'
				})
			}

			res.json({
				status: 'ok',
				reservation
			})

		} catch (e) {
			console.error('Reservations (get) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * DELETE /reservations/:reservationId
	 * 
	 * Cancel a reservation
	 */
	router.delete('/:reservationId', async (req, res) => {
		try {
			const { reservationId } = req.params
			const { locationCode, reason = 'Customer request' } = req.query

			const result = await sitelink.callMethod(
				'ReservationUpdate_v4',
				{
					iReservationID: parseInt(reservationId),
					sCancelReason: reason,
					bCancelled: true
				},
				'callCenter',
				locationCode
			)

			res.json({
				status: 'ok',
				reservationId,
				message: 'Reservation cancelled successfully'
			})

		} catch (e) {
			console.error('Reservations (cancel) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * PUT /reservations/:reservationId/convert
	 * 
	 * Convert a reservation to a rental (move-in)
	 * This redirects to the move-in flow
	 */
	router.put('/:reservationId/convert', async (req, res) => {
		try {
			const { reservationId } = req.params

			// Get reservation details first
			const { locationCode } = req.query
			const result = await sitelink.callMethod(
				'ReservationList_v3',
				{ iReservationID: parseInt(reservationId) },
				'callCenter',
				locationCode
			)

			if (!result.data?.Table) {
				return res.status(404).json({
					status: 'error',
					msg: 'Reservation not found'
				})
			}

			const resData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table

			// Return reservation data for the move-in flow
			res.json({
				status: 'ok',
				message: 'Use the /movein endpoint to complete the rental',
				reservation: {
					reservationId: resData.ReservationID,
					tenantId: resData.TenantID,
					unitId: resData.UnitID,
					firstName: resData.sFirstName,
					lastName: resData.sLastName,
					email: resData.sEmail,
					phone: resData.sPhone,
					moveInDate: resData.dtMoveIn
				}
			})

		} catch (e) {
			console.error('Reservations (convert) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /reservations
	 * 
	 * List all reservations from SiteLink
	 * 
	 * Query params:
	 * - locationCode: Location code (optional)
	 */
	router.get('/', async (req, res) => {
		try {
			const { locationCode } = req.query

			// Query from SiteLink
			const result = await sitelink.callMethod(
				'ReservationList_v3',
				{},
				'callCenter',
				locationCode
			)

			let reservations = []
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				reservations = tableData.map(res => ({
					reservationId: res.ReservationID || res.iReservationID,
					tenantId: res.TenantID || res.iTenantID,
					unitId: res.UnitID || res.iUnitID,
					unitName: res.sUnitName,
					firstName: res.sFirstName,
					lastName: res.sLastName,
					fullName: `${res.sFirstName || ''} ${res.sLastName || ''}`.trim(),
					email: res.sEmail,
					phone: res.sPhone,
					moveInDate: res.dtMoveIn,
					expirationDate: res.dtExpiration,
					createdDate: res.dtCreated,
					status: res.bCancelled === 'true' || res.bCancelled === true ? 'cancelled' : 
					        res.bConverted === 'true' || res.bConverted === true ? 'converted' : 'active',
					notes: res.sNotes,
					quotedRate: parseFloat(res.dcQuotedRate || 0),
					source: res.sSource
				}))
			}

			res.json({
				status: 'ok',
				reservations,
				count: reservations.length
			})

		} catch (e) {
			console.error('Reservations (list) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	return router
}
