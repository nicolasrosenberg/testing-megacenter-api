const { callMethod } = require("../shared/client");
const { getInsurancePlans } = require("../insurance/insurance.service");
const {
	transformInsurancePlans,
} = require("../insurance/insurance.transformer");

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
	locationCode = null,
) {
	const params = {
		iUnitID: unitId,
		dMoveInDate: moveInDate,
		InsuranceCoverageID: insuranceCoverageId,
		ConcessionPlanID: concessionPlanId,
		ChannelType: 1, // Siempre WebRate (canal web)
	};

	const result = await callMethod(
		"MoveInCostRetrieveWithDiscount_v4",
		params,
		"callCenter",
		locationCode,
	);

	// Get insurance coverage info
	let selectedInsuranceCoverage = null;
	if (insuranceCoverageId !== -999) {
		const rawInsuranceCoverageInfo = await getInsurancePlans(locationCode);
		const transformedInsuranceCoverageInfo = transformInsurancePlans(
			rawInsuranceCoverageInfo,
		);
		selectedInsuranceCoverage = transformedInsuranceCoverageInfo.plans.find(
			(plan) =>
				parseInt(plan.insuranceCoverageId) ===
				parseInt(insuranceCoverageId),
		);
		if (!selectedInsuranceCoverage) {
			throw new Error(
				`Insurance coverage with ID ${insuranceCoverageId} not found`,
			);
		}
	}

	// callMethod retorna { data, retCode, retMsg, hasError }
	// La data viene en result.data con las tablas de SiteLink
	const charges = result.data?.Table || [];

	// Calcular el total a pagar en el move-in
	const moveInCharges = charges.filter(
		(charge) =>
			charge.bMoveInRequired === true ||
			charge.bMoveInRequired === "true",
	);

	const totalMoveIn = moveInCharges.reduce((sum, charge) => {
		return sum + (parseFloat(charge.dcTotal) || 0);
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
			webRate: parseFloat(charge.WebRate) || 0,
			type: charge.StartDate === charge.EndDate ? "one-time" : "monthly",
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
				0,
			),
			totalDiscount: totalDiscount,
			totalTax: charges.reduce(
				(sum, c) => sum + (parseFloat(c.TaxAmount) || 0),
				0,
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
			insuranceCoverageRate:
				parseFloat(selectedInsuranceCoverage?.premium) || 0,
		},
	};
}

/**
 * Configura autopay para un ledger usando TenantBillingInfoUpdate_v2
 * Guarda la información de tarjeta de crédito completa para pagos automáticos
 * Cobra automáticamente el día del vencimiento (daysAfterDue = 0)
 *
 * @param {Object} params - Parámetros del autopay
 * @param {number} params.ledgerId - ID del ledger (retornado por move-in)
 * @param {number} params.creditCardType - Tipo de tarjeta (5=MC, 6=VISA, 7=Amex, 8=Discover)
 * @param {string} params.creditCardNumber - Número de tarjeta COMPLETO (no masked)
 * @param {string} params.creditCardExpirationDate - Fecha de expiración (ISO 8601)
 * @param {string} params.billingName - Nombre en la tarjeta
 * @param {string} params.billingAddress - Dirección de facturación
 * @param {string} params.billingZipCode - Código postal
 * @param {string} [locationCode=null] - Location code override
 * @returns {Promise<Object>} Resultado de la configuración
 */
async function setupAutopay(
	{
		ledgerId,
		creditCardType,
		creditCardNumber,
		creditCardExpirationDate,
		billingName,
		billingAddress,
		billingZipCode,
	},
	locationCode = null,
) {
	const params = {
		iLedgerID: ledgerId,
		iCreditCardTypeID: creditCardType,
		sCreditCardNum: creditCardNumber, // Número completo para guardar autopay
		dCredtiCardExpir: creditCardExpirationDate,
		sCreditCardHolderName: billingName,
		sCreditCardStreet: billingAddress,
		sCreditCardZip: billingZipCode,
		iAutoBillType: 1, // 1 = Credit Card
		sACH_CheckWriterAcctNum: "",
		sACH_ABA_RoutingNum: "",
		sACH_Check_SavingsCode: "",
		iDaysAfterDue: 0, // Cobrar el día del vencimiento
	};

	const result = await callMethod(
		"TenantBillingInfoUpdate_v2",
		params,
		"callCenter",
		locationCode,
	);

	// retCode > 0 significa que el LedgerID fue actualizado exitosamente
	if (result.retCode <= 0) {
		throw new Error(
			`Failed to setup autopay: ${
				result.retMsg || "Unknown error"
			} (Code: ${result.retCode})`,
		);
	}

	return {
		ledgerId: result.retCode,
		success: true,
		message: "Autopay configured successfully",
	};
}

module.exports = {
	retrieveMoveInCost,
	setupAutopay,
};
