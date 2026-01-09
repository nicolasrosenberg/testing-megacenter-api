# 🔒 Guía de Seguridad - Megacenter API

**Estado:** ✅ Configuración de seguridad completada
**Arquitectura:** Frontend → API directa (sin backend intermedio)
**Última actualización:** 2026-01-09
**Versión API:** 2.0.0

---

## 🎯 Arquitectura de Seguridad

Esta API está diseñada para ser consumida **directamente desde el frontend** (React/Next/Vue), por lo tanto:

- ❌ **NO usa API Key** (sería visible en el navegador)
- ✅ **Usa CORS** para controlar qué dominios pueden acceder
- ✅ **Usa Rate Limiting** para prevenir abuso
- ✅ **Usa validación estricta** de inputs
- ✅ **Usa headers de seguridad** (Helmet)

---

## ✅ Protecciones Implementadas y ACTIVAS

### 1. **CORS (Cross-Origin Resource Sharing)** 🌐
**La defensa principal de esta API**

- ✅ Whitelist de orígenes configurada
- ✅ Solo dominios autorizados pueden hacer requests
- ✅ Configuración actual (desarrollo):
  - `http://localhost:3000`
  - `http://localhost:3001`
  - `http://localhost:5173` (Vite)
  - `http://127.0.0.1:3000`

**Cómo funciona:**
- El navegador verifica el header `Origin` en cada request
- Si el origen NO está en `ALLOWED_ORIGINS`, el browser bloquea la respuesta
- Esto previene que sitios maliciosos consuman tu API

### 2. **Rate Limiting** ⚡
**Previene spam y abuso**

- ✅ General: **100 requests / 15 min** por IP
- ✅ Reservaciones: **5 requests / hora** por IP (crítico)
- ✅ Lectura: **200 requests / 15 min** por IP
- ✅ Compatible con IPv6 (sin bypass)

**Protege contra:**
- Ataques de fuerza bruta
- Spam de reservaciones
- DDoS básicos
- Bots automatizados

### 3. **Headers de Seguridad (Helmet)** 🛡️
- ✅ Content Security Policy (CSP)
- ✅ Prevención de clickjacking (X-Frame-Options: DENY)
- ✅ HSTS para forzar HTTPS
- ✅ Prevención de MIME type sniffing
- ✅ Header X-Powered-By oculto

### 4. **Validación de Inputs Mejorada** ✔️
- ✅ Validación estricta de emails (regex + límites)
- ✅ Validación de formato de teléfonos (longitud + formato)
- ✅ Límites de longitud en todos los campos
- ✅ Sanitización automática de XSS básico
- ✅ Validación de tipos de datos

### 5. **Límites de Payload** 📦
- ✅ Límite de 10MB en requests JSON y URL-encoded
- ✅ Previene memory exhaustion attacks

### 6. **Trust Proxy Seguro** 🔐
- ✅ Configuración correcta para AWS ALB
- ✅ IP tracking correcto para rate limiting

---

## 🎯 Estado de Configuración Actual

### ✅ COMPLETADO (Ambiente Desarrollo)

| Item | Estado | Detalles |
|------|--------|----------|
| CORS | ✅ Configurado | Desarrollo local permitido |
| Rate Limiting | ✅ Activo | General: 100/15min, Reservaciones: 5/hora |
| Helmet | ✅ Activo | Todos los headers de seguridad |
| Validación | ✅ Mejorada | Email, phone, inputs sanitizados |
| .env en git | ✅ Protegido | En .gitignore, nunca comiteado |
| IPv6 Protection | ✅ Activo | Rate limiter compatible |

---

## 🚨 CRÍTICO para PRODUCCIÓN

### ⚠️ Acción Obligatoria Antes de Lanzar

#### 1. **Configurar CORS para Producción**
```bash
# En .env, configurar ALLOWED_ORIGINS con tu dominio REAL:
ALLOWED_ORIGINS=https://megacenter.com,https://www.megacenter.com

# ⚠️ SI NO CONFIGURAS ESTO:
# - Cualquier sitio web podrá consumir tu API
# - Posibles ataques desde otros dominios
```

