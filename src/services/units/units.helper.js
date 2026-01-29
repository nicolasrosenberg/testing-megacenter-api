/**
 * Units Helper
 *
 * Shared unit validation and processing functions
 */

const unitsService = require("./units.service");
const discountsService = require("../discounts/discounts.service");
const unitsTransformer = require("./units.transformer");
const discountsTransformer = require("../discounts/discounts.transformer");
const { logInfo } = require("../../middleware/logger");
const { ValidationError, NotFoundError } = require("../../utils/errors");
const { findBestDiscount } = require("../../utils/pricing");

/**
 * Validate unit availability and get unit info with applicable discounts
 *
 * @param {number} unitId - Unit ID to validate
 * @param {string} locationCode - Location code
 * @param {boolean} includeDiscounts - Whether to fetch and include discounts (default: true)
 * @returns {Promise<object>} Unit information with discounts
 * @throws {NotFoundError} If unit not found
 * @throws {ValidationError} If unit is not available
 */
async function validateAndGetUnitWithDiscounts(
	unitId,
	locationCode,
	includeDiscounts = true,
) {
	logInfo("UnitsHelper", `Validating unit ${unitId}`, { includeDiscounts });

	// Fetch unit and optionally discounts in parallel
	const promises = [unitsService.getUnitById(unitId, locationCode)];

	if (includeDiscounts) {
		promises.push(discountsService.getDiscountPlans(locationCode));
	}

	const responses = await Promise.all(promises);
	const unitResponse = responses[0];
	const discountsResponse = includeDiscounts ? responses[1] : null;

	// Extract unit data
	const unitRaw = unitResponse.data.Table;
	const unit = Array.isArray(unitRaw) ? unitRaw[0] : unitRaw;

	if (!unit) {
		throw new NotFoundError(`Unit ${unitId} not found`);
	}

	// Check availability flags
	const bRented = unit.bRented === true || unit.bRented === "true";
	const bRentable = unit.bRentable === true || unit.bRentable === "true";
	const isAvailable = !bRented && bRentable;

	if (!isAvailable) {
		const reasons = [];
		if (bRented) reasons.push("already rented");
		if (!bRentable) reasons.push("not rentable");

		throw new ValidationError(
			`Unit ${unitId} is not available: ${reasons.join(", ")}`,
		);
	}

	// Transform unit data
	const transformedUnit = unitsTransformer.transformUnit(unit);

	// If discounts not requested, return basic info
	if (!includeDiscounts) {
		logInfo("UnitsHelper", "Unit is available", {
			unitId: transformedUnit.unitId,
			unitName: transformedUnit.name,
		});

		return {
			unitId: transformedUnit.unitId,
			unitName: transformedUnit.name,
			unitTypeId: transformedUnit.unitTypeId,
			width: transformedUnit.width,
			length: transformedUnit.length,
			isAvailable: true,
		};
	}

	// Process discounts
	const discountPlansRaw = discountsResponse.data.ConcessionPlans;
	const concessionUnitTypesRaw = discountsResponse.data.ConcessionUnitTypes;

	const discountPlans = Array.isArray(discountPlansRaw)
		? discountPlansRaw
		: discountPlansRaw
			? [discountPlansRaw]
			: [];
	const concessionUnitTypes = Array.isArray(concessionUnitTypesRaw)
		? concessionUnitTypesRaw
		: concessionUnitTypesRaw
			? [concessionUnitTypesRaw]
			: [];

	// Build discount restrictions map
	const restrictionsMap =
		discountsService.buildDiscountRestrictionsMap(concessionUnitTypes);

	// Process and filter discounts (only website-available)
	const applicableDiscounts = [];

	discountPlans.forEach((discountRaw) => {
		const discount = discountsTransformer.transformDiscount(discountRaw);

		// Filter: only website-available discounts
		if (discountsTransformer.isDiscountAvailableOnWebsite(discount)) {
			// Check if discount applies to this specific unit
			if (
				discountsService.discountAppliesToUnit(
					discount.concessionId,
					transformedUnit.unitTypeId,
					transformedUnit.width,
					transformedUnit.length,
					restrictionsMap,
				)
			) {
				applicableDiscounts.push(discount);
			}
		}
	});
	console.log("APPLICABLE DISCOUNTS", applicableDiscounts);

	// Find best discount
	const bestDiscount = findBestDiscount(
		applicableDiscounts,
		transformedUnit.pricing.web,
	);

	logInfo("UnitsHelper", `Unit ${unitId} validated successfully`, {
		hasDiscount: !!bestDiscount,
		applicableDiscountsCount: applicableDiscounts.length,
	});

	return {
		...transformedUnit,
		pricing: {
			...transformedUnit.pricing,
		},
		discount: bestDiscount,
		applicableDiscounts,
		isAvailable: true,
	};
}

module.exports = {
	validateAndGetUnitWithDiscounts,
};
