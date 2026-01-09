# Megacenter API v2.0 - Documentación

API profesional para integración con SiteLink, construida con mejores prácticas y arquitectura escalable.

## 🎯 Características Principales

✅ **Arquitectura Modular** - Separación clara de responsabilidades (routes, controllers, services)
✅ **Manejo Centralizado de Errores** - Errores con códigos HTTP apropiados y mensajes amigables
✅ **Sistema de Caché** - Caché en memoria con TTL de 15 minutos y limpieza nocturna
✅ **Multi-Ambiente** - Soporte para DEMO y PRODUCTION con cambio dinámico
✅ **Logging Estructurado** - Logs con contexto y timestamps
✅ **Transformación de Datos** - Conversión de SOAP XML a JSON amigable
✅ **Backward Compatible** - API antigua aún disponible en `/api/legacy/*`

---

## 📁 Estructura del Proyecto

```
api/
├── src/                          # Nueva arquitectura (v2.0)
│   ├── config/                   # Configuración centralizada
│   │   ├── index.js              # Exporta toda la config
│   │   ├── sitelink.js           # Config de SiteLink (multi-ambiente)
│   │   └── constants.js          # Constantes (tipos de tarjeta, etc.)
│   │
│   ├── middleware/               # Middleware personalizado
│   │   ├── errorHandler.js      # Manejo de errores
│   │   └── logger.js             # Logging estructurado
│   │
│   ├── services/                 # Lógica de negocio
│   │   ├── cache.service.js     # Sistema de caché
│   │   ├── transformer.service.js  # Transformación de datos
│   │   └── sitelink/             # Servicios de SiteLink
│   │       ├── client.js         # Cliente SOAP base
│   │       ├── units.service.js  # Métodos de unidades
│   │       └── discounts.service.js  # Métodos de descuentos
│   │
│   ├── controllers/              # Controladores (lógica de endpoints)
│   │   └── units.controller.js  # Controlador de unidades
│   │
│   ├── routes/                   # Definición de rutas
│   │   ├── index.js              # Router principal
│   │   └── units.routes.js       # Rutas de unidades
│   │
│   └── utils/                    # Utilidades
│       └── errors.js             # Clases de error personalizadas
│
├── api/                          # API antigua (legacy - v1.0)
│   ├── client.js
│   ├── units.js
│   └── ... (otros módulos)
│
├── docs/                         # Documentación
│   ├── API-INVENTORY-FLOW.md     # Flujo de inventario
│   ├── api-backend-spec.md       # Especificación backend
│   └── api.md                    # Documentación general
│
├── init.js                       # Entry point
├── package.json
└── .env                          # Variables de entorno
```

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

**Variables importantes:**

```env
# Modo (demo | production)
SITELINK_MODE=production

# Credenciales de producción
SITELINK_REAL_CORP_CODE=CDRH
SITELINK_REAL_LOCATION_CODE=L012
SITELINK_REAL_USERNAME=Andres Schilkrut:::MEGACENTER9J348FCJ3U
SITELINK_REAL_PASSWORD=TuPassword
```

### 3. Iniciar servidor

```bash
npm run server
```

El servidor estará disponible en `http://localhost:80`

---

## 📡 Endpoints Principales

### Nuevo Flujo (v2.0)

#### **GET** `/:location/units`

Obtiene unidades agrupadas por tamaño y tipo, con descuentos aplicados.

**Nota:** Reemplaza `:location` con `brickell`, `demo`, `memorial`, o `willowbrook`

**Implementa el flujo completo de `docs/API-INVENTORY-FLOW.md`:**
- ✅ Fetch paralelo de UnitTypePriceList + DiscountPlans
- ✅ Filtrado de descuentos por canal (Website)
- ✅ Agrupación por dimensión + tipo
- ✅ Asignación de tiers (Good, Better, Best, Premium)
- ✅ Cálculo de precio efectivo con descuentos
- ✅ Descuentos comunes vs individuales

