/**
 * Units Transformer
 *
 * Transforms unit data from SiteLink into clean, frontend-friendly format
 */

const config = require("../../config");
const { parseBoolean, parseDecimal, parseInt } = require("../../utils/parsers");

/**
 * Transform unit type from UnitTypePriceList_v2
 * @param {object} sitelinkUnit - Raw unit type from SiteLink
 * @returns {object} Transformed unit type
 */
function transformUnitType(sitelinkUnit) {
	const width = parseDecimal(sitelinkUnit.dcWidth);
	const length = parseDecimal(sitelinkUnit.dcLength);
	const area = parseDecimal(sitelinkUnit.dcArea);

	return {
		unitTypeId: parseInt(sitelinkUnit.UnitTypeID),
		typeName: sitelinkUnit.sTypeName || "",

		// Dimensions
		width,
		length,
		area,

		// Display
		displaySize: `${width}' x ${length}'`,
		displayArea: `${area} sq ft`,

		// Features
		features: {
			climate: parseBoolean(sitelinkUnit.bClimate),
			inside: parseBoolean(sitelinkUnit.bInside),
			power: parseBoolean(sitelinkUnit.bPower),
			alarm: parseBoolean(sitelinkUnit.bAlarm),
			mobile: parseBoolean(sitelinkUnit.bMobile),
			floor: parseInt(sitelinkUnit.iFloor),
		},

		// Pricing
		pricing: {
			standard: parseDecimal(sitelinkUnit.dcStdRate),
			web: parseDecimal(sitelinkUnit.dcWebRate),
		},

		// Availability
		availability: {
			total: parseInt(sitelinkUnit.iTotalUnits),
			occupied: parseInt(sitelinkUnit.iTotalOccupied),
			vacant: parseInt(sitelinkUnit.iTotalVacant),
			reserved: parseInt(sitelinkUnit.iTotalReserved),
		},

		// First available unit
		firstAvailableUnit: sitelinkUnit.UnitID_FirstAvailable
			? {
					unitId: parseInt(sitelinkUnit.UnitID_FirstAvailable),
					unitName: sitelinkUnit.sUnitName_FirstAvailable || "",
					isRented: parseBoolean(sitelinkUnit.bRented_FirstAvailable),
				}
			: null,

		// Discount
		concessionId: parseInt(sitelinkUnit.ConcessionID) || null,

		// Meta
		siteId: parseInt(sitelinkUnit.SiteID),
		excludeFromInsurance: parseBoolean(sitelinkUnit.bExcludeFromInsurance),
	};
}

/**
 * Transform unit from UnitsInformationByUnitID
 * @param {object} sitelinkUnit - Raw unit from SiteLink
 * @returns {object} Transformed unit
 */
