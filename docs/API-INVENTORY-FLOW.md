# API Inventory Flow - Documentation

## Overview

Este documento explica cómo funciona el flujo completo para mostrar las unidades de almacenamiento, sus opciones, precios y descuentos desde SiteLink hasta el frontend.

---

## Architecture

```
Frontend (HTML/JS)
      ↓
API Wrapper (Node/Express)
      ↓
SiteLink SOAP API
```

---

## 1. Flujo Completo

### 1.1 Request Inicial

**Endpoint:** `GET /api/units/grouped`

**Controller:** `controllers/units.controller.js::getUnitsGrouped()`

#### Paso 1: Fetch de datos en paralelo

```javascript
const [unitTypesResponse, discountsResponse] = await Promise.all([
  sitelinkService.getUnitTypePriceList(1), // 1 = WebRate channel
  sitelinkService.getDiscountPlans()
]);
```

**Dos llamadas SOAP simultáneas:**
- `UnitTypePriceList_v2` → Obtiene todos los tipos de unidades con precios
- `DiscountPlansRetrieve` → Obtiene todos los planes de descuento

---

## 2. Procesamiento de Descuentos

### 2.1 Indexación de Descuentos

**Función:** `buildDiscountsMap(discountPlans)`

#### Filtros aplicados:

1. **Disponible para Web:**
   - `iAvailableAt = 0` (Everywhere)
   - `iAvailableAt = 2` (Website Only)
   - `iAvailableAt >= 16` con bit 32 activo (Bitmask)

2. **No deshabilitado:**
   - `dDisabled` debe ser false/null

3. **Aplica en Move-In:**
   - `iShowOn !== 2` (excluye los que solo aplican en payments)

#### Asignación de colores:

Cada descuento recibe un color de una paleta de 17 colores:
```javascript
const DISCOUNT_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
  'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
  'fuchsia', 'pink', 'rose'
];
```

#### Resultado:

```javascript
Map<ConcessionID, {
  concessionId: number,
  name: string,
  type: 'percentage_off' | 'amount_off' | 'fixed_rate',
  value: number,
  displayText: string,        // "1ST MONTH FREE", "$50 OFF", etc.
  explanation: string,         // Detailed explanation in English
  color: string,               // Assigned color from pool
  appliesToMonth: number,      // En qué mes aplica (1 = primer mes)
  // ... otros campos
}>
```

---

## 3. Procesamiento de Unit Types

### 3.1 Filtrado Inicial

Solo tipos con disponibilidad:
```javascript
const availableTypes = unitTypes.filter(t =>
  parseInt(t.iTotalVacant || 0) > 0
);
```

### 3.2 Agrupación por Dimensión + Tipo

**Key:** `{width}x{length}:{typeName}`

Ejemplos:
- `5x5:Self Storage`
- `5x5:Locker Unit`
- `10x10:Self Storage`

Esto asegura que cada **combinación de tamaño Y tipo** tenga su propio grupo.

### 3.3 Construcción de Opciones

Para cada unit type:

```javascript
const option = {
  unitTypeId: number,
  tier: string,                    // Asignado después (Good, Better, Best, Premium)
  description: string,              // "Locker Unit Reduced Height", etc.
  features: {
    climate: boolean,
    inside: boolean,
    power: boolean,
    alarm: boolean,
    floor: number,
    mobile: boolean,
    typeName: string
  },
  pricing: {
    standard: number,               // dcStdRate (precio "On Site")
    web: number,                    // dcWebRate (precio web)
    preferred: number,              // dcPreferredRate
    effectiveMonthly: number        // Precio FINAL con descuento aplicado
  },
  availability: {
    total: number,
    occupied: number,
    vacant: number,
    reserved: number,
    firstAvailableUnitId: number,
    firstAvailableUnitName: string,
    isAvailable: boolean
  },
  discount: {
    // Objeto completo del descuento SI tiene ConcessionID
    // null si no tiene descuento
  },
  fees: {
    admin: number,
    reservation: number
  },
  tax: {
    rate1: number,
    rate2: number,
    charge1: boolean,
    charge2: boolean,
    decimals: number
  }
}
```

---

## 4. Asignación de Tiers (Good, Better, Best, Premium)

### 4.1 Ordenamiento

Primero se ordenan las opciones por `effectiveMonthly` (precio con descuento):

```javascript
options.sort((a, b) => a.pricing.effectiveMonthly - b.pricing.effectiveMonthly);
```

### 4.2 Asignación de Tiers

**Función:** `assignTier(index, total)`

| Total Opciones | Asignación |
|----------------|------------|
| 1 | `Good` |
| 2 | `Good`, `Better` |
| 3 | `Good`, `Better`, `Best` |
| 4+ | Dividir en cuartos → `Good`, `Better`, `Best`, `Premium` |

**Ejemplo con 4 opciones:**
- Índice 0 → Good (más barata)
- Índice 1 → Better
- Índice 2 → Best
- Índice 3 → Premium (más cara)

