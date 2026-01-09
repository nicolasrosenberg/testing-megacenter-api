const express = require('express');
const router = express.Router();
const { calculateMoveInCost } = require('../controllers/cost.controller');

/**
 * POST /:location/cost/calculate
 *
 * Calcula el costo total de un move-in
 *
 * Body (JSON):
 * - unitId: ID de la unidad (requerido)
 * - moveInDate: Fecha de move-in en formato ISO 8601 (requerido)
 * - insuranceCoverageId: ID del seguro (opcional, default: -999 sin seguro, 0 = propio)
 * - concessionPlanId: ID del descuento (opcional, default: -999 sin descuento)
 *
 * Nota: El canal siempre es WebRate (1) para este endpoint
 */
router.post('/calculate', calculateMoveInCost);

module.exports = router;