function transformUnit(sitelinkUnit) {
	const width = parseDecimal(sitelinkUnit.dcWidth);
	const length = parseDecimal(sitelinkUnit.dcLength);
	const area = width * length;

	return {
		unitId: parseInt(sitelinkUnit.UnitID),
		siteId: parseInt(sitelinkUnit.SiteID),
		unitTypeId: parseInt(sitelinkUnit.UnitTypeID),
		unitName: sitelinkUnit.sUnitName || "",
		typeName: sitelinkUnit.sTypeName || "",
		description: sitelinkUnit.sUnitDesc || "",

		// Dimensions
		width,
		length,
		area,

		// Display
		displaySize: `${width}' x ${length}'`,
		displayArea: `${area} sq ft`,

		// Features
		features: {
			climate: parseBoolean(sitelinkUnit.bClimate),
			inside: parseBoolean(sitelinkUnit.bInside),
			power: parseBoolean(sitelinkUnit.bPower),
			alarm: parseBoolean(sitelinkUnit.bAlarm),
			mobile: parseBoolean(sitelinkUnit.bMobile),
			floor: parseInt(sitelinkUnit.iFloor),
			rentable: parseBoolean(sitelinkUnit.bRentable),
			rented: parseBoolean(sitelinkUnit.bRented),
			damaged: parseBoolean(sitelinkUnit.bDamaged),
			corporate: parseBoolean(sitelinkUnit.bCorporate),
			excludeFromWebsite: parseBoolean(sitelinkUnit.bExcludeFromWebsite),
			notReadyToRent: parseBoolean(sitelinkUnit.bNotReadyToRent),
		},

		// Pricing
		pricing: {
			push: parseDecimal(sitelinkUnit.dcPushRate),
			standard: parseDecimal(sitelinkUnit.dcStdRate),
			weekly: parseDecimal(sitelinkUnit.dcStdWeeklyRate),
			board: parseDecimal(sitelinkUnit.dcBoardRate),
			web: parseDecimal(sitelinkUnit.dcWebRate),
			preferred: parseDecimal(sitelinkUnit.dcPreferredRate),
			preferredChannelType: parseInt(sitelinkUnit.iPreferredChannelType),
			isPushRate: parseBoolean(sitelinkUnit.bPreferredIsPushRate),
			securityDeposit: parseDecimal(sitelinkUnit.dcStdSecDep),
			lateFee: parseDecimal(sitelinkUnit.dcStdLateFee),
			scheduledMonthly: parseDecimal(sitelinkUnit.dcSchedRateMonthly),
			scheduledWeekly: parseDecimal(sitelinkUnit.dcSchedRateWeekly),
		},

		// Taxes
		tax: {
			charge1: parseBoolean(sitelinkUnit.bChargeTax1),
			charge2: parseBoolean(sitelinkUnit.bChargeTax2),
		},

		// Location
		location: {
			walkThruOrder: parseInt(sitelinkUnit.iWalkThruOrder),
			floor: parseInt(sitelinkUnit.iFloor),
			mapTop: parseDecimal(sitelinkUnit.dcMapTop),
			mapLeft: parseDecimal(sitelinkUnit.dcMapLeft),
			mapTheta: parseDecimal(sitelinkUnit.dcMapTheta),
			mapReversWL: parseBoolean(sitelinkUnit.bMapReversWL),
			entryLoc: parseInt(sitelinkUnit.iEntryLoc),
			doorType: parseInt(sitelinkUnit.iDoorType),
		},

		// Tracking
		trackingCode: sitelinkUnit.sTrackingCode || "",
		rfid: sitelinkUnit.sRFID || "",
		globalUnitName: sitelinkUnit.sGlobalUnitName || "",

		// Dates
		created: sitelinkUnit.dCreated || null,
		updated: sitelinkUnit.dUpdated || null,
		deleted: sitelinkUnit.dDeleted || null,
		built: sitelinkUnit.dBuilt || null,
		firstInService: sitelinkUnit.dFirstInService || null,
		damaged: sitelinkUnit.dDamaged || null,

		// Unit Type Info
		unitType: {
			defaultTypeName: sitelinkUnit.sDefTypeName || "",
			category: sitelinkUnit.sCategory || "",
			defaultLeaseNum: parseInt(sitelinkUnit.iDefLeaseNum),
			excludeFromAutoTenRateMgmt: parseBoolean(
				sitelinkUnit.bExcludeFromAutoTenRateMgmt,
			),
			excludeFromRevenueMgmt: parseBoolean(
				sitelinkUnit.bExcludeFromRevenueMgmt,
			),
			showOnReservations: parseBoolean(sitelinkUnit.bShowOnReservations),
			excludeFromInsurance: parseBoolean(
				sitelinkUnit.bExcludeFromInsurance,
			),
			excludeFromOccupancy: parseBoolean(
				sitelinkUnit.bExcludeFromOccupancy,
			),
			excludeFromArea: parseBoolean(sitelinkUnit.bExcludeFromArea),
			vacateNoticeDays: parseInt(sitelinkUnit.iVacateNoticeDays),
			vacateNoticeGraceDays: parseInt(
				sitelinkUnit.iVacateNoticeGraceDays,
			),
			waitingListReserved: parseBoolean(
				sitelinkUnit.bWaitingListReserved,
			),
			insuranceRequired: parseInt(sitelinkUnit.iInsuranceRequired),
			defaultCoverageId: parseInt(sitelinkUnit.DefaultCoverageID),
			billingFreqIdDefault: parseInt(sitelinkUnit.BillingFreqID_Default),
		},

		// Notes
		note: sitelinkUnit.sUnitNote || "",
		noteDate: sitelinkUnit.dUnitNote || null,
	};
}

module.exports = {
	transformUnitType,
	transformUnit,
};
