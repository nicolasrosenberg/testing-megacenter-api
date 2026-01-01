
/**
 * Init
 */

// Load environment variables first
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { URL } = require('url')

// Import new middleware and config
const config = require('./src/config')
const { requestLogger } = require('./src/middleware/logger')
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler')

// ++ Express
const app = express()
// trust proxy (AWS ALB)
app.set("trust proxy", 1)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS configuration
const corsOptions = config.app.allowedOrigins
	? {
		origin: (origin, callback) => {
			// Allow requests with no origin (mobile apps, Postman, etc.)
			if (!origin) return callback(null, true)

			const allowedOrigins = config.app.allowedOrigins
			if (allowedOrigins.includes(origin)) {
				callback(null, true)
			} else {
				callback(new Error('Not allowed by CORS'))
			}
		},
		credentials: true
	}
	: { origin: '*' }

app.use(cors(corsOptions))

let server

/**
 * Init
 */
async function init() {

	// Validate SiteLink configuration
	try {
		config.sitelink.validateConfig()
	} catch (error) {
		console.error('Failed to validate SiteLink configuration:', error.message)
		process.exit(1)
	}

	// start server
	server = await app.listen(config.app.port)

	console.log("Init -> server listening", new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" }))

	// Request logger
	app.use(requestLogger)

	/**
	 * Express Interceptor
	 */
	app.use((req, res, next) => {

		if (req.path.match(/health/)) return next()

		// validate API_KEY
		if (config.app.apiKey && config.app.apiKey != req.get("X-Api-Key")) {
			return res.status(401).json({ status: "error", msg: "unauthorized" })
		}

		next()
	})

	/**
	 * GET - Health check
	 */
	app.get('*/health', (req, res) => res.sendStatus(200))

	/**
	 * SiteLink API Routes
	 */
	app.use('/', require('./src/routes'))

	/**
	 * Not Found (must be before error handler)
	 */
	app.use(notFoundHandler)

	/**
	 * Error Handler (must be last)
	 */
	app.use(errorHandler)
}

/**
 * Gracefull exit
 */
async function exitGracefully(signal) {

	if (server) await server.close()

	console.log(`Init (exitGracefully) -> ${signal} signal event`)
	process.exit(0)
}

// process signal events
process.on('SIGINT', exitGracefully)
process.on('SIGTERM', exitGracefully)

// start app
try       { init() }
catch (e) { console.error("Init -> main exception", e) }
