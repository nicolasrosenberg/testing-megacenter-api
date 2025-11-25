/**
 * Init
 */

const express = require('express')
const { URL } = require('url')

// ++ Express
const app = express()
// trust proxy (AWS ALB)
app.set("trust proxy", 1)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

let server

/**
 * Init
 */
async function init() {

	const DB = await require('./api/db')(process.env.MONGO_HOST)

	// start server
	server = await app.listen(80)

	console.log("Init -> server listening", new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" }))

	/**
	 * Express Interceptor
	 */
	app.use((req, res, next) => {

		if (req.path.match(/health/)) return next()

		// CORS allowed origin
		if (process.env.ALLOWED_ORIGINS) {

			try {

				const { protocol, host } = new URL(req.get('Origin') || req.get('Referer'))
				const whitelist = process.env.ALLOWED_ORIGINS.split(',').map(o => new URL(o).host)

				// check Origin header if present
				if (whitelist.includes(host)) res.set('Access-Control-Allow-Origin', `${protocol}//${host}`), res.set('Vary', 'Origin')
			}
			catch (e) { return res.sendStatus(403) }
		}
		else res.set('Access-Control-Allow-Origin', '*')

		// CORS allowed headers
		res.set('Access-Control-Allow-Headers', 'Content-Type, Origin, X-Requested-With, X-Api-Key')

		// for preflight requests
		if (req.method.match(/OPTIONS/)) return res.sendStatus(200)

		// validate API_KEY
		if (process.env.API_KEY && process.env.API_KEY != req.get("X-Api-Key")) return res.status(401).json({ status: "error", msg: "unauthorized" })

		next()
	})

	/**
	 * GET - Health check
	 */
	app.get('*/health', (req, res) => res.sendStatus(200))

	/**
	 * APP example
	 */
	app.use('*/robots', require('./api/robots')(DB))

	/**
	 * Not Found
	 */
	app.use((req, res, next) => res.status(404).send({ status: "error", msg: "service not found" }))

	/**
	 * Server error
	 */
	app.use((e, req, res, next) => { console.error("Init -> Server Error", e), res.status(500).send({ status: "error", msg: e.toString() }) })
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
