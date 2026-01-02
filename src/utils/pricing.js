/**
 * Pricing Utilities
 *
 * Helper functions for pricing calculations and discount comparisons
 */

/**
 * Calculate savings amount for a discount
 * @param {object} discount - Transformed discount object
 * @param {number} basePrice - Base price (web rate)
 * @returns {number} Savings in dollars
 */
function calculateDiscountSavings(discount, basePrice) {
	if (!discount || !basePrice) return 0

	switch (discount.type) {
		case 'fixed_rate':
			return basePrice - discount.value
		case 'amount_off':
			return discount.value
		case 'percentage_off':
			return basePrice * (discount.value / 100)
		default:
			return 0
	}
}

/**
 * Find the best discount from a list (highest savings)
 * @param {Array} discounts - Array of discount objects
 * @param {number} basePrice - Base price for comparison
 * @returns {object|null} Best discount or null
 */
function findBestDiscount(discounts, basePrice) {
	if (!discounts || discounts.length === 0) return null

	return discounts.reduce((best, current) => {
		if (!best) return current

		const bestSavings = calculateDiscountSavings(best, basePrice)
		const currentSavings = calculateDiscountSavings(current, basePrice)

		return currentSavings > bestSavings ? current : best
	}, null)
}

module.exports = {
	calculateDiscountSavings,
	findBestDiscount
}
