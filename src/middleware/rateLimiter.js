/**
 * Rate Limiting Middleware
 *
 * Protección contra ataques de fuerza bruta y spam
 */

const { rateLimit } = require('express-rate-limit')

/**
 * Rate limiter general para toda la API
 * 100 requests por 15 minutos por IP
 */
const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 100, // 100 requests por ventana
	message: {
		status: 'error',
		message: 'Too many requests from this IP, please try again later.'
	},
	standardHeaders: true, // Return rate limit info in RateLimit-* headers
	legacyHeaders: false, // Disable X-RateLimit-* headers
	// Skip health checks
	skip: (req) => req.path.includes('/health')
})

/**
 * Rate limiter estricto para endpoints de creación (reservaciones)
 * 5 requests por hora por IP
 *
 * NOTA: No usamos keyGenerator customizado con IP para evitar problemas con IPv6
 * Solo limitamos por IP usando el default, que maneja IPv6 correctamente
 */
const strictLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hora
	max: 5, // 5 requests por ventana
	message: {
		status: 'error',
		message: 'Too many reservations from this IP. Please try again in an hour.'
	},
	standardHeaders: true,
	legacyHeaders: false
	// No usamos keyGenerator customizado - el default maneja IPv6 correctamente
})

/**
 * Rate limiter para endpoints de lectura
 * 200 requests por 15 minutos por IP
 */
const readLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 200, // 200 requests por ventana
	message: {
		status: 'error',
		message: 'Too many requests, please try again later.'
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => req.path.includes('/health')
})

module.exports = {
	generalLimiter,
	strictLimiter,
	readLimiter
}