**Ejemplo de URL:**
```
GET /brickell/units
GET /demo/units
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "5x5:Self Storage",
      "displayName": "5' x 5'",
      "displayType": "Self Storage",
      "displaySize": "25 sq ft",
      "description": "",
      "commonDiscount": {
        "concessionId": 8183,
        "name": "1 MONTH FREE",
        "type": "percentage_off",
        "value": 100,
        "displayText": "1ST MONTH FREE",
        "explanation": "You don't pay the first month...",
        "color": "red"
      },
      "options": [
        {
          "tier": "Good",
          "pricing": {
            "web": 17,
            "effectiveMonthly": 17
          },
          "availability": {
            "vacant": 9
          },
          "features": {
            "climate": true,
            "inside": true,
            "floor": 2
          },
          "discount": null
        }
      ],
      "minPrice": 17,
      "minPriceWithDiscount": 17,
      "totalAvailable": 28
    }
  ]
}
```

---

#### **GET** `/:location/units/:id`

Obtiene información detallada de una unidad específica con descuentos aplicables.

**Parámetros de URL:**
- `:location` - Ubicación (brickell, demo, memorial, willowbrook)
- `:id` - ID de la unidad

**Ejemplo de URL:**
```
GET /brickell/units/40680
GET /demo/units/40680
```

**Response:**

```json
{
  "success": true,
  "data": {
    "unitId": 40680,
    "unitName": "2C05",
    "unitTypeId": 1234,
    "typeName": "Locker Unit",
    "dimensions": {
      "width": 5,
      "length": 5,
      "area": 25
    },
    "features": {
      "climate": true,
      "inside": true,
      "power": false,
      "alarm": true,
      "floor": 2
    },
    "pricing": {
      "standard": 50,
      "web": 45,
      "effectiveMonthly": 40
    },
    "availability": {
      "rentable": true,
      "rented": false,
      "reserved": false
    },
    "discount": {
      "concessionId": 8183,
      "name": "1 MONTH FREE",
      "type": "percentage_off",
      "value": 100,
      "displayText": "1ST MONTH FREE",
      "color": "red"
    },
    "applicableDiscounts": [...]
  }
}
```

---

#### **GET** `/:location/discounts`

Obtiene todos los planes de descuento disponibles para una ubicación.

**Ejemplo de URL:**
```
GET /brickell/discounts
GET /demo/discounts
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "concessionId": 8183,
      "name": "1 MONTH FREE",
      "description": "Get your first month free",
      "type": "percentage_off",
      "value": 100,
      "displayText": "1ST MONTH FREE",
      "appliesToMonth": 1,
      "availableAt": "website",
      "color": "red"
    }
  ]
}
```

---

#### **POST** `/:location/reservations`

Crea una nueva reservación (tenant + waiting list entry).

**Ejemplo de URL:**
```
POST /brickell/reservations
POST /demo/reservations
```

**Request Body:**

```json
{
  "unitId": 40680,
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@example.com",
  "phone": "+1234567890",
  "moveInDate": "2026-02-15T00:00:00Z",
  "comment": "Planeo quedarme 3-6 meses",
  "address": "123 Main Street",
  "city": "Miami",
  "state": "FL",
  "zipCode": "33131",
  "concessionId": -999
}
```

**Campos Requeridos:**
- `unitId` (number) - ID de la unidad
- `firstName` (string) - Nombre del cliente
- `lastName` (string) - Apellido del cliente
- `email` (string) - Email válido
- `phone` (string) - Teléfono
- `moveInDate` (string) - Fecha ISO 8601

**Campos Opcionales:**
- `comment` (string) - Comentarios adicionales
- `address`, `city`, `state`, `zipCode` (string) - Dirección del cliente
- `concessionId` (number) - ID del descuento (-999 = sin descuento)

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "tenantId": 98765,
    "reservationId": 54321,
    "accessCode": "1234",
    "globalWaitingNum": "W-2026-001",
    "message": "Reservation created successfully. Your access code is 1234",
    "details": {
      "nextSteps": [
        "You will receive a confirmation email shortly",
        "You can complete your move-in online or visit us in person",
        "Your access code will be activated after move-in is completed"
      ]
    }
  }
}
```

**Validaciones:**
- Email debe tener formato válido
- Fecha debe ser válida (formato ISO 8601)
- Phone se normaliza automáticamente (elimina espacios, guiones)

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "email is required and must be a valid email address",
    "moveInDate is required and must be a valid ISO date string"
  ]
}
```