#### 2. **Forzar HTTPS**
- Configurar en tu load balancer (AWS ALB, CloudFront, nginx)
- NO permitir tráfico HTTP en producción
- Verificar que HSTS esté activo

#### 3. **Cambiar Credenciales de SiteLink**
```bash
# Actualmente estás usando credenciales DEMO
# En producción, usar las credenciales reales:
SITELINK_CORP_CODE=CDRH
SITELINK_USERNAME=tu_usuario_real
SITELINK_PASSWORD=tu_password_real
```

---

## 🔶 Vulnerabilidades Conocidas (Requieren Implementación)

### ⚠️ Alta Prioridad

#### 1. **No hay validación de pago**
**Problema:** Se pueden crear reservaciones sin pagar

**Solución:** Integrar procesador de pagos
```javascript
// Flujo recomendado:
// 1. Frontend: Crear payment intent con Stripe
const { clientSecret } = await fetch('/api/create-payment-intent', {
  method: 'POST',
  body: JSON.stringify({ unitId: 123, amount: 100 })
}).then(r => r.json())

// 2. Frontend: Procesar pago con Stripe
const { paymentIntent } = await stripe.confirmCardPayment(clientSecret)

// 3. Frontend: Crear reservación solo si pago exitoso
if (paymentIntent.status === 'succeeded') {
  await fetch('/demo/reservations', {
    method: 'POST',
    body: JSON.stringify({
      unitId: 123,
      paymentIntentId: paymentIntent.id,
      // ... otros datos
    })
  })
}

// 4. Backend: Verificar paymentIntentId con Stripe antes de crear reservación
```

#### 2. **No hay CAPTCHA**
**Problema:** Bots pueden crear reservaciones (limitadas a 5/hora, pero posible)

**Solución:** Implementar Google reCAPTCHA
```bash
npm install react-google-recaptcha
```

```javascript
// Frontend
import ReCAPTCHA from "react-google-recaptcha";

<ReCAPTCHA
  sitekey="your_site_key"
  onChange={(token) => setRecaptchaToken(token)}
/>

// Backend: Validar token antes de crear reservación
const response = await fetch(
  `https://www.google.com/recaptcha/api/siteverify`,
  {
    method: 'POST',
    body: `secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`
  }
)
```

#### 3. **Enumeración de Concession IDs**
**Problema:** Se pueden probar diferentes IDs de descuentos

**Solución:** Validar contra lista de descuentos activos
```javascript
// En reservations.controller.js
const validDiscounts = await discountsService.getDiscountPlans(locationCode)
const isValidDiscount = validDiscounts.some(d => d.concessionId === concessionId)

if (!isValidDiscount && concessionId !== -999) {
  throw new ValidationError('Invalid discount ID')
}
```

---

## 📋 Checklist Pre-Producción

Antes de lanzar a producción:

- [x] `.env` está en `.gitignore` y NO está en el repositorio
- [x] Rate limiters están activos y funcionando
- [x] Validación de inputs mejorada
- [x] Headers de seguridad (Helmet) activos
- [x] Protección IPv6 activa
- [ ] **`ALLOWED_ORIGINS` configurado con dominios REALES de producción**
- [ ] **`NODE_ENV=production` en el servidor**
- [ ] **HTTPS configurado y forzado**
- [ ] **Credenciales de SiteLink en `.env` son de producción** (actualmente DEMO)
- [ ] Sistema de pagos integrado (Stripe/PayPal)
- [ ] CAPTCHA implementado en reservaciones
- [ ] Validación de concessionIds
- [ ] Logs de seguridad configurados (CloudWatch, DataDog)
- [ ] Monitoreo de errores activo (Sentry)
- [ ] Plan de respuesta a incidentes documentado

---

## 🔍 Testing de Seguridad

### ✅ Probar CORS (CRÍTICO)

```bash
# ✅ Desde localhost (debe funcionar)
curl -H "Origin: http://localhost:3000" \
  http://localhost/demo/units

# ❌ Desde origen no autorizado (debe fallar)
curl -H "Origin: https://sitio-malicioso.com" \
  http://localhost/demo/units
