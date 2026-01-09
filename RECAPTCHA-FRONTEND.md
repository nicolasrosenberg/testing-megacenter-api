# 🤖 reCAPTCHA v3 - Guía de Integración Frontend

Esta API está protegida con **reCAPTCHA v3** (invisible, sin fotos ni clicks).

---

## 🔑 Keys de reCAPTCHA

```javascript
// Site Key (PÚBLICA - va en tu frontend)
const RECAPTCHA_SITE_KEY = '6Ld0fEUsAAAAAH4szt79wNCel4FnsSbrlKkn1LeL'

// Secret Key está en el backend (.env) - NO la uses en el frontend
```

---

## 🚀 Integración en tu Frontend

### Opción 1: React / Next.js (Recomendado)

#### 1. Cargar el script de reCAPTCHA

**En Next.js** - `_app.js` o `_document.js`:
```javascript
import Script from 'next/script'

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* reCAPTCHA v3 Script */}
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=6Ld0fEUsAAAAAH4szt79wNCel4FnsSbrlKkn1LeL`}
        strategy="lazyOnload"
      />
      <Component {...pageProps} />
    </>
  )
}
```

**En React (CRA/Vite)** - `index.html`:
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Megacenter</title>
    <!-- reCAPTCHA v3 -->
    <script src="https://www.google.com/recaptcha/api.js?render=6Ld0fEUsAAAAAH4szt79wNCel4FnsSbrlKkn1LeL"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

#### 2. Hook personalizado (Opcional pero recomendado)

```javascript
// hooks/useRecaptcha.js
import { useCallback } from 'react'

const SITE_KEY = '6Ld0fEUsAAAAAH4szt79wNCel4FnsSbrlKkn1LeL'

export function useRecaptcha() {
  const executeRecaptcha = useCallback(async (action = 'submit') => {
    // Verificar que grecaptcha esté cargado
    if (!window.grecaptcha) {
      console.error('reCAPTCHA not loaded')
      return null
    }

    try {
      // Ejecutar reCAPTCHA (invisible)
      const token = await window.grecaptcha.execute(SITE_KEY, { action })
      return token
    } catch (error) {
      console.error('reCAPTCHA error:', error)
      return null
    }
  }, [])

  return { executeRecaptcha }
}
```

#### 3. Usar en tu componente de reservación

```javascript
// components/ReservationForm.jsx
import { useState } from 'react'
import { useRecaptcha } from '../hooks/useRecaptcha'

