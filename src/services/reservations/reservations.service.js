/**
 * SiteLink Reservations Service
 *
 * SOAP methods related to creating reservations
 */

const client = require('../shared/client')
const tenantService = require('../tenant/tenant.service')
const { logInfo } = require('../../middleware/logger')

/**
 * Helper: Remove null/undefined fields and empty strings for date fields
 * SiteLink SOAP doesn't accept empty strings for certain types
 */
function cleanSoapArgs(args) {
	const cleaned = {}
	for (const [key, value] of Object.entries(args)) {
		// Skip null/undefined
		if (value === null || value === undefined) {
			continue
		}
		// Skip empty strings for date fields (dDOB, etc)
		if (key.startsWith('d') && value === '') {
			continue
		}
		cleaned[key] = value
	}
	return cleaned
}

/**
 * Create a new reservation
 * Calls ReservationNewWithSource_v5
 *
 * @param {object} reservationData - Reservation information
 * @param {number} reservationData.tenantId - Tenant ID (required)
 * @param {number} reservationData.unitId - Unit ID (required)
 * @param {string} reservationData.moveInDate - Move-in date (ISO format)
 * @param {string} reservationData.comment - Comment/notes
 * @param {number} reservationData.concessionId - Discount ID (optional, default -999)
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with WaitingListID
 */
async function createReservation(reservationData, locationCode = null) {
	const args = cleanSoapArgs({
		sTenantID: String(reservationData.tenantId),
		sUnitID: String(reservationData.unitId),
		sUnitID2: '',
		sUnitID3: '',
		dNeeded: reservationData.moveInDate,
		sComment: reservationData.comment || '',
		iSource: 5, // Website
		sSource: 'Website API',
		QTRentalTypeID: 2, // Order (Reservation)
		iInquiryType: 2, // Web
		dcQuotedRate: null,
		dExpires: null,
		dFollowUp: null,
		sTrackingCode: '',
		sCallerID: '',
		ConcessionID: reservationData.concessionId || -999
	})

	logInfo('ReservationsService', 'Creating reservation', {
		tenantId: reservationData.tenantId,
		unitId: reservationData.unitId
	})

	const response = await client.callMethod(
		'ReservationNewWithSource_v5',
		args,
		'callCenter',
		locationCode
	)

	// Extract WaitingListID from Ret_Code (positive number = success)
	const rtData = Array.isArray(response.data) ? response.data[0] : response.data

	return {
		waitingListId: response.retCode, // Ret_Code contains the WaitingListID
		globalWaitingNum: rtData || response.retMsg,
		rawResponse: response
	}
}

/**
 * Complete reservation flow: create tenant + create reservation
 *
 * @param {object} data - Complete reservation data
 * @param {number} data.unitId - Unit ID
 * @param {string} data.firstName - First name
 * @param {string} data.lastName - Last name
 * @param {string} data.email - Email
 * @param {string} data.phone - Phone
 * @param {string} data.moveInDate - Move-in date (ISO format)
 * @param {string} data.comment - Comment/notes
 * @param {string} data.address - Address (optional)
 * @param {string} data.city - City (optional)
 * @param {string} data.state - State (optional)
 * @param {string} data.zipCode - Zip code (optional)
 * @param {number} data.concessionId - Discount ID (optional)
 * @param {string} locationCode - Location code
 * @returns {Promise<object>} Combined result
 */
async function createReservationFlow(data, locationCode) {
	// Step 1: Create tenant
	const tenantResult = await tenantService.createTenant({
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		phone: data.phone,
		address: data.address,
		city: data.city,
		state: data.state,
		zipCode: data.zipCode,
		notes: data.comment
	}, locationCode)

	logInfo('ReservationsService', 'Tenant created', {
		tenantId: tenantResult.tenantId
	})

	// Step 2: Create reservation
	const reservationResult = await createReservation({
		tenantId: tenantResult.tenantId,
		unitId: data.unitId,
		moveInDate: data.moveInDate,
		comment: data.comment,
		concessionId: data.concessionId
	}, locationCode)

	logInfo('ReservationsService', 'Reservation created', {
		waitingListId: reservationResult.waitingListId
	})

	return {
		tenantId: tenantResult.tenantId,
		accessCode: tenantResult.accessCode,
		reservationId: reservationResult.waitingListId,
		globalWaitingNum: reservationResult.globalWaitingNum
	}
}

module.exports = {
	createReservation,
	createReservationFlow
}