# Response: Error de CORS
```

### ✅ Probar Rate Limiting

```bash
# Test reservaciones (debe fallar después de 5)
for i in {1..6}; do
  curl -X POST http://localhost/demo/reservations \
    -H "Content-Type: application/json" \
    -d '{
      "unitId":123,
      "firstName":"Test",
      "lastName":"User",
      "email":"test@test.com",
      "phone":"+1234567890",
      "moveInDate":"2026-02-15T00:00:00Z"
    }'
done
# Request 6: {"status":"error","message":"Too many reservations..."}

# Test general (debe fallar después de 100)
for i in {1..110}; do
  curl http://localhost/demo/units
done
# Request 101: {"status":"error","message":"Too many requests..."}
```

### ✅ Probar Validación de Inputs

```bash
# Email inválido (debe fallar)
curl -X POST http://localhost/demo/reservations \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email",...}'
# Response: {"error":"email is required and must be a valid email address"}

# Teléfono inválido (debe fallar)
curl -X POST http://localhost/demo/reservations \
  -H "Content-Type: application/json" \
  -d '{"phone":"abc",...}'
# Response: {"error":"Phone number must be between 5 and 20 digits"}
```

---

## 🚀 Cómo Usar la API Desde el Frontend

### Con Fetch (Vanilla JS)
```javascript
// GET request - Obtener unidades
fetch('http://localhost/demo/units')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('Error:', err))

// POST request - Crear reservación
fetch('http://localhost/demo/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    unitId: 123,
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan@example.com",
    phone: "+1234567890",
    moveInDate: "2026-02-15T00:00:00Z"
  })
})
.then(res => res.json())
.then(data => console.log('Reservación creada:', data))
```

### Con Axios
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost'
})

// GET
const units = await api.get('/demo/units')

// POST
const reservation = await api.post('/demo/reservations', {
  unitId: 123,
  firstName: "Juan",
  lastName: "Pérez",
  email: "juan@example.com",
  phone: "+1234567890",
  moveInDate: "2026-02-15T00:00:00Z"
})
```

### Con React Query
```javascript
import { useQuery, useMutation } from '@tanstack/react-query'

// GET units
const { data: units } = useQuery({
  queryKey: ['units', 'demo'],
  queryFn: () => fetch('http://localhost/demo/units').then(r => r.json())
})

// POST reservation
const createReservation = useMutation({
  mutationFn: (data) =>
    fetch('http://localhost/demo/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json())
})
```

---

## 🛡️ Resumen de Protecciones

### ✅ Lo que YA NO se puede hacer:
- ❌ Hacer requests desde dominios no autorizados (CORS)
- ❌ Hacer más de 5 reservaciones por hora desde la misma IP
- ❌ Hacer más de 100 requests generales en 15 minutos
- ❌ Enviar emails o teléfonos con formato inválido
- ❌ XSS básico (inputs sanitizados)
- ❌ Bypass usando IPv6
- ❌ Payloads mayores a 10MB

### ⚠️ Lo que aún es posible (requiere implementación):
- ⚠️ Crear reservaciones sin pagar (necesita integración de pagos)
- ⚠️ Bots automatizados (limitados a 5/hora, pero CAPTCHA recomendado)
- ⚠️ Probar diferentes concessionIds (necesita validación)

---

## 📞 Respuesta a Incidentes

### Si detectas actividad sospechosa:

1. **Revisar logs** para identificar patrón de ataque
2. **Identificar IPs maliciosas** en los logs
3. **Bloquear IPs** en tu firewall/load balancer (AWS WAF, CloudFlare)
4. **Revisar reservaciones** recientes para detectar fraude
5. **Ajustar rate limits** si es necesario (bajar de 5 a 3/hora)
6. **Notificar al equipo** y documentar

### Logs a monitorear:
- Rate limit alcanzado (muchas veces desde la misma IP)
- Validación fallida (intentos de inyección)
- Errores CORS (intentos desde dominios no autorizados)
- Múltiples reservaciones con emails similares

---

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Rate Limiting Best Practices](https://express-rate-limit.github.io/)

---

**Última actualización:** 2026-01-09
**Versión API:** 2.0.0
**Estado:** ✅ Seguridad básica implementada (CORS + Rate Limiting)
**Arquitectura:** Frontend directo (sin BFF)
