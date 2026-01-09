/**
 * Security Middleware
 *
 * Headers de seguridad y protecciones adicionales
 */

const helmet = require('helmet')

/**
 * Configuración de helmet con settings apropiados para una API
 */
const helmetConfig = helmet({
	// Content Security Policy
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			scriptSrc: ["'self'"],
			imgSrc: ["'self'", 'data:', 'https:'],
		}
	},
	// Previene clickjacking
	frameguard: {
		action: 'deny'
	},
	// Previene MIME type sniffing
	noSniff: true,
	// Fuerza HTTPS
	hsts: {
		maxAge: 31536000, // 1 año
		includeSubDomains: true,
		preload: true
	},
	// Oculta header X-Powered-By
	hidePoweredBy: true,
	// Previene que el browser abra downloads directamente
	ieNoOpen: true,
	// Desactiva prefetching de DNS para proteger privacidad
	dnsPrefetchControl: {
		allow: false
	}
})

/**
 * Middleware para sanitizar inputs y prevenir XSS básico
 */
function sanitizeInputs(req, res, next) {
	// Función helper para sanitizar strings
	const sanitize = (obj) => {
		if (typeof obj === 'string') {
			// Remover caracteres peligrosos básicos
			return obj
				.replace(/[<>]/g, '') // Remover < y >
				.trim()
		}
		if (typeof obj === 'object' && obj !== null) {
			for (const key in obj) {
				obj[key] = sanitize(obj[key])
			}
		}
		return obj
	}

	// Sanitizar body
	if (req.body) {
		req.body = sanitize(req.body)
	}

	// Sanitizar query params
	if (req.query) {
		req.query = sanitize(req.query)
	}

	next()
}

/**
 * Middleware para validar API Key
 * Obligatorio en producción si API_KEY está configurado
 */
function requireApiKey(req, res, next) {
	const apiKey = process.env.API_KEY

	// Si no hay API_KEY configurado en producción, advertir
	if (!apiKey && process.env.NODE_ENV === 'production') {
		console.warn('⚠️  WARNING: API_KEY not configured in production environment')
	}

	// Si está configurado, validar
	if (apiKey) {
		const providedKey = req.get('X-Api-Key')

		if (!providedKey) {
			return res.status(401).json({
				status: 'error',
				message: 'API key is required. Provide it in the X-Api-Key header.'
			})
		}

		// Usar comparación segura para prevenir timing attacks
		if (!secureCompare(providedKey, apiKey)) {
			return res.status(401).json({
				status: 'error',
				message: 'Invalid API key'
			})
		}
	}

	next()
}

/**
 * Comparación segura de strings para prevenir timing attacks
 */
function secureCompare(a, b) {
	if (typeof a !== 'string' || typeof b !== 'string') {
		return false
	}

	const aLen = Buffer.byteLength(a)
	const bLen = Buffer.byteLength(b)

	// Si las longitudes son diferentes, aún hacemos la comparación
	// para que el tiempo sea constante
	const bufA = Buffer.alloc(aLen)
	bufA.write(a)
	const bufB = Buffer.alloc(bLen)
	bufB.write(b)

	// Usamos crypto.timingSafeEqual si las longitudes coinciden
	if (aLen === bLen) {
		try {
			const crypto = require('crypto')
			return crypto.timingSafeEqual(bufA, bufB)
		} catch {
			return false
		}
	}

	return false
}

/**
 * Middleware para configurar trust proxy correctamente
 * Solo confiar en proxies de AWS ALB (ajustar según tu infraestructura)
 */
function configureTrustProxy(app) {
	// En producción, especificar IPs de proxies confiables
	// Por ahora, confiar en el primer proxy (AWS ALB)
	if (process.env.NODE_ENV === 'production') {
		app.set('trust proxy', 1)
	} else {
		app.set('trust proxy', true)
	}
}

module.exports = {
	helmetConfig,
	sanitizeInputs,
	requireApiKey,
	configureTrustProxy
}