export function ReservationForm() {
  const [formData, setFormData] = useState({
    unitId: 123,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    moveInDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { executeRecaptcha } = useRecaptcha()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Obtener token de reCAPTCHA (invisible)
      const recaptchaToken = await executeRecaptcha('submit_reservation')

      if (!recaptchaToken) {
        throw new Error('Failed to get reCAPTCHA token')
      }

      // 2. Enviar reservación con el token
      const response = await fetch('http://localhost/demo/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken  // ← Token invisible
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create reservation')
      }

      // 3. Éxito
      alert('Reservación creada exitosamente!')
      console.log('Reservation:', data)

    } catch (err) {
      setError(err.message)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre"
        value={formData.firstName}
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Apellido"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="tel"
        placeholder="Teléfono"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
      />
      <input
        type="date"
        value={formData.moveInDate}
        onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value + 'T00:00:00Z' })}
        required
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Procesando...' : 'Reservar'}
      </button>

      {/* Badge de reCAPTCHA (obligatorio) */}
      <div className="recaptcha-badge-info">
        Este sitio está protegido por reCAPTCHA y aplican la{' '}
        <a href="https://policies.google.com/privacy">Política de Privacidad</a> y{' '}
        <a href="https://policies.google.com/terms">Términos de Servicio</a> de Google.
      </div>
    </form>
  )
}
```

---

### Opción 2: Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Reservación</title>
  <!-- reCAPTCHA v3 -->
  <script src="https://www.google.com/recaptcha/api.js?render=6Ld0fEUsAAAAAH4szt79wNCel4FnsSbrlKkn1LeL"></script>
</head>
<body>
  <form id="reservationForm">
    <input type="text" name="firstName" placeholder="Nombre" required>
    <input type="text" name="lastName" placeholder="Apellido" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="tel" name="phone" placeholder="Teléfono" required>
    <input type="date" name="moveInDate" required>
    <button type="submit">Reservar</button>
  </form>

  <script>
    const SITE_KEY = '6Ld0fEUsAAAAAH4szt79wNCel4FnsSbrlKkn1LeL'

    document.getElementById('reservationForm').addEventListener('submit', async (e) => {
      e.preventDefault()

      // 1. Obtener datos del form
      const formData = {
        unitId: 123,
        firstName: e.target.firstName.value,
        lastName: e.target.lastName.value,
        email: e.target.email.value,
        phone: e.target.phone.value,
        moveInDate: e.target.moveInDate.value + 'T00:00:00Z'
      }

      try {
        // 2. Ejecutar reCAPTCHA (invisible)
        const recaptchaToken = await grecaptcha.execute(SITE_KEY, {
          action: 'submit_reservation'
        })

        // 3. Enviar al backend
        const response = await fetch('http://localhost/demo/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            recaptchaToken
          })
        })

        const data = await response.json()

        if (response.ok) {
          alert('Reservación exitosa!')
          console.log(data)
        } else {
          alert('Error: ' + data.error)
        }
      } catch (error) {
        console.error('Error:', error)
        alert('Error al crear reservación')
      }
    })
  </script>
</body>
</html>
```

---

## 🎨 Badge de reCAPTCHA

Google **requiere** que muestres el badge o texto. Opciones:

### Opción A: Badge visible (Default)
Aparece automáticamente en la esquina inferior derecha. No necesitas hacer nada.

### Opción B: Badge oculto + Texto
Si quieres ocultar el badge, debes agregar este texto:

```html
<style>
  .grecaptcha-badge { visibility: hidden; }
</style>

<p>
  Este sitio está protegido por reCAPTCHA y aplican la
  <a href="https://policies.google.com/privacy">Política de Privacidad</a> y
  <a href="https://policies.google.com/terms">Términos de Servicio</a> de Google.
</p>
```

---

## ⚠️ Manejo de Errores

```javascript
const response = await fetch('/demo/reservations', {
  method: 'POST',
  body: JSON.stringify({ ...formData, recaptchaToken })
})

if (!response.ok) {
  const error = await response.json()

  // Error de reCAPTCHA
  if (response.status === 403) {
    alert('Verificación de seguridad fallida. Por favor intenta de nuevo.')
  }
  // Rate limit
  else if (response.status === 429) {
    alert('Demasiados intentos. Por favor espera una hora.')
  }
  // Otros errores
  else {
    alert('Error: ' + error.error)
  }
}
```

---

## 🧪 Testing

### En Desarrollo
reCAPTCHA funciona en localhost sin configuración adicional.

### En Producción
Agrega tu dominio en https://www.google.com/recaptcha/admin

---

## 📊 Ver Estadísticas

Ve a https://www.google.com/recaptcha/admin para ver:
- Requests totales
- Score promedio
- Intentos de bots bloqueados
- Gráficas de tráfico

---

## ✅ Checklist de Integración

- [ ] Script de reCAPTCHA cargado en el HTML
- [ ] Site Key correcta (`6Ld0fEUsAAAAAH4szt79wNCel4FnsSbrlKkn1LeL`)
- [ ] Ejecutar `grecaptcha.execute()` antes de submit
- [ ] Enviar `recaptchaToken` en el body del POST
- [ ] Badge visible O texto de políticas de Google
- [ ] Manejo de errores 403 (reCAPTCHA failed)
- [ ] Manejo de errores 429 (rate limit)

---

**¿Problemas?** Revisa la consola del navegador para ver errores de reCAPTCHA.
