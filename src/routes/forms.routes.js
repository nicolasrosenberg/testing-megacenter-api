/**
 * Forms Routes
 *
 * Express routes for forms endpoints
 */

const router = require("express").Router();
const formsController = require("../controllers/forms.controller");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * POST /forms
 *
 * Create a new form and send it to the CRM
 */
router.post("/", asyncHandler(formsController.createForm));

module.exports = router;
