/**
 * SiteLink Units API
 * 
 * Endpoints for managing storage units
 */

const router = require('express').Router()
const sitelink = require('./client')

module.exports = () => {

	/**
	 * GET /units/available
	 * 
	 * Get available units with pricing
	 * 
	 * Query params:
	 * - locationCode: Filter by location (optional, uses default if not provided)
	 * - unitTypeId: Filter by unit type (optional)
	 * - minSqft: Minimum square footage (optional)
	 * - maxSqft: Maximum square footage (optional)
	 */
	router.get('/available', async (req, res) => {
		try {
			const { locationCode, unitTypeId, minSqft, maxSqft } = req.query

			// Use UnitsInformationAvailableUnitsOnly for available units
			const result = await sitelink.callMethod(
				'UnitsInformationAvailableUnitsOnly',
				{},
				'callCenter',
				locationCode
			)

			// Transform to friendly format
			let units = []
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				units = tableData.map(unit => ({
					unitTypeId: unit.UnitTypeID,
					typeName: unit.sTypeName,
					width: parseFloat(unit.dcWidth) || 0,
					depth: parseFloat(unit.dcDepth) || 0,
					sqft: parseFloat(unit.dcSqFt) || 0,
					size: `${unit.dcWidth}' x ${unit.dcDepth}'`,
					floor: parseInt(unit.iFloor) || 1,
					
					// Pricing
					webRate: parseFloat(unit.dcWebRate) || 0,
					standardRate: parseFloat(unit.dcStdRate) || 0,
					pushRate: parseFloat(unit.dcPushRate) || 0,
					
					// Availability
					availableCount: parseInt(unit.iAvailable) || 0,
					
					// Features
					climate: unit.bClimate === 'true' || unit.bClimate === true,
					interior: unit.bInterior === 'true' || unit.bInterior === true,
					driveUp: unit.bDriveUp === 'true' || unit.bDriveUp === true,
					elevator: unit.bElevator === 'true' || unit.bElevator === true,
					power: unit.bPower === 'true' || unit.bPower === true,
					alarmAvailable: unit.bAlarm === 'true' || unit.bAlarm === true,
					
					// Description
					description: unit.sDescription || '',
					category: categorizeSize(parseFloat(unit.dcSqFt) || 0)
				}))
			}

			// Apply client-side filters
			if (unitTypeId) {
				units = units.filter(u => u.unitTypeId == unitTypeId)
			}
			if (minSqft) {
				units = units.filter(u => u.sqft >= parseFloat(minSqft))
			}
			if (maxSqft) {
				units = units.filter(u => u.sqft <= parseFloat(maxSqft))
			}

			// Filter only available
			units = units.filter(u => u.availableCount > 0)

			res.json({
				status: 'ok',
				units,
				count: units.length
			})

		} catch (e) {
			console.error('Units (available) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /units/types
	 * 
	 * Get all unit types (not just available)
	 */
	router.get('/types', async (req, res) => {
		try {
			const { locationCode } = req.query

			const result = await sitelink.callMethod(
				'UnitTypePriceList',
				{},
				'callCenter',
				locationCode
			)

			let unitTypes = []
			if (result.data?.Table) {
				const tableData = Array.isArray(result.data.Table) ? result.data.Table : [result.data.Table]
				
				unitTypes = tableData.map(ut => ({
					unitTypeId: ut.UnitTypeID,
					typeName: ut.sTypeName,
					width: parseFloat(ut.dcWidth) || 0,
					depth: parseFloat(ut.dcDepth) || 0,
					sqft: parseFloat(ut.dcSqFt) || 0,
					size: `${ut.dcWidth}' x ${ut.dcDepth}'`,
					standardRate: parseFloat(ut.dcStdRate) || 0,
					description: ut.sDescription || ''
				}))
			}

			res.json({
				status: 'ok',
				unitTypes,
				count: unitTypes.length
			})

		} catch (e) {
			console.error('Units (types) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /units/:unitId
	 * 
	 * Get details for a specific unit
	 */
	router.get('/:unitId', async (req, res) => {
		try {
			const { unitId } = req.params
			const { locationCode } = req.query

			const result = await sitelink.callMethod(
				'UnitsInformationByUnitID',
				{ iUnitID: parseInt(unitId) },
				'callCenter',
				locationCode
			)

			let unit = null
			if (result.data?.Table) {
				const unitData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				
				unit = {
					unitId: unitData.UnitID,
					unitName: unitData.sUnitName,
					unitTypeId: unitData.UnitTypeID,
					width: parseFloat(unitData.dcWidth) || 0,
					depth: parseFloat(unitData.dcDepth) || 0,
					sqft: parseFloat(unitData.dcSqFt) || 0,
					size: `${unitData.dcWidth}' x ${unitData.dcDepth}'`,
					floor: parseInt(unitData.iFloor) || 1,
					
					// Status
					status: unitData.sStatus,
					isRented: unitData.bRented === 'true' || unitData.bRented === true,
					isReserved: unitData.bReserved === 'true' || unitData.bReserved === true,
					
					// Pricing
					standardRate: parseFloat(unitData.dcStdRate) || 0,
					actualRate: parseFloat(unitData.dcActualRate) || 0,
					
					// Features
					climate: unitData.bClimate === 'true' || unitData.bClimate === true,
					interior: unitData.bInterior === 'true' || unitData.bInterior === true,
					driveUp: unitData.bDriveUp === 'true' || unitData.bDriveUp === true,
					
					// Location within facility
					building: unitData.sBuilding || '',
					aisle: unitData.sAisle || ''
				}
			}

			if (!unit) {
				return res.status(404).json({
					status: 'error',
					msg: 'Unit not found'
				})
			}

			res.json({
				status: 'ok',
				unit
			})

		} catch (e) {
			console.error('Units (detail) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /units/check-availability/:unitId
	 * 
	 * Check if a specific unit is available
	 */
	router.get('/check-availability/:unitId', async (req, res) => {
		try {
			const { unitId } = req.params
			const { locationCode, moveInDate } = req.query

			const args = {
				iUnitID: parseInt(unitId)
			}

			if (moveInDate) {
				args.dtMoveIn = moveInDate
			}

			const result = await sitelink.callMethod(
				'UnitsInformationByUnitID',
				{ iUnitID: parseInt(unitId) },
				'callCenter',
				locationCode
			)

			// Check availability based on unit status
			let available = false
			if (result.data?.Table) {
				const unitData = Array.isArray(result.data.Table) ? result.data.Table[0] : result.data.Table
				available = unitData.sStatus === 'Vacant' || unitData.sStatus === 'Available'
			}

			res.json({
				status: 'ok',
				unitId: parseInt(unitId),
				available: available,
				message: available ? 'Unit is available' : 'Unit is not available'
			})

		} catch (e) {
			console.error('Units (check-availability) -> exception', e)
			res.status(e.retCode ? 400 : 500).json({
				status: 'error',
				msg: e.message,
				retCode: e.retCode
			})
		}
	})

	/**
	 * GET /units/size-guide
	 * 
	 * Get size guide information (static + dynamic)
	 */
	router.get('/size-guide', async (req, res) => {
		try {
			// Return static size guide info with common sizes
			const sizeGuide = [
				{
					size: "5' x 5'",
					sqft: 25,
					category: 'Small',
					equivalent: 'Small closet',
					fits: ['Boxes', 'Small furniture', 'Seasonal items'],
					description: 'Perfect for storing boxes, seasonal decorations, or small amounts of furniture.'
				},
				{
					size: "5' x 10'",
					sqft: 50,
					category: 'Small',
					equivalent: 'Walk-in closet',
					fits: ['Mattress set', 'Small furniture', 'Boxes'],
					description: 'Great for a one-bedroom apartment or small office contents.'
				},
				{
					size: "10' x 10'",
					sqft: 100,
					category: 'Medium',
					equivalent: 'Half of a one-car garage',
					fits: ['2-bedroom apartment', 'Office furniture', 'Appliances'],
					description: 'Ideal for a two-bedroom apartment or small office.'
				},
				{
					size: "10' x 15'",
					sqft: 150,
					category: 'Medium',
					equivalent: 'Two-thirds of a one-car garage',
					fits: ['3-bedroom home', 'Business inventory', 'Vehicles'],
					description: 'Perfect for a three-bedroom home or growing business needs.'
				},
				{
					size: "10' x 20'",
					sqft: 200,
					category: 'Large',
					equivalent: 'One-car garage',
					fits: ['4-bedroom home', 'Vehicles', 'Commercial inventory'],
					description: 'Great for a four-bedroom home or vehicle storage.'
				},
				{
					size: "10' x 30'",
					sqft: 300,
					category: 'Large',
					equivalent: 'One and a half car garage',
					fits: ['5+ bedroom home', 'Multiple vehicles', 'Warehouse overflow'],
					description: 'Ideal for large homes, multiple vehicles, or commercial use.'
				}
			]

			res.json({
				status: 'ok',
				sizeGuide
			})

		} catch (e) {
			console.error('Units (size-guide) -> exception', e)
			res.status(500).json({
				status: 'error',
				msg: e.message
			})
		}
	})

	return router
}

/**
 * Categorize unit by square footage
 */
function categorizeSize(sqft) {
	if (sqft <= 50) return 'Small'
	if (sqft <= 150) return 'Medium'
	return 'Large'
}
