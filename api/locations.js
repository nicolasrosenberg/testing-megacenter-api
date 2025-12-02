/**
 * SiteLink Locations API
 * 
 * Endpoints for managing facility locations
 */

const router = require('express').Router()
const sitelink = require('./client')

module.exports = () => {

	/**
	 * GET /locations
	 * 
	 * Get list of all locations/facilities
	 */
	router.get('/', async (req, res) => {
		try {
			const result = await sitelink.callMethod('SiteInformation', {})

			// Transform to friendly format
			const locations = []
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				for (const site of tableData) {
					locations.push({
						siteId: site.SiteID,
						siteName: site.sSiteName,
						locationCode: site.sLocationCode,
						address: {
							street1: site.sSiteAddr1,
							city: site.sSiteCity,
							state: site.sSiteRegion,
							zip: site.sSitePostalCode
						},
						phone: site.sSitePhone,
						email: site.sEmailAddress,
						latitude: parseFloat(site.dcLatitude) || null,
						longitude: parseFloat(site.dcLongitude) || null
					})
				}
			}

			res.json({
				status: 'ok',
				locations,
				count: locations.length
			})

		} catch (e) {
			console.error('Locations (list) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /locations/:locationCode
	 * 
	 * Get details for a specific location
	 */
	router.get('/:locationCode', async (req, res) => {
		try {
			const { locationCode } = req.params

			const result = await sitelink.callMethod('SiteInformation', {}, 'callCenter', locationCode)

			// Transform to friendly format
			let location = null
			if (result.data?.Table) {
				const site = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				
				location = {
					// IDs
					siteId: site.SiteID,
					ownerId: site.OwnerID,
					globalSiteNum: site.sGlobalSiteNum,
					locationCode: site.sLocationCode,
					
					// Basic Info
					siteName: site.sSiteName,
					legalName: site.sLegalName,
					description: site.sLocationDesc,
					
					// Contact
					contactName: site.sContactName,
					email: site.sEmailAddress,
					phone: site.sSitePhone,
					fax: site.sSiteFAX,
					website: site.sWebSiteURL,
					
					// Address
					address: {
						street1: site.sSiteAddr1,
						street2: site.sSiteAddr2,
						city: site.sSiteCity,
						state: site.sSiteRegion,
						zip: site.sSitePostalCode,
						country: site.sSiteCountry
					},
					
					// Coordinates
					latitude: parseFloat(site.dcLatitude) || null,
					longitude: parseFloat(site.dcLongitude) || null,
					
					// Hours
					hours: {
						weekday: {
							open: site.tWeekdayStrt,
							close: site.tWeekdayEnd,
							closed: site.bClosedWeekdays === 'true'
						},
						saturday: {
							open: site.tSaturdayStrt,
							close: site.tSaturdayEnd,
							closed: site.bClosedSaturday === 'true'
						},
						sunday: {
							open: site.tSundayStrt,
							close: site.tSundayEnd,
							closed: site.bClosedSunday === 'true'
						}
					},
					
					// Timezone
					gmtOffset: parseInt(site.iGMTTimeOffset) || 0,
					dstEnabled: site.iDST === '1',
					
					// Features
					features: {
						maxUnits: parseInt(site.iFeatMaxUnits) || 0,
						gate: site.bFeatGate === 'true',
						kiosk: site.bFeatKiosk === 'true',
						revenueManagement: site.bFeatRevMgmt === 'true',
						creditCards: site.bFeatCreditCards === 'true',
						ach: site.bFeatACH === 'true',
						corpOffice: site.bFeatCorpOffice === 'true',
						accounting: site.bFeatAccounting === 'true',
						recordStorage: site.bFeatRecordStorage === 'true',
						mobileStorage: site.bFeatMobileStorage === 'true',
						promoAdvanced: site.bFeatPromoAdvanced === 'true'
					},
					
					// Status
					status: {
						disabled: site.bSiteDisabled === 'true',
						trial: site.bTrial === 'true',
						subscription: site.bSubscription === 'true',
						liteVersion: site.bLiteVersion === 'true',
						archived: site.bArchived === 'true'
					},
					
					// Settings
					onlinePaymentsAllowed: site.iOnLinePmtsAllowed === '1',
					
					// Timestamps
					createdAt: site.dCreated,
					updatedAt: site.dUpdated,
					lastOvernightProcess: site.dOvernightProcess
				}
			}

			if (!location) {
				return res.status(404).json({
					status: 'error',
					msg: 'Location not found'
				})
			}

			res.json({
				status: 'ok',
				location
			})

		} catch (e) {
			console.error('Locations (detail) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /locations/:locationCode/hours
	 * 
	 * Get office and access hours for a location
	 */
	router.get('/:locationCode/hours', async (req, res) => {
		try {
			const { locationCode } = req.params

			// SiteInformation includes office/access hours
			const result = await sitelink.callMethod('SiteInformation', {}, 'callCenter', locationCode)

			let hours = null
			if (result.data?.Table) {
				const site = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				hours = {
					weekday: {
						open: site.tWeekdayStrt,
						close: site.tWeekdayEnd,
						closed: site.bClosedWeekdays === 'true'
					},
					saturday: {
						open: site.tSaturdayStrt,
						close: site.tSaturdayEnd,
						closed: site.bClosedSaturday === 'true'
					},
					sunday: {
						open: site.tSundayStrt,
						close: site.tSundayEnd,
						closed: site.bClosedSunday === 'true'
					},
					gmtOffset: parseInt(site.iGMTTimeOffset) || 0
				}
			}

			res.json({
				status: 'ok',
				hours
			})

		} catch (e) {
			console.error('Locations (hours) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	return router
}
