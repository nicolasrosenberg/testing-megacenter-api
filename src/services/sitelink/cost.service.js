const { callMethod } = require("../shared/client");

/**
 * Calcula el costo total de un move-in con descuentos e insurance
 *
 * @param {Object} params - Parámetros del cálculo
 * @param {number} params.unitId - ID de la unidad
 * @param {string} params.moveInDate - Fecha de move-in (ISO 8601)
 * @param {number} [params.insuranceCoverageId=-999] - ID del seguro (-999 = sin seguro, 0 = propio)
 * @param {number} [params.concessionPlanId=-999] - ID del descuento (-999 = sin descuento)
 * @param {string} [locationCode=null] - Location code override
 * @returns {Promise<Object>} Desglose de cargos del move-in
 */
async function retrieveMoveInCost(
	{ unitId, moveInDate, insuranceCoverageId = -999, concessionPlanId = -999 },
	locationCode = null
) {
	const params = {
		iUnitID: unitId,
		dMoveInDate: moveInDate,
		InsuranceCoverageID: insuranceCoverageId,
		ConcessionPlanID: concessionPlanId,
		ChannelType: 1, // Siempre WebRate (canal web)
	};

	const result = await callMethod(
		"MoveInCostRetrieveWithDiscount_v2",
		params,
		"callCenter",
		locationCode
	);

	// callMethod retorna { data, retCode, retMsg, hasError }
	// La data viene en result.data con las tablas de SiteLink
	const charges = result.data?.Table || [];

	// Calcular el total a pagar en el move-in
	const moveInCharges = charges.filter(
		(charge) =>
			charge.bMoveInRequired === true || charge.bMoveInRequired === "true"
	);
	const totalMoveIn = moveInCharges.reduce((sum, charge) => {
		return (
			sum +
			(parseFloat(charge.dcTotal) || 0) +
			(parseFloat(charge.TaxAmount) || 0)
		);
	}, 0);

	// Calcular total de descuentos aplicados
	const totalDiscount = charges.reduce((sum, charge) => {
		return sum + (parseFloat(charge.dcDiscount) || 0);
	}, 0);

	// Información de la unidad (viene en cada row, tomamos la primera)
	const unitInfo = charges[0] || {};

	return {
		unitId: parseInt(unitInfo.UnitID),
		unitName: unitInfo.UnitName,
		typeName: unitInfo.TypeName,
		dimensions: {
			width: parseInt(unitInfo.Width),
			length: parseInt(unitInfo.Length),
		},
		climate: unitInfo.bClimate,

		// Desglose de cargos
		charges: charges.map((charge) => ({
			description: charge.ChargeDescription,
			amount: parseFloat(charge.ChargeAmount) || 0,
			tax: parseFloat(charge.TaxAmount) || 0,
			discount: parseFloat(charge.dcDiscount) || 0,
			total: parseFloat(charge.dcTotal) || 0,
			startDate: charge.StartDate,
			endDate: charge.EndDate,
			isRequiredAtMoveIn:
				charge.bMoveInRequired === true ||
				charge.bMoveInRequired === "true",
			concessionId: charge.ConcessionID > 0 ? charge.ConcessionID : null,
		})),

		// Totales
		summary: {
			subtotal: charges.reduce(
				(sum, c) => sum + (parseFloat(c.ChargeAmount) || 0),
				0
			),
			totalDiscount: totalDiscount,
			totalTax: charges.reduce(
				(sum, c) => sum + (parseFloat(c.TaxAmount) || 0),
				0
			),
			totalDueAtMoveIn: totalMoveIn,

			// Cargos requeridos vs opcionales
			requiredCharges: moveInCharges.length,
			totalCharges: charges.length,
		},

		// Pricing info (para comparación)
		pricing: {
			tenantRate: parseFloat(unitInfo.dcTenantRate) || 0,
			webRate: parseFloat(unitInfo.WebRate) || 0,
		},
	};
}

module.exports = {
	retrieveMoveInCost,
};