---

### Endpoints de Configuración

#### **GET** `/api/sitelink/config/mode`

Obtiene el modo actual (demo o production).

**Response:**

```json
{
  "status": "ok",
  "mode": "production"
}
```

#### **POST** `/api/sitelink/config/mode`

Cambia el modo (demo o production). **Limpia el caché automáticamente**.

**Body:**

```json
{
  "mode": "demo"
}
```

**Response:**

```json
{
  "status": "ok",
  "mode": "demo",
  "message": "Mode changed to demo. Cache cleared."
}
```

#### **GET** `/api/sitelink/config/cache/stats`

Obtiene estadísticas del caché.

**Response:**

```json
{
  "status": "ok",
  "stats": {
    "hits": 42,
    "misses": 8,
    "sets": 10,
    "deletes": 2,
    "keys": 8,
    "hitRate": 0.84
  }
}
```

#### **POST** `/api/sitelink/config/cache/flush`

Limpia todo el caché manualmente.

---

### Endpoints Legacy (v1.0)

Los endpoints antiguos siguen disponibles en `/api/legacy/*`:

- `GET /api/legacy/units/available`
- `GET /api/legacy/units/types`
- `GET /api/legacy/locations`
- etc.

---

## 🔧 Sistema de Caché

### Configuración

**TTL por endpoint:**

```javascript
UNIT_TYPES: 900 segundos (15 min)
DISCOUNTS: 900 segundos (15 min)
INSURANCE: 900 segundos (15 min)
AVAILABLE_UNITS: 300 segundos (5 min)
```

### Limpieza Automática

- **Cron diario a las 00:00** (Santiago timezone)
- Limpia todas las keys y resetea estadísticas

### Cache Keys

Formato: `sitelink:{method}:{corpCode}:{locationCode}:{params}`

**Ejemplos:**
```
sitelink:UnitTypePriceList_v2:CDRH:L012
sitelink:DiscountPlansRetrieve:CDRH:L012
```

---

## 🚨 Manejo de Errores

### Tipos de Error

1. **SiteLinkError** - Errores de la API SOAP
2. **ValidationError** - Errores de validación (400)
3. **NotFoundError** - Recurso no encontrado (404)
4. **ConfigError** - Error de configuración (500)

### Formato de Respuesta de Error

```json
{
  "status": "error",
  "message": "User-friendly error message",
  "retCode": -25,
  "retMsg": "Invalid Unit ID"
}
```

### Mapeo de Códigos SiteLink a HTTP

| SiteLink Code | HTTP Status | Mensaje |
|---------------|-------------|---------|
| -1 | 500 | General failure |
| -2 | 409 | Unit not available |
| -11 | 400 | Payment amount mismatch |
| -25 | 404 | Invalid Unit ID |
| -95 | 404 | Invalid Tenant ID |
| -100 | 402 | Credit card declined |

---

## 📊 Logging

### Formato de Logs

Todos los logs incluyen:
- Timestamp (ISO 8601)
- Context (módulo que genera el log)
- Datos relevantes

**Ejemplo:**

```
[INFO] Cache -> HIT: sitelink:UnitTypePriceList_v2:CDRH:L012 { timestamp: '2025-12-26T...' }
[ERROR] SiteLink -> { message: 'Invalid Unit ID', retCode: -25, ... }
```

### Niveles de Log

- `logInfo(context, message, data)` - Información general
- `logWarn(context, message, data)` - Advertencias
- `logError(context, error, data)` - Errores

---

## 🔐 Seguridad

### API Key (Opcional)