---

## 5. Construcción del Grupo Final

### 5.1 Descripción Común

Si todas las opciones tienen la misma descripción, se extrae al grupo:

```javascript
const descriptions = [...new Set(options.map(o => o.description).filter(d => d))];
const commonDescription = descriptions.length === 1 ? descriptions[0] : '';
```

### 5.2 Descuento Común

Si todas las opciones tienen el MISMO descuento:

```javascript
const uniqueDiscountIds = [...new Set(discounts.map(d => d.concessionId))];
if (uniqueDiscountIds.length === 1) {
  commonDiscount = discounts[0];
}
```

**Si hay descuento común:**
- Se muestra en el header del acordeón
- NO se muestra en cada tarjeta individual

**Si hay descuentos diferentes:**
- Cada tarjeta muestra su propio badge de descuento

### 5.3 Resultado Final

```javascript
{
  id: string,                      // "5x5:Self Storage"
  key: string,                     // "5x5:Self Storage"
  width: number,                   // 5
  length: number,                  // 5
  area: number,                    // 25
  typeName: string,                // "Self Storage"
  displayName: string,             // "5' x 5'"
  displayType: string,             // "Self Storage"
  displaySize: string,             // "25 sq ft"
  description: string,             // Descripción común (si aplica)
  commonDiscount: object | null,   // Descuento común (si aplica)
  options: [...],                  // Array de opciones ordenadas con tiers
  minPrice: number,                // Precio web mínimo
  minPriceWithDiscount: number,    // Precio efectivo mínimo
  totalAvailable: number           // Total unidades disponibles
}
```

---

## 6. Ordenamiento Final

Los grupos se ordenan por:

1. **Área** (menor a mayor)
2. **Tipo** (alfabético si tienen la misma área)

```javascript
result.sort((a, b) => {
  if (a.area !== b.area) return a.area - b.area;
  return a.typeName.localeCompare(b.typeName);
});
```

**Ejemplo de orden:**
```
5' x 3' - Self Storage        (15 sq ft)
5' x 5' - Locker Unit          (25 sq ft)
5' x 5' - Self Storage         (25 sq ft)
5' x 10' - Self Storage        (50 sq ft)
10' x 10' - Self Storage       (100 sq ft)
```

---

## 7. Frontend Rendering

### 7.1 Estructura Visual

```
┌─────────────────────────────────────────────────┐
│ 5' x 5' - Self Storage [1ST MONTH FREE]        │ ← Header con descuento común
│ 25 sq ft                                        │
│ From $17/mo  Available: 28  Options: 4         │
├─────────────────────────────────────────────────┤
│ [GOOD]                                          │ ← Opción más barata
│ Interior Climate Controlled Floor 2             │
│ ☁ Climate  🏠 Interior  🔢 Floor 2              │
│ Price: $17/mo                                   │
│ Available: 9                                    │
├─────────────────────────────────────────────────┤
│ [BETTER]                                        │
│ Interior Climate Controlled Floor 2 Alarmed     │
│ ☁ Climate  🏠 Interior  🔢 Floor 2  🔔 Alarm    │
│ Price: $20/mo                                   │
│ Available: 12                                   │
├─────────────────────────────────────────────────┤
│ [BEST]                                          │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

### 7.2 Colores de Tiers

- 🟢 **GOOD** - Verde (`#10b981`)
- 🔵 **BETTER** - Azul (`#0284c7`)
- 🟣 **BEST** - Morado (`#7c3aed`)
- 🟠 **PREMIUM** - Dorado (`#d97706`)

### 7.3 Colores de Descuentos

Cada descuento único tiene un color asignado de la paleta de 17 colores.

**Ejemplo:**
- `ConcessionID 8183` → Rojo
- `ConcessionID 8184` → Naranja
- `ConcessionID 8185` → Amber

El color es **consistente** en toda la aplicación.

---

## 8. Cálculo de Precio Efectivo

### 8.1 Función `calculateEffectivePrice(basePrice, discount)`

**Propósito:** Calcular el precio mensual regular que el cliente pagará la mayoría de los meses.

**Regla fundamental:**
- Si el descuento es temporal (aplica a meses específicos), mostrar el precio regular
- Si el descuento es permanente, mostrar el precio con descuento

### 8.2 Tipos de Descuento

**Amount Off (descuento de monto fijo):**
```javascript
// iAmtType = 0 en SiteLink
if (month > 0) {
  return basePrice; // Descuento temporal, mostrar precio regular
}
return basePrice - value; // Descuento permanente
```

**Percentage Off (descuento porcentual):**
```javascript
// iAmtType = 1 en SiteLink
if (month > 0) {
  return basePrice; // Descuento temporal, mostrar precio regular
}
return basePrice * (1 - value / 100); // Descuento permanente
```

**Fixed Rate (precio fijo especial):**
```javascript
// iAmtType = 2 en SiteLink
return value; // Siempre mostrar el precio especial
```

### 8.3 Ejemplos Reales

