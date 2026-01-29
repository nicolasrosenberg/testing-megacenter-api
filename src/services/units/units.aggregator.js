/**
 * Units Aggregator
 *
 * Business logic for grouping, filtering, and organizing units
 */

const config = require("../../config");
const { findBestDiscount } = require("../../utils/pricing");
const unitsTransformer = require("./units.transformer");
const discountsTransformer = require("../discounts/discounts.transformer");
const discountsService = require("../discounts/discounts.service");

/**
 * Assign tier to unit option based on position and total count
 * @param {number} index - Option index (0-based)
 * @param {number} total - Total number of options
 * @returns {string} Tier key (GOOD, BETTER, BEST, PREMIUM)
 */
function assignTier(index, total) {
	if (total === 1) return "GOOD";
	if (total === 2) return index === 0 ? "GOOD" : "BETTER";
	if (total === 3) {
		if (index === 0) return "GOOD";
		if (index === 1) return "BETTER";
		return "BEST";
	}

	// 4+ options: divide into quarters
	const quarter = total / 4;
	if (index < quarter) return "GOOD";
	if (index < quarter * 2) return "BETTER";
	if (index < quarter * 3) return "BEST";
	return "PREMIUM";
}

/**
 * Filter unit types with availability
 * @param {Array} unitTypes - Raw unit types from SiteLink
 * @returns {Array} Unit types with vacant units
 */
function filterAvailableUnits(unitTypes) {
	return unitTypes.filter((ut) => {
		return (
			ut.bRented_FirstAvailable === false ||
			ut.bRented_FirstAvailable === "false"
		);
	});
}

/**
 * Process and filter discounts
 * @param {Array} discountPlans - Raw discount plans from SiteLink
 * @returns {Map} Map of discountId -> transformed discount (only website-available)
 */
function processDiscounts(discountPlans) {
	const discountsMap = new Map();

	discountPlans.forEach((discountRaw) => {
		const discount = discountsTransformer.transformDiscount(discountRaw);

		// Filter: only website-available discounts
		if (discountsTransformer.isDiscountAvailableOnWebsite(discount)) {
			discountsMap.set(discount.concessionId, discount);
		}
	});
	return discountsMap;
}

/**
 * Find applicable discounts for a unit type
 * @param {object} unitType - Transformed unit type
 * @param {Map} discountsMap - Map of available discounts
 * @param {object} restrictionsMap - Discount restrictions map
 * @returns {Array} Applicable discounts
 */
function findApplicableDiscounts(unitType, discountsMap) {
	const applicable = [];

	discountsMap.forEach((discount) => {
		if (
			discountsService.discountAppliesToUnit(
				discount.concessionId,
				unitType.unitTypeId,
				unitType.width,
				unitType.length,
				restrictionsMap,
			)
		) {
			applicable.push(discount);
		}
	});

	return applicable;
}

/**
 * Build unit option object
 * @param {object} unitTypeRaw - Raw unit type from SiteLink
 * @param {object} unitType - Transformed unit type
 * @param {object} bestDiscount - Best applicable discount or null
 * @returns {object} Unit option
 */
function buildUnitOption(unitTypeRaw, unitType, bestDiscount) {
	return {
		unitTypeId: unitType.unitTypeId,
		tier: "", // Will be assigned later
		tierDescription: "", // Will be assigned later
		description: unitTypeRaw.sUnitDesc_FirstAvailable || "",

		features: {
			climate: unitType.features.climate,
			inside: unitType.features.inside,
			power: unitType.features.power,
			alarm: unitType.features.alarm,
			floor: unitType.features.floor,
			mobile: unitType.features.mobile,
			typeName: unitType.typeName,
		},

		pricing: {
			standard: unitType.pricing.standard,
			web: unitType.pricing.web,
		},

		availability: {
			total: unitType.availability.total,
			occupied: unitType.availability.occupied,
			vacant: unitType.availability.vacant,
			reserved: unitType.availability.reserved,
			firstAvailableUnitId: unitType.firstAvailableUnit?.unitId || null,
			firstAvailableUnitName:
				unitType.firstAvailableUnit?.unitName || null,
			isAvailable: unitType.availability.vacant > 0,
		},

		discount: bestDiscount,
	};
}

/**
 * Group units by dimension and type
 * @param {Array} availableUnitTypes - Raw unit types with availability
 * @param {Map} discountsMap - Map of available discounts
 * @returns {object} Groups object keyed by groupKey
 */
