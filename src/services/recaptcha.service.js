/**
 * reCAPTCHA v3 Service
 *
 * Valida tokens de reCAPTCHA v3 con Google
 * Protección invisible contra bots
 */

const { logInfo, logWarn, logError } = require('../middleware/logger')
const { ValidationError } = require('../utils/errors')

/**
 * Verifica un token de reCAPTCHA v3 con Google
 *
 * @param {string} token - Token generado en el frontend
 * @param {string} action - Acción esperada (ej: 'submit_reservation')
 * @returns {Promise<object>} Resultado de la verificación
 */
async function verifyRecaptcha(token, action = 'submit') {
	const secretKey = process.env.RECAPTCHA_SECRET_KEY
	const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE) || 0.5

	// Validar que la secret key esté configurada
	if (!secretKey) {
		logWarn('reCAPTCHA', 'RECAPTCHA_SECRET_KEY not configured, skipping validation')
		// En desarrollo, permitir sin reCAPTCHA
		if (process.env.NODE_ENV === 'development') {
			return { success: true, score: 1.0, skipped: true }
		}
		throw new ValidationError('reCAPTCHA not configured on server')
	}

	// Validar que el token exista
	if (!token) {
		logWarn('reCAPTCHA', 'No token provided')
		throw new ValidationError('reCAPTCHA token is required')
	}

	try {
		console.log('🌐 [reCAPTCHA] Llamando a Google API...')

		// Llamar a la API de Google
		const response = await fetch(
			'https://www.google.com/recaptcha/api/siteverify',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: `secret=${secretKey}&response=${token}`
			}
		)

		const data = await response.json()
		console.log('✅ [reCAPTCHA] Respuesta de Google:', JSON.stringify(data, null, 2))

		logInfo('reCAPTCHA', 'Verification response', {
			success: data.success,
			score: data.score,
			action: data.action,
			hostname: data.hostname
		})

		// Validar respuesta de Google
		if (!data.success) {
			logWarn('reCAPTCHA', 'Verification failed', {
				'error-codes': data['error-codes']
			})
			throw new ValidationError('reCAPTCHA verification failed')
		}

		// Validar acción (opcional pero recomendado)
		if (action && data.action !== action) {
			logWarn('reCAPTCHA', 'Action mismatch', {
				expected: action,
				received: data.action
			})
		}

		// Validar score (v3 usa scores de 0.0 a 1.0)
		if (data.score < minScore) {
			logWarn('reCAPTCHA', 'Score too low', {
				score: data.score,
				minScore: minScore
			})
			throw new ValidationError(
				`reCAPTCHA score too low (${data.score}). Suspected bot activity.`
			)
		}

		return {
			success: true,
			score: data.score,
			action: data.action,
			hostname: data.hostname
		}

	} catch (error) {
		// Si es un ValidationError, re-lanzarlo
		if (error instanceof ValidationError) {
			throw error
		}

		// Error de red o de Google
		logError('reCAPTCHA', error, { token: token.substring(0, 20) + '...' })
		throw new ValidationError('Failed to verify reCAPTCHA. Please try again.')
	}
}

/**
 * Middleware para validar reCAPTCHA en endpoints
 *
 * @param {string} action - Acción esperada (opcional)
 * @returns {Function} Express middleware
 */
function requireRecaptcha(action = 'submit') {
	return async (req, res, next) => {
		console.log('🔍 [reCAPTCHA Middleware] Ejecutándose...')
		console.log('📦 Body completo:', JSON.stringify(req.body, null, 2))

		const token = req.body.recaptchaToken
		console.log('🎫 Token recibido:', token ? token.substring(0, 30) + '...' : 'NO TOKEN')

		try {
			const result = await verifyRecaptcha(token, action)

			// Agregar resultado al request para logging
			req.recaptchaResult = result

			next()
		} catch (error) {
			console.log('❌ [reCAPTCHA] Error:', error.message)

			// Si es ValidationError, devolver 403
			if (error instanceof ValidationError) {
				return res.status(403).json({
					success: false,
					error: error.message
				})
			}

			// Otros errores, pasar al error handler
			next(error)
		}
	}
}

module.exports = {
	verifyRecaptcha,
	requireRecaptcha
}