**Ejemplo 1: "1ST MONTH FREE"**
- Badge: `1ST MONTH FREE` (rojo)
- Precio mostrado: `$78/mo`
- Realidad del cliente:
  - Mes 1: $0 (gratis)
  - Mes 2+: $78/mo
- Por qué: El descuento aplica solo al mes 1, entonces mostramos el precio regular

**Ejemplo 2: "50% OFF 2nd & 3rd Month"**
- Badge: `50% OFF` (naranja)
- Precio mostrado: `$51/mo`
- Realidad del cliente:
  - Mes 1: $51 (precio completo)
  - Mes 2: $25.50 (50% descuento)
  - Mes 3: $25.50 (50% descuento)
  - Mes 4+: $51 (precio completo)
- Por qué: El descuento aplica solo a meses 2-3, entonces mostramos el precio regular

**Ejemplo 3: "Permanent 20% OFF"** (hipotético)
- Badge: `20% OFF` (verde)
- Precio mostrado: `$40/mo` (si precio base es $50)
- Realidad del cliente:
  - Todos los meses: $40/mo
- Por qué: El descuento es permanente, entonces mostramos el precio con descuento

### 8.4 Lógica de Descuentos Temporales vs Permanentes

**Descuento Temporal** (`appliesToMonth > 0`):
- El `effectiveMonthly` **NO cambia** (muestra precio regular)
- El descuento se aplica solo en los meses especificados
- El badge y texto amarillo explican la promoción
- En el checkout, `MoveInCostRetrieveWithDiscount_v2` calcula el desglose exacto

**Descuento Permanente** (`appliesToMonth = 0`):
- El `effectiveMonthly` **SÍ cambia** (muestra precio con descuento)
- El descuento se mantiene todos los meses
- El cliente paga ese precio siempre

### 8.5 Por Qué Este Diseño

✅ **Evita confusión:** El precio mostrado es lo que pagarán la mayoría de los meses
✅ **Transparencia:** El badge indica claramente que hay una promoción temporal
✅ **Simplicidad:** Imposible mostrar todos los escenarios de descuentos en el listado
✅ **Desglose exacto:** SiteLink calcula el total correcto en el checkout

**IMPORTANTE:** Esta función NO calcula el precio del primer pago. Solo calcula el precio mensual recurrente para el listado de unidades.

---

## 9. Cambio de Credenciales (Demo ↔ Production)

### 9.1 Credenciales Separadas

**`.env` file:**
```env
# DEMO
SITELINK_DEMO_CORP_CODE=CCTST
SITELINK_DEMO_LOCATION_CODE=DEMO
SITELINK_DEMO_USERNAME=Administrator:::MEGACENTER9J348FCJ3U
SITELINK_DEMO_PASSWORD=DEMO

# PRODUCTION
SITELINK_REAL_CORP_CODE=CDRH
SITELINK_REAL_LOCATION_CODE=L012
SITELINK_REAL_USERNAME=Andres Schilkrut:::MEGACENTER9J348FCJ3U
SITELINK_REAL_PASSWORD=Laperla16699@@
```

### 9.2 Cambio en Runtime

**Endpoint:** `POST /api/config/mode`

```json
{
  "mode": "demo" | "production"
}
```

**Efecto:**
1. Actualiza `process.env.SITELINK_MODE`
2. Actualiza todas las credenciales activas (`SITELINK_CORP_CODE`, etc.)
3. **NO requiere reiniciar el servidor**
4. El frontend recarga automáticamente los datos

---

## 10. Response Final

### 10.1 Estructura del Response

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
        "explanation": "You don't pay the first month. You start paying from the second month.",
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
          }
        }
      ],
      "minPriceWithDiscount": 17,
      "totalAvailable": 28
    }
  ]
}
```

---

## 11. Key Points

✅ **SiteLink elige el mejor descuento** - No lo elegimos nosotros
✅ **Agrupación por tamaño + tipo** - 5x5 Self Storage ≠ 5x5 Locker Unit
✅ **Tiers basados en precio** - Good = más barato, Premium = más caro
✅ **Descuentos con colores únicos** - Fácil identificación visual
✅ **Descuentos comunes en header** - No se repiten en cada opción
✅ **Switch Demo/Prod sin reinicio** - Cambio de credenciales en runtime

---

## 12. Files Involved

```
api/
├── routes/
│   ├── units.routes.js           # GET /api/units/grouped
│   └── config.routes.js          # GET/POST /api/config/mode
├── controllers/
│   └── units.controller.js       # Lógica principal del inventario
├── services/
│   └── sitelink.service.js       # Llamadas SOAP a SiteLink
└── public/
    └── test-units.html           # Frontend de prueba
```

---

## 13. Next Steps

Para los otros flujos (Reservation, Move-In), seguir el mismo patrón:
1. Llamada SOAP via `sitelinkService`
2. Procesamiento en Controller
3. Response estructurado al Frontend
4. Documentación clara del flujo

---

**Última actualización:** Diciembre 2025