function groupUnitsByDimension(availableUnitTypes, discountsMap) {
	const groups = {};

	availableUnitTypes.forEach((unitTypeRaw) => {
		const unitType = unitsTransformer.transformUnitType(unitTypeRaw);

		// Create group key: {width}x{length}:{typeName}
		const groupKey = `${unitType.width}x${unitType.length}:${unitType.typeName}`;

		if (!groups[groupKey]) {
			groups[groupKey] = {
				key: groupKey,
				width: unitType.width,
				length: unitType.length,
				area: unitType.area,
				typeName: unitType.typeName,
				options: [],
			};
		}

		// Get best discount
		const bestDiscount = discountsMap.get(unitType.concessionId);

		// Create option
		const option = buildUnitOption(unitTypeRaw, unitType, bestDiscount);
		groups[groupKey].options.push(option);
	});

	return groups;
}

/**
 * Process a single group: sort, assign tiers, extract common data
 * @param {object} group - Group object
 * @returns {object} Processed group
 */
function processGroup(group) {
	// Sort options by effective price (lowest to highest)
	group.options.sort((a, b) => a.pricing.web - b.pricing.web);

	// Assign tiers
	group.options.forEach((option, index) => {
		const tierKey = assignTier(index, group.options.length);
		option.tier = config.TIER_LEVELS[tierKey];
		option.tierDescription = config.TIER_DESCRIPTIONS[tierKey];
	});

	// Extract common description
	const descriptions = [
		...new Set(group.options.map((o) => o.description).filter((d) => d)),
	];
	const commonDescription = descriptions.length === 1 ? descriptions[0] : "";

	// Extract common discount
	// A discount is only "common" if ALL options in the group have the same discount
	const discountIds = [
		...new Set(
			group.options
				.filter((o) => o.discount)
				.map((o) => o.discount.concessionId),
		),
	];

	const commonDiscount =
		discountIds.length === 1 &&
		group.options.every(
			(option) => option.discount?.concessionId === discountIds[0],
		)
			? group.options.find((o) => o.discount)?.discount
			: null;

	// If common discount exists, remove from individual options
	if (commonDiscount) {
		group.options.forEach((option) => {
			if (option.discount?.concessionId === commonDiscount.concessionId) {
				option.discount = null;
			}
		});
	}

	// Calculate min prices
	const webPrices = group.options
		.map((o) => o.pricing.web)
		.filter((p) => p > 0);
	const standardPrices = group.options
		.map((o) => o.pricing.standard)
		.filter((p) => p > 0);

	return {
		id: group.key,
		key: group.key,
		width: group.width,
		length: group.length,
		area: group.area,
		typeName: group.typeName,

		displayName: `${group.width}' x ${group.length}'`,
		displayType: group.typeName,
		displaySize: `${group.area} sq ft`,

		description: commonDescription,
		commonDiscount,

		options: group.options,

		minWebPrice: webPrices.length > 0 ? Math.min(...webPrices) : 0,
		minStandardPrice:
			standardPrices.length > 0 ? Math.min(...standardPrices) : 0,

		totalAvailable: group.options.reduce(
			(sum, o) => sum + o.availability.vacant,
			0,
		),
	};
}

/**
 * Main aggregation function: orchestrates the entire grouping process
 * @param {Array} unitTypes - Raw unit types from SiteLink
 * @param {Array} discountPlans - Raw discount plans from SiteLink
 * @returns {Array} Grouped and processed units
 */
function aggregateUnits(unitTypes, discountPlans) {
	// Step 1: Process and filter discounts
	const discountsMap = processDiscounts(discountPlans);

	// Step 2: Filter unit types with availability
	const availableUnitTypes = filterAvailableUnits(unitTypes);

	// Step 3: Group by dimension + type
	const groups = groupUnitsByDimension(availableUnitTypes, discountsMap);

	// Step 4: Process each group
	const result = Object.values(groups).map(processGroup);

	// Step 5: Sort by area, then type name
	result.sort((a, b) => {
		if (a.area !== b.area) {
			return a.area - b.area;
		}
		return a.typeName.localeCompare(b.typeName);
	});

	return result;
}

module.exports = {
	assignTier,
	filterAvailableUnits,
	processDiscounts,
	findApplicableDiscounts,
	buildUnitOption,
	groupUnitsByDimension,
	processGroup,
	aggregateUnits,
};
