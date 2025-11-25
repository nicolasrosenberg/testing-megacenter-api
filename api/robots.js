/**
 * Robots
 */

const router = require('express').Router()

module.exports = DB => {

	router.get('/search', async (req, res) => {

		try {

			const { q } = req.query

			const robot = await DB.findOne("robots", { name: new RegExp(q) })

			res.json({ status: "ok", robot })
		}
		catch (e) {

			console.error('Robots (search) -> exception', e)

			res.json({ status: 'error', error: e.toString() })
		}
	})

	return router
}
