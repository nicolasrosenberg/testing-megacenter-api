/**
 * SiteLink Discounts Service
 *
 * SOAP methods related to discounts and concessions
 */

const client = require("../shared/client");

/**
 * Get all discount plans
 * Calls DiscountPlansRetrieve
 *
 * @param {string} locationCode - Location code override (optional)
 * @returns {Promise<object>} Parsed response with discount plans and restrictions
 */
async function getDiscountPlans(locationCode = null) {
	return await client.callMethod(
		"DiscountPlansRetrieve",
		{},
		"callCenter",
		locationCode,
	);
}

/**
 * Build discount restrictions map
 * Maps ConcessionID to array of unit type/dimension restrictions
 *
 * @param {array} concessionUnitTypes - ConcessionUnitTypes from DiscountPlansRetrieve
 * @returns {object} Map of ConcessionID to restrictions
 */
function buildDiscountRestrictionsMap(concessionUnitTypes) {
	const map = {};

	if (!concessionUnitTypes || !Array.isArray(concessionUnitTypes)) {
		return map;
	}

	concessionUnitTypes.forEach((restriction) => {
		const concessionId = parseInt(restriction.ConcessionID);

		if (!map[concessionId]) {
			map[concessionId] = [];
		}

		map[concessionId].push({
			unitTypeId: parseInt(restriction.UnitTypeID) || null,
			width: parseFloat(restriction.dcWidth) || null,
			length: parseFloat(restriction.dcLength) || null,
		});
	});

	return map;
}

/**
 * Check if discount applies to specific unit type
 *
 * @param {number} concessionId - Discount ID
 * @param {number} unitTypeId - Unit type ID
 * @param {number} width - Unit width
 * @param {number} length - Unit length
 * @param {object} restrictionsMap - Map from buildDiscountRestrictionsMap()
 * @returns {boolean} True if discount applies
 */
function discountAppliesToUnit(
	concessionId,
	unitTypeId,
	width,
	length,
	restrictionsMap,
) {
	const restrictions = restrictionsMap[concessionId];

	// If NO restrictions, discount applies to ALL units
	if (!restrictions || restrictions.length === 0) {
		return true;
	}

	// If there ARE restrictions, check for exact match
	return restrictions.some((r) => {
		// Must match unit type
		if (r.unitTypeId !== unitTypeId) {
			return false;
		}

		// If width/length specified, must match
		if (r.width && r.width !== width) {
			return false;
		}

		if (r.length && r.length !== length) {
			return false;
		}

		return true;
	});
}

module.exports = {
	getDiscountPlans,
	buildDiscountRestrictionsMap,
	discountAppliesToUnit,
};