Configurar en `.env`:

```env
API_KEY=tu_api_key_secreta
```

Headers requeridos:

```
X-Api-Key: tu_api_key_secreta
```

### CORS

Configurar orígenes permitidos en `.env`:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Si no se configura, permite todos los orígenes (`*`).

---

## 🧪 Testing

### Probar endpoints principales

```bash
# Obtener unidades agrupadas
curl http://localhost/brickell/units

# Obtener unidad específica
curl http://localhost/brickell/units/40680

# Obtener descuentos
curl http://localhost/brickell/discounts

# Crear reservación
curl -X POST http://localhost/brickell/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "unitId": 40680,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "phone": "+1234567890",
    "moveInDate": "2026-02-15T00:00:00Z"
  }'
```

### Cambiar a modo demo

```bash
curl -X POST http://localhost/api/sitelink/config/mode \
  -H "Content-Type: application/json" \
  -d '{"mode":"demo"}'
```

### Ver estadísticas de caché

```bash
curl http://localhost/api/sitelink/config/cache/stats
```

---

## 🎨 Arquitectura de Descuentos

### Asignación de Colores

Cada descuento único recibe un color de una paleta de 17 colores:

```javascript
['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
 'fuchsia', 'pink', 'rose']
```

El color es **consistente** en toda la aplicación.

### Cálculo de Precio Efectivo

Según `docs/API-INVENTORY-FLOW.md`:

- **Descuentos temporales** (appliesToMonth > 0): Muestra precio regular
- **Descuentos permanentes** (appliesToMonth = 0): Muestra precio con descuento
- **Fixed Rate**: Siempre muestra el precio especial

---

## 📈 Mejoras Implementadas

### vs API Antigua (v1.0)

| Característica | v1.0 (Legacy) | v2.0 (Nueva) |
|----------------|---------------|--------------|
| Arquitectura | Monolítica | Modular (MVC) |
| Manejo de errores | Básico | Centralizado con mapeo |
| Caché | No implementado | Sí (15 min TTL) |
| Multi-ambiente | No | Sí (demo/production) |
| Transformación datos | En routes | Servicio dedicado |
| Logging | console.log básico | Estructurado con contexto |
| Agrupación unidades | Básica | Completa con tiers |
| Descuentos | No calculados | Sí, con colores y explicaciones |

---

## 🔄 Migración desde v1.0

### Cambios en URLs

```
Antes:  GET /api/sitelink/units/available
Ahora:  GET /api/sitelink/units/grouped

Antes:  -
Ahora:  POST /api/sitelink/config/mode (nuevo)
```

### Backward Compatibility

La API antigua sigue disponible en `/api/legacy/*`:

```
/api/legacy/units/available  → Funciona igual que antes
/api/legacy/units/types      → Funciona igual que antes
```

---

## 📚 Recursos Adicionales

- **Flujo de Inventario:** [docs/API-INVENTORY-FLOW.md](docs/API-INVENTORY-FLOW.md)
- **Especificación Backend:** [docs/api-backend-spec.md](docs/api-backend-spec.md)
- **Documentación SiteLink:** [docs/SiteLink_API.pdf](docs/SiteLink_API.pdf)

---

## 🐛 Troubleshooting

### Error: "SiteLink credentials not configured"

Verificar que `.env` tenga las variables correctas:

```env
SITELINK_REAL_CORP_CODE=CDRH
SITELINK_REAL_LOCATION_CODE=L012
SITELINK_REAL_USERNAME=...
SITELINK_REAL_PASSWORD=...
```

### Caché no se está limpiando

Verificar que `node-cron` esté instalado:

```bash
npm install node-cron
```

### Errores de transformación

Revisar logs para ver qué datos vienen de SiteLink. La transformación espera ciertos campos.

---

## 📞 Soporte

Para preguntas o problemas, revisar:
1. Logs del servidor
2. Estadísticas de caché (`/config/cache/stats`)
3. Documentación en `docs/`

---

**Desarrollado con ❤️ para Megacenter**
