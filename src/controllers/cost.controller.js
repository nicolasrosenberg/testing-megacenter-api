const { retrieveMoveInCost } = require('../services/sitelink/cost.service');
const { ValidationError } = require('../utils/errors');

/**
 * POST /:location/cost/calculate
 *
 * Calcula el costo total de un move-in con descuentos e insurance
 *
 * Body (JSON):
 * - unitId (required): ID de la unidad
 * - moveInDate (required): Fecha de move-in en formato ISO 8601
 * - insuranceCoverageId (optional): ID del plan de seguro (-999 = sin seguro, 0 = propio)
 * - concessionPlanId (optional): ID del descuento (-999 = sin descuento)
 */
async function calculateMoveInCost(req, res, next) {
  try {
    const locationCode = req.locationCode; // Viene del locationHandler middleware

    const {
      unitId,
      moveInDate,
      insuranceCoverageId,
      concessionPlanId
    } = req.body;

    // Validaciones
    if (!unitId || !moveInDate) {
      throw new ValidationError('unitId and moveInDate are required');
    }

    // Validar que unitId sea un número
    const parsedUnitId = parseInt(unitId);
    if (isNaN(parsedUnitId)) {
      throw new ValidationError('unitId must be a valid number');
    }

    // Validar formato de fecha (básico)
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/;
    if (!dateRegex.test(moveInDate)) {
      throw new ValidationError('moveInDate must be in ISO 8601 format (e.g., 2026-02-15T00:00:00Z)');
    }

    // Preparar parámetros con defaults
    const params = {
      unitId: parsedUnitId,
      moveInDate,
      insuranceCoverageId: insuranceCoverageId ? parseInt(insuranceCoverageId) : -999,
      concessionPlanId: concessionPlanId ? parseInt(concessionPlanId) : -999
    };

    const costBreakdown = await retrieveMoveInCost(params, locationCode);

    res.json({
      success: true,
      data: costBreakdown
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  calculateMoveInCost
};
