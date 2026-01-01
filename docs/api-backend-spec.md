# API Backend - Especificación para Megacenter Next.js

## Configuración Base

**API Base URL:** `https://api.smdservers.net/CCWs_3.5/CallCenterWs.asmx`
**Protocolo:** SOAP 1.2
**Content-Type:** `text/xml; charset=utf-8`

**Credenciales (cada request):**
- `sCorpCode`: `CDRH`
- `sLocationCode`: `L012`
- `sCorpUserName`: `Usuario:::MEGACENTER9J348FCJ3U`
- `sCorpPassword`: `****`

---

## 1. Endpoint: Obtener Unidades con Agrupaciones y Descuentos

**Propósito:** Mostrar el inventario de unidades agrupadas por tipo, con precios, descuentos aplicables calculados y disponibilidad.

### 1.1 GET `/api/units`

**Query params (opcionales):**
- `includeOccupied` (boolean, default: false) - Incluir unidades ocupadas
- `includeDetails` (boolean, default: true) - Incluir lista de unidades individuales

**Descripción:** Retorna tipos de unidades con agrupaciones inteligentes por características, precios con descuentos aplicados calculados, y unidades individuales disponibles.

**Response esperado:**

```json
{
  "success": true,
  "data": {
    "siteInfo": {
      "siteId": 1,
      "currencyDecimals": 2,
      "taxDecimals": 2,
      "tax1Rate": 0.19,
      "tax2Rate": 0.0
    },
    "unitGroups": [
      {
        "groupId": "3x3-climate-inside",
        "displayName": "3m x 3m - Climatizado Interior",
        "sortOrder": 1,
        "unitTypeId": 123,
        "typeName": "Self Storage",
        "dimensions": {
          "width": 3.0,
          "length": 3.0,
          "area": 9.0,
          "displayText": "3m x 3m (9m²)"
        },
        "features": {
          "isClimate": true,
          "hasPower": false,
          "hasAlarm": true,
          "isInside": true,
          "floor": 1,
          "isMobile": false,
          "entryLocation": "interior_hallway",
          "doorType": "rollup",
          "hasADA": false
        },
        "pricing": {
          "standardRate": 150.00,
          "webRate": 140.00,
          "boardRate": 145.00,
          "preferredRate": 135.00,
          "preferredChannelType": 1,
          "isPushRate": false,
          "adminFee": 25.00,
          "reservationFee": 15.00,
          "securityDeposit": 0.00
        },
        "availability": {
          "totalUnits": 50,
          "occupied": 30,
          "vacant": 18,
          "reserved": 2,
          "status": "available"
        },
        "firstAvailableUnit": {
          "unitId": 456,
          "unitName": "U123",
          "description": "3x3 Climate Controlled",
          "isRented": false,
          "isReserved": false
        },
        "applicableDiscounts": [
          {
            "concessionId": 789,
            "planName": "50% OFF First Month",
            "description": "Obtén 50% de descuento en tu primer mes de arriendo",
            "comment": "Promoción válida solo para nuevos clientes",
            "discountType": "percentage",
            "discountValue": 50.0,
            "maxDiscount": 75.00,
            "appliesTo": "rent",
            "timing": {
              "neverExpires": false,
              "expiresInMonths": 1,
              "appliesInMonth": 1,
              "applyAtMoveIn": true,
              "prorateAtMoveIn": false
            },
            "requirements": {
              "requiresPrepay": false,
              "prepaidMonths": 0
            },
            "availability": {
              "availableChannels": ["website", "callcenter"],
              "isCorporate": false,
              "isDisabled": false
            },
            "restrictions": {
              "appliesToAllUnits": false,
              "restrictedToUnitTypes": [123],
              "restrictedToDimensions": [
                { "width": 3.0, "length": 3.0 }
              ]
            },
            "calculatedSavings": {
              "baseRate": 140.00,
              "discountAmount": 70.00,
              "finalRate": 70.00,
              "savingsPercentage": 50.0
            }
          },
          {
            "concessionId": 790,
            "planName": "Primer Mes $1",
            "description": "Paga solo $1 en tu primer mes",
            "discountType": "fixed_price",
            "discountValue": 1.00,
            "maxDiscount": 139.00,
            "appliesTo": "rent",
            "timing": {
              "neverExpires": false,
              "expiresInMonths": 1,
              "appliesInMonth": 1,
              "applyAtMoveIn": true,
              "prorateAtMoveIn": false
            },
            "requirements": {
              "requiresPrepay": false,
              "prepaidMonths": 0
            },
            "availability": {
              "availableChannels": ["website"],
              "isCorporate": false,
              "isDisabled": false
            },
            "restrictions": {
              "appliesToAllUnits": true,
              "restrictedToUnitTypes": [],
              "restrictedToDimensions": []
            },
            "calculatedSavings": {
              "baseRate": 140.00,
              "discountAmount": 139.00,
              "finalRate": 1.00,
              "savingsPercentage": 99.29
            }
          }
        ],
        "bestDiscount": {
          "concessionId": 790,
          "planName": "Primer Mes $1",
          "savingsAmount": 139.00,
          "savingsPercentage": 99.29,
          "finalFirstMonthRate": 1.00
        },
        "taxes": {
          "tax1Rate": 0.19,
          "tax2Rate": 0.0,
          "chargeTax1": true,
          "chargeTax2": false
        },
        "units": [
          {
            "unitId": 456,
            "unitName": "U123",
            "description": "3x3 Climate Controlled - Piso 1",
            "floor": 1,
            "isRented": false,
            "isReserved": false,
            "isCorporate": false,
            "isRentable": true,
            "lastMovedOut": "2025-01-10T00:00:00Z",
            "note": "",
            "standardRate": 150.00,
            "webRate": 140.00,
            "preferredRate": 135.00
          },
          {
            "unitId": 457,
            "unitName": "U124",
            "description": "3x3 Climate Controlled - Piso 1",
            "floor": 1,
            "isRented": false,
            "isReserved": false,
            "isCorporate": false,
            "isRentable": true,
            "lastMovedOut": "2024-12-15T00:00:00Z",
            "note": "",
            "standardRate": 150.00,
            "webRate": 140.00,
            "preferredRate": 135.00
          }
        ]
      },
      {
        "groupId": "3x3-standard-exterior",
        "displayName": "3m x 3m - Exterior",
        "sortOrder": 2,
        "unitTypeId": 124,
        "typeName": "Self Storage",
        "dimensions": {
          "width": 3.0,
          "length": 3.0,
          "area": 9.0,
          "displayText": "3m x 3m (9m²)"
        },
        "features": {
          "isClimate": false,
          "hasPower": false,
          "hasAlarm": true,
          "isInside": false,
          "floor": 0,
          "isMobile": false,
          "entryLocation": "exterior",
          "doorType": "rollup",
          "hasADA": true
        },
        "pricing": {
          "standardRate": 120.00,
          "webRate": 110.00,
          "boardRate": 115.00,
          "preferredRate": 110.00,
          "preferredChannelType": 1,
          "isPushRate": false,
          "adminFee": 25.00,
          "reservationFee": 15.00,
          "securityDeposit": 0.00
        },
        "availability": {
          "totalUnits": 30,
          "occupied": 20,
          "vacant": 10,
          "reserved": 0,
          "status": "available"
        },
        "firstAvailableUnit": {
          "unitId": 500,
          "unitName": "U201",
          "description": "3x3 Exterior Ground Level",
          "isRented": false,
          "isReserved": false
        },
        "applicableDiscounts": [
          {
            "concessionId": 790,
            "planName": "Primer Mes $1",
            "description": "Paga solo $1 en tu primer mes",
            "discountType": "fixed_price",
            "discountValue": 1.00,
            "maxDiscount": 109.00,
            "appliesTo": "rent",
            "timing": {
              "neverExpires": false,
              "expiresInMonths": 1,
              "appliesInMonth": 1,
              "applyAtMoveIn": true,
              "prorateAtMoveIn": false
            },
            "requirements": {
              "requiresPrepay": false,
              "prepaidMonths": 0
            },
            "availability": {
              "availableChannels": ["website"],
              "isCorporate": false,
              "isDisabled": false
            },
            "restrictions": {
              "appliesToAllUnits": true,
              "restrictedToUnitTypes": [],
              "restrictedToDimensions": []
            },
            "calculatedSavings": {
              "baseRate": 110.00,
              "discountAmount": 109.00,
              "finalRate": 1.00,
              "savingsPercentage": 99.09
            }
          }
        ],
        "bestDiscount": {
          "concessionId": 790,
          "planName": "Primer Mes $1",
          "savingsAmount": 109.00,
          "savingsPercentage": 99.09,
          "finalFirstMonthRate": 1.00
        },
        "taxes": {
          "tax1Rate": 0.19,
          "tax2Rate": 0.0,
          "chargeTax1": true,
          "chargeTax2": false
        },
        "units": [
          {
            "unitId": 500,
            "unitName": "U201",
            "description": "3x3 Exterior Ground Level",
            "floor": 0,
            "isRented": false,
            "isReserved": false,
            "isCorporate": false,
            "isRentable": true,
            "lastMovedOut": "2025-01-05T00:00:00Z",
            "note": "",
            "standardRate": 120.00,
            "webRate": 110.00,
            "preferredRate": 110.00
          }
        ]
      }
    ],
    "insurance": [
      {
        "insuranceCoverageId": 1,
        "coverage": 2000.00,
        "premium": 10.00,
        "monthlyPremium": 10.00,
        "description": "Cobertura básica hasta $2,000",
        "provider": "SiteLink Insurance",
        "theftCoveragePercent": 100.0
      },
      {
        "insuranceCoverageId": 2,
        "coverage": 5000.00,
        "premium": 20.00,
        "monthlyPremium": 20.00,
        "description": "Cobertura premium hasta $5,000",
        "provider": "SiteLink Insurance",
        "theftCoveragePercent": 100.0
      },
      {
        "insuranceCoverageId": 3,
        "coverage": 10000.00,
        "premium": 35.00,
        "monthlyPremium": 35.00,
        "description": "Cobertura completa hasta $10,000",
        "provider": "SiteLink Insurance",
        "theftCoveragePercent": 100.0
      }
    ],
    "summary": {
      "totalUnitTypes": 2,
      "totalAvailableUnits": 28,
      "totalOccupiedUnits": 50,
      "totalReservedUnits": 2,
      "priceRange": {
        "min": 110.00,
        "max": 140.00
      },
      "availableSizes": [
        { "width": 3.0, "length": 3.0, "area": 9.0, "displayText": "3m x 3m" }
      ]
    }
  }
}
```

---

### 1.2 Lógica Detallada del Backend

#### Paso 1: Obtener datos base (cachear 15 minutos)

```javascript
// Cache key: "sitelink:units:CDRH:L012"
const unitTypes = await callSiteLink('UnitTypePriceList_v2');
const discounts = await callSiteLink('DiscountPlansRetrieve');
const insurance = await callSiteLink('InsuranceCoverageRetrieve');
```

#### Paso 2: Procesar descuentos y crear mapa de aplicabilidad

```javascript
// Construir mapa de restricciones por descuento
const discountRestrictions = {};

discounts.ConcessionUnitTypes.forEach(restriction => {
  if (!discountRestrictions[restriction.ConcessionID]) {
    discountRestrictions[restriction.ConcessionID] = [];
  }
  discountRestrictions[restriction.ConcessionID].push({
    unitTypeId: restriction.UnitTypeID,
    width: restriction.dcWidth,
    length: restriction.dcLength
  });
});

// Función para verificar si un descuento aplica a un tipo de unidad
function discountAppliesTo(concessionId, unitTypeId, width, length) {
  // Si NO hay restricciones, aplica a TODOS
  if (!discountRestrictions[concessionId] || discountRestrictions[concessionId].length === 0) {
    return true;
  }

  // Si hay restricciones, verificar coincidencia exacta
  return discountRestrictions[concessionId].some(r =>
    r.unitTypeId === unitTypeId &&
    (!r.width || r.width === width) &&
    (!r.length || r.length === length)
  );
}
```

#### Paso 3: Filtrar descuentos por canal (Website)

```javascript
function isAvailableOnWebsite(discount) {
  const availableAt = discount.iAvailableAt;

  // Si está deshabilitado, no mostrar
  if (discount.dDisabled !== null) {
    return false;
  }

  // Si es bit mask (>= 16)
  if (availableAt >= 16) {
    const WEBSITE_BIT = 32;
    return (availableAt & WEBSITE_BIT) !== 0;
  }

  // Si es valor único
  // 0 = Everywhere, 2 = Website Only
  return availableAt === 0 || availableAt === 2;
}

const websiteDiscounts = discounts.ConcessionPlans
  .filter(isAvailableOnWebsite)
  .filter(d => d.bApplyAtMoveIn === true); // Solo los que aplican en move-in
```

#### Paso 4: Calcular ahorros por descuento para cada tipo

```javascript
function calculateDiscount(baseRate, discount) {
  let discountAmount = 0;
  let finalRate = baseRate;

  // iAmtType: 0=Monto fijo, 1=Porcentaje, 2=Tarifa fija
  switch (discount.iAmtType) {
    case 0: // Monto fijo
      discountAmount = discount.dcFixedDiscount;
      finalRate = Math.max(0, baseRate - discountAmount);
      break;

    case 1: // Porcentaje
      discountAmount = (baseRate * discount.dcPCDiscount) / 100;
      finalRate = baseRate - discountAmount;
      break;

    case 2: // Tarifa fija (precio final)
      finalRate = discount.dcChgAmt;
      discountAmount = Math.max(0, baseRate - finalRate);
      break;
  }

  // Aplicar redondeo si está configurado
  if (discount.bRound && discount.dcRoundTo > 0) {
    discountAmount = Math.round(discountAmount / discount.dcRoundTo) * discount.dcRoundTo;
    finalRate = baseRate - discountAmount;
  }

  // Aplicar máximo descuento
  if (discount.dcMaxAmountOff > 0 && discountAmount > discount.dcMaxAmountOff) {
    discountAmount = discount.dcMaxAmountOff;
    finalRate = baseRate - discountAmount;
  }

  return {
    discountAmount: Math.max(0, discountAmount),
    finalRate: Math.max(0, finalRate),
    savingsPercentage: baseRate > 0 ? (discountAmount / baseRate) * 100 : 0
  };
}
```

#### Paso 5: Agrupar unidades por características

```javascript
function createGroupId(unitType) {
  // Crear ID único basado en características principales
  const size = `${unitType.dcWidth}x${unitType.dcLength}`;
  const climate = unitType.bClimate ? 'climate' : 'standard';
  const location = unitType.bInside ? 'inside' : 'exterior';

  return `${size}-${climate}-${location}`;
}

function createDisplayName(unitType) {
  const size = `${unitType.dcWidth}m x ${unitType.dcLength}m`;
  const features = [];

  if (unitType.bClimate) features.push('Climatizado');
  if (unitType.bInside) features.push('Interior');
  else features.push('Exterior');

  return features.length > 0
    ? `${size} - ${features.join(' ')}`
    : size;
}
```

#### Paso 6: Construir grupos con descuentos aplicables

```javascript
const unitGroups = unitTypes.Table.map((unitType, index) => {
  const groupId = createGroupId(unitType);
  const baseRate = unitType.dcWebRate || unitType.dcStdRate;

  // Filtrar descuentos que aplican a este tipo
  const applicableDiscounts = websiteDiscounts
    .filter(discount => discountAppliesTo(
      discount.ConcessionID,
      unitType.UnitTypeID,
      unitType.dcWidth,
      unitType.dcLength
    ))
    .map(discount => {
      const savings = calculateDiscount(baseRate, discount);

      return {
        concessionId: discount.ConcessionID,
        planName: discount.sPlanName,
        description: discount.sDescription || discount.sPlanName,
        comment: discount.sComment || '',
        discountType: getDiscountTypeString(discount.iAmtType),
        discountValue: getDiscountValue(discount),
        maxDiscount: discount.dcMaxAmountOff,
        appliesTo: 'rent',
        timing: {
          neverExpires: discount.bNeverExpires,
          expiresInMonths: discount.iExpirMonths,
          appliesInMonth: discount.iInMonth,
          applyAtMoveIn: discount.bApplyAtMoveIn,
          prorateAtMoveIn: discount.bProrateAtMoveIn
        },
        requirements: {
          requiresPrepay: discount.bPrepay,
          prepaidMonths: discount.iPrePaidMonths
        },
        availability: {
          availableChannels: getAvailableChannels(discount.iAvailableAt),
          isCorporate: discount.bForCopr,
          isDisabled: discount.dDisabled !== null
        },
        restrictions: {
          appliesToAllUnits: discount.bForAllUnits || !discountRestrictions[discount.ConcessionID],
          restrictedToUnitTypes: discountRestrictions[discount.ConcessionID]?.map(r => r.unitTypeId) || [],
          restrictedToDimensions: discountRestrictions[discount.ConcessionID]?.map(r => ({
            width: r.width,
            length: r.length
          })) || []
        },
        calculatedSavings: {
          baseRate: baseRate,
          discountAmount: savings.discountAmount,
          finalRate: savings.finalRate,
          savingsPercentage: savings.savingsPercentage
        }
      };
    });

  // Encontrar el mejor descuento (mayor ahorro)
  const bestDiscount = applicableDiscounts.reduce((best, current) => {
    if (!best) return current;
    return current.calculatedSavings.discountAmount > best.calculatedSavings.discountAmount
      ? current
      : best;
  }, null);

  return {
    groupId: groupId,
    displayName: createDisplayName(unitType),
    sortOrder: index + 1,
    unitTypeId: unitType.UnitTypeID,
    typeName: unitType.sTypeName,
    dimensions: {
      width: unitType.dcWidth,
      length: unitType.dcLength,
      area: unitType.dcArea,
      displayText: `${unitType.dcWidth}m x ${unitType.dcLength}m (${unitType.dcArea}m²)`
    },
    features: {
      isClimate: unitType.bClimate,
      hasPower: unitType.bPower,
      hasAlarm: unitType.bAlarm,
      isInside: unitType.bInside,
      floor: unitType.iFloor,
      isMobile: unitType.bMobile,
      entryLocation: mapEntryLocation(unitType.iEntryLoc),
      doorType: mapDoorType(unitType.iDoorType),
      hasADA: unitType.iADA === 1
    },
    pricing: {
      standardRate: unitType.dcStdRate,
      webRate: unitType.dcWebRate,
      boardRate: unitType.dcBoardRate,
      preferredRate: unitType.dcPreferredRate,
      preferredChannelType: unitType.iPreferredChannelType,
      isPushRate: unitType.bPreferredIsPushRate,
      adminFee: unitType.dcAdminFee,
      reservationFee: unitType.dcReservationFee,
      securityDeposit: unitType.dcStdSecDep
    },
    availability: {
      totalUnits: unitType.iTotalUnits,
      occupied: unitType.iTotalOccupied,
      vacant: unitType.iTotalVacant,
      reserved: unitType.iTotalReserved,
      status: unitType.iTotalVacant > 0 ? 'available' : 'unavailable'
    },
    firstAvailableUnit: unitType.UnitID_FirstAvailable ? {
      unitId: unitType.UnitID_FirstAvailable,
      unitName: unitType.sUnitName_FirstAvailable,
      description: unitType.sUnitDesc_FirstAvailable,
      isRented: unitType.bRented_FirstAvailable,
      isReserved: false
    } : null,
    applicableDiscounts: applicableDiscounts,
    bestDiscount: bestDiscount ? {
      concessionId: bestDiscount.concessionId,
      planName: bestDiscount.planName,
      savingsAmount: bestDiscount.calculatedSavings.discountAmount,
      savingsPercentage: bestDiscount.calculatedSavings.savingsPercentage,
      finalFirstMonthRate: bestDiscount.calculatedSavings.finalRate
    } : null,
    taxes: {
      tax1Rate: unitType.dcTax1Rate_Rent,
      tax2Rate: unitType.dcTax2Rate_Rent,
      chargeTax1: unitType.bChargeTax1,
      chargeTax2: unitType.bChargeTax2
    },
    units: [] // Se llenará en el siguiente paso si includeDetails=true
  };
});
```

#### Paso 7: Agregar unidades individuales (opcional)

```javascript
if (includeDetails) {
  // Llamar UnitsInformationAvailableUnitsOnly_v2 para obtener lista completa
  const availableUnits = await callSiteLink('UnitsInformationAvailableUnitsOnly_v2', {
    lngLastTimePolled: 0
  });

  // Agrupar unidades por UnitTypeID
  const unitsByType = {};
  availableUnits.Table.forEach(unit => {
    if (!unit.bRented && unit.bRentable && !unit.dDeleted) {
      if (!unitsByType[unit.UnitTypeID]) {
        unitsByType[unit.UnitTypeID] = [];
      }
      unitsByType[unit.UnitTypeID].push({
        unitId: unit.UnitID,
        unitName: unit.sUnitName,
        description: unit.sUnitDesc,
        floor: unit.iFloor,
        isRented: unit.bRented,
        isReserved: unit.bWaitingListReserved,
        isCorporate: unit.bCorporate,
        isRentable: unit.bRentable,
        lastMovedOut: unit.dMovedOut,
        note: unit.sUnitNote,
        standardRate: unit.dcStdRate,
        webRate: unit.dcWebRate,
        preferredRate: unit.dcPreferredRate
      });
    }
  });

  // Agregar unidades a cada grupo
  unitGroups.forEach(group => {
    group.units = unitsByType[group.unitTypeId] || [];
  });
}
```

#### Funciones auxiliares

```javascript
function getDiscountTypeString(iAmtType) {
  switch (iAmtType) {
    case 0: return 'fixed_amount';
    case 1: return 'percentage';
    case 2: return 'fixed_price';
    default: return 'unknown';
  }
}

function getDiscountValue(discount) {
  switch (discount.iAmtType) {
    case 0: return discount.dcFixedDiscount;
    case 1: return discount.dcPCDiscount;
    case 2: return discount.dcChgAmt;
    default: return 0;
  }
}

function getAvailableChannels(iAvailableAt) {
  const channels = [];

  if (iAvailableAt < 16) {
    // Valor único
    switch (iAvailableAt) {
      case 0: return ['all'];
      case 1: return ['client'];
      case 2: return ['website'];
      case 3: return ['kiosk'];
      case 4: return ['callcenter'];
      case 5: return ['sparefoot'];
    }
  } else {
    // Bit mask
    if (iAvailableAt & 16) channels.push('client');
    if (iAvailableAt & 32) channels.push('website');
    if (iAvailableAt & 64) channels.push('kiosk');
    if (iAvailableAt & 128) channels.push('callcenter');
    if (iAvailableAt & 256) channels.push('sparefoot');
  }

  return channels;
}

function mapEntryLocation(iEntryLoc) {
  switch (iEntryLoc) {
    case 1: return 'exterior';
    case 2: return 'interior_hallway';
    case 3: return 'elevator';
    default: return 'undefined';
  }
}

function mapDoorType(iDoorType) {
  switch (iDoorType) {
    case 1: return 'rollup';
    case 2: return 'swing';
    default: return 'undefined';
  }
}
```

---

### 1.3 Reglas Críticas de Descuentos

#### Regla 1: Aplicabilidad por Tipo de Unidad

```javascript
// CASO 1: Descuento SIN restricciones (aplica a TODOS)
// ConcessionUnitTypes NO tiene registros para este ConcessionID
{
  concessionId: 790,
  restrictions: {
    appliesToAllUnits: true,
    restrictedToUnitTypes: [],
    restrictedToDimensions: []
  }
}

// CASO 2: Descuento CON restricciones (aplica solo a tipos específicos)
// ConcessionUnitTypes tiene registros para este ConcessionID
{
  concessionId: 789,
  restrictions: {
    appliesToAllUnits: false,
    restrictedToUnitTypes: [123, 124],
    restrictedToDimensions: [
      { width: 3.0, length: 3.0 },
      { width: 3.0, length: 6.0 }
    ]
  }
}
```

#### Regla 2: Filtro por Canal

```javascript
// Solo mostrar descuentos disponibles en Website
// Verificar bit 32 (Website) en iAvailableAt
// O valor único 0 (Everywhere) o 2 (Website Only)
```

#### Regla 3: Descuentos Activos

```javascript
// NO mostrar descuentos deshabilitados
if (discount.dDisabled !== null) {
  // Descuento está deshabilitado, no incluir
}

// Solo mostrar descuentos que aplican en move-in
if (discount.bApplyAtMoveIn === false) {
  // No aplica en move-in, no incluir
}
```

#### Regla 4: Mejor Descuento

```javascript
// El "mejor descuento" es el que da mayor ahorro en pesos (no porcentaje)
// Ejemplo:
// Descuento A: 50% OFF ($70 de ahorro)
// Descuento B: Primer mes $1 ($139 de ahorro)
// Mejor descuento: B (mayor ahorro absoluto)
```

---

### 1.4 Ejemplo de Tipos de Descuento

#### Tipo 1: Porcentaje (iAmtType = 1)

```json
{
  "concessionId": 789,
  "planName": "50% OFF First Month",
  "discountType": "percentage",
  "discountValue": 50.0,
  "iAmtType": 1,
  "dcPCDiscount": 50.0,
  "calculatedSavings": {
    "baseRate": 140.00,
    "discountAmount": 70.00,
    "finalRate": 70.00,
    "savingsPercentage": 50.0
  }
}
```

#### Tipo 2: Monto Fijo (iAmtType = 0)

```json
{
  "concessionId": 791,
  "planName": "$30 OFF First Month",
  "discountType": "fixed_amount",
  "discountValue": 30.0,
  "iAmtType": 0,
  "dcFixedDiscount": 30.0,
  "calculatedSavings": {
    "baseRate": 140.00,
    "discountAmount": 30.00,
    "finalRate": 110.00,
    "savingsPercentage": 21.43
  }
}
```

#### Tipo 3: Precio Fijo (iAmtType = 2)

```json
{
  "concessionId": 790,
  "planName": "Primer Mes $1",
  "discountType": "fixed_price",
  "discountValue": 1.0,
  "iAmtType": 2,
  "dcChgAmt": 1.0,
  "calculatedSavings": {
    "baseRate": 140.00,
    "discountAmount": 139.00,
    "finalRate": 1.00,
    "savingsPercentage": 99.29
  }
}
```

---

### 1.5 Caché y Performance

```javascript
// Implementar caché con TTL de 15 minutos
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos
const CACHE_CLEANUP_HOUR = 0; // Limpiar a medianoche

// Redis keys
const cacheKeys = {
  unitTypes: `sitelink:unitTypes:${corpCode}:${locationCode}`,
  discounts: `sitelink:discounts:${corpCode}:${locationCode}`,
  insurance: `sitelink:insurance:${corpCode}:${locationCode}`,
  availableUnits: `sitelink:availableUnits:${corpCode}:${locationCode}`
};

// Limpiar cache completamente cada noche
cron.schedule('0 0 * * *', () => {
  redis.del(Object.values(cacheKeys));
});
```

---

## 2. Flujo de Reserva (Reservation Flow)

**Propósito:** Permitir al usuario reservar una unidad sin pago inmediato.

### 2.1 POST `/api/reservation/create`

**Descripción:** Crea una reserva para una unidad específica.

**Request:**

```json
{
  "tenant": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@email.com",
    "phone": "+56912345678",
    "mobile": "+56987654321",
    "address": {
      "line1": "Av Principal 123",
      "line2": "Depto 4B",
      "city": "Santiago",
      "region": "RM",
      "postalCode": "8320000",
      "country": "Chile"
    },
    "license": "12.345.678-9",
    "dateOfBirth": "1990-05-15",
    "isCommercial": false
  },
  "unit": {
    "unitId": 456
  },
  "reservation": {
    "neededDate": "2025-01-20",
    "comment": "Necesito para mudanza",
    "trackingCode": "utm_source=google&utm_medium=cpc"
  },
  "discount": {
    "concessionId": 789
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reservationId": 1001,
    "tenantId": 5678,
    "waitingListId": 2002,
    "globalWaitingNum": "WAIT-2002",
    "accessCode": "1234",
    "unit": {
      "unitId": 456,
      "unitName": "U123"
    },
    "neededDate": "2025-01-20T00:00:00Z",
    "createdAt": "2025-01-15T10:30:00Z",
    "expiresAt": "2025-01-22T23:59:59Z"
  }
}
```

**Lógica del backend:**

1. Buscar si el tenant ya existe: `TenantListDetailed_v3` con email o teléfono
2. Si NO existe, crear: `TenantNewDetailed_v2` → obtener `TenantID`
3. Crear reservación: `ReservationNewWithSource_v5`
   - `QTRentalTypeID = 2` (Order/Reservation)
   - `iInquiryType = 2` (Web)
   - `iSource = 5` (Website)
   - Guardar `WaitingListID` retornado

**IMPORTANTE:** El flujo de reserva termina aquí. No hay pago ni proceso adicional.

---

## 3. Flujo de Move-In (sin E-Sign)

**Propósito:** Permitir al usuario hacer move-in completo con pago, sin incluir firma electrónica.

### 3.1 POST `/api/movein/calculate`

**Descripción:** Calcula el costo total del move-in antes de procesar el pago.

**Request:**

```json
{
  "unitId": 456,
  "moveInDate": "2025-01-20",
  "insuranceCoverageId": 1,
  "concessionId": 789,
  "channelType": 1
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "unitId": 456,
    "unitName": "U123",
    "unitType": "Self Storage",
    "dimensions": {
      "width": 3,
      "length": 3
    },
    "isClimate": true,
    "moveInDate": "2025-01-20T00:00:00Z",
    "charges": [
      {
        "description": "Monthly Rent Fee",
        "chargeAmount": 140.00,
        "taxAmount": 26.60,
        "discount": 70.00,
        "total": 70.00,
        "isRequired": true,
        "startDate": "2025-01-20",
        "endDate": "2025-02-20"
      },
      {
        "description": "Administrative Fee",
        "chargeAmount": 25.00,
        "taxAmount": 4.75,
        "discount": 0.00,
        "total": 25.00,
        "isRequired": true
      },
      {
        "description": "Insurance Premium",
        "chargeAmount": 10.00,
        "taxAmount": 1.90,
        "discount": 0.00,
        "total": 10.00,
        "isRequired": true
      }
    ],
    "summary": {
      "subtotal": 175.00,
      "totalDiscount": 70.00,
      "totalTax": 33.25,
      "totalDue": 138.25,
      "standardRate": 150.00,
      "webRate": 140.00
    }
  }
}
```

**Lógica del backend:**

1. Llamar `MoveInCostRetrieveWithDiscount_v2`
   - `ChannelType = 1` (WebRate para mostrar precio tachado)
   - `InsuranceCoverageID = -999` si no quiere seguro
   - `ConcessionPlanID = -999` si no hay descuento
2. Filtrar rows donde `bMoveInRequired = true`
3. Sumar `dcTotal + TaxAmount` para obtener total a pagar
4. Guardar el total exacto para validación en el paso siguiente

---

### 3.2 POST `/api/movein/execute`

**Descripción:** Ejecuta el move-in con pago completo.

**Request:**

```json
{
  "tenant": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@email.com",
    "phone": "+56912345678",
    "mobile": "+56987654321",
    "address": {
      "line1": "Av Principal 123",
      "line2": "Depto 4B",
      "city": "Santiago",
      "region": "RM",
      "postalCode": "8320000",
      "country": "Chile"
    },
    "license": "12.345.678-9",
    "dateOfBirth": "1990-05-15",
    "isCommercial": false
  },
  "unit": {
    "unitId": 456
  },
  "moveIn": {
    "startDate": "2025-01-20",
    "endDate": "2025-02-20",
    "insuranceCoverageId": 1,
    "concessionId": 789,
    "billingFrequency": 3,
    "keypadZoneId": 1,
    "timeZoneId": 1
  },
  "payment": {
    "amount": 138.25,
    "method": "credit_card",
    "cardType": 6,
    "cardNumber": "4111111111111111",
    "cvv": "123",
    "expirationDate": "2027-12-31",
    "holderName": "Juan Pérez",
    "billingAddress": "Av Principal 123",
    "billingZip": "8320000"
  },
  "tracking": {
    "source": "website",
    "trackingCode": "utm_source=google"
  },
  "convertFromReservation": {
    "waitingListId": null
  }
}
```

**Response (éxito):**

```json
{
  "success": true,
  "data": {
    "ledgerId": 9876,
    "leaseNumber": 12345,
    "tenantId": 5678,
    "accessCode": "1234",
    "unit": {
      "unitId": 456,
      "unitName": "U123"
    },
    "moveInDate": "2025-01-20T00:00:00Z",
    "paidThrough": "2025-02-20T00:00:00Z",
    "monthlyRent": 140.00,
    "totalPaid": 138.25
  }
}
```

**Response (error):**

```json
{
  "success": false,
  "error": {
    "code": -11,
    "message": "Payment amount does not match calculated total",
    "details": "Expected 138.25 but received 140.00"
  }
}
```

**Lógica del backend:**

1. Buscar si el tenant ya existe: `TenantListDetailed_v3`
2. Si NO existe, crear: `TenantNewDetailed_v2` → obtener `TenantID`
3. Ejecutar move-in: `MoveInWithDiscount_v4`
   - `iSource = 5` (Website)
   - `iPayMethod = 0` (Credit Card)
   - `iBillingFrequency = 3` (Monthly) o `7` (28 Day Billing)
   - `iWaitingID = -999` (si es move-in directo) o `WaitingListID` (si convierte reserva)
   - `bTestMode = false` (producción) o `true` (testing)
4. Validar que `Ret_Code > 0` (éxito = LedgerID)
5. Si error `-11`, el monto no coincide → recalcular con `/api/movein/calculate`

**Códigos de tarjeta:**
- `5` = MasterCard
- `6` = VISA
- `7` = Amex
- `8` = Discover
- `9` = Diners

**Billing Frequency:**
- `3` = Monthly
- `7` = 28 Day Billing

---

### 3.3 POST `/api/movein/convert-reservation`

**Descripción:** Convierte una reserva existente en move-in.

**Request:**

```json
{
  "waitingListId": 2002,
  "moveIn": {
    "startDate": "2025-01-20",
    "endDate": "2025-02-20",
    "insuranceCoverageId": 1,
    "billingFrequency": 3
  },
  "payment": {
    "amount": 138.25,
    "method": "credit_card",
    "cardType": 6,
    "cardNumber": "4111111111111111",
    "cvv": "123",
    "expirationDate": "2027-12-31",
    "holderName": "Juan Pérez",
    "billingAddress": "Av Principal 123",
    "billingZip": "8320000"
  }
}
```

**Response:** Igual que `/api/movein/execute`

**Lógica del backend:**

1. Obtener datos del tenant desde la reserva
2. Llamar `MoveInCostRetrieveWithDiscount_v2` para calcular total
3. Ejecutar `MoveInWithDiscount_v4` con `iWaitingID = waitingListId`

---

## 4. Endpoints de Soporte

### 4.1 GET `/api/tenant/search`

**Descripción:** Busca un tenant existente por email, teléfono o nombre.

**Query params:**
- `email` (opcional)
- `phone` (opcional)
- `firstName` (opcional)
- `lastName` (opcional)

**Response:**

```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "tenantId": 5678,
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "juan@email.com",
        "phone": "+56912345678",
        "accessCode": "1234",
        "hasActiveLedger": true,
        "locationCode": "L012"
      }
    ]
  }
}
```

**Lógica del backend:**

1. Llamar `TenantListDetailed_v3` con filtros
2. Máximo 50 resultados

---

### 4.2 GET `/api/tenant/:tenantId/ledgers`

**Descripción:** Obtiene todos los arriendos de un tenant.

**Response:**

```json
{
  "success": true,
  "data": {
    "tenantId": 5678,
    "tenantName": "Juan Pérez",
    "ledgers": [
      {
        "ledgerId": 9876,
        "unitName": "U123",
        "monthlyRent": 140.00,
        "moveInDate": "2025-01-20T00:00:00Z",
        "paidThrough": "2025-02-20T00:00:00Z",
        "chargeBalance": 0.00,
        "totalDue": 0.00,
        "isOverlocked": false,
        "billingFrequency": "Monthly"
      }
    ]
  }
}
```

**Lógica del backend:**

1. Llamar `LedgersByTenantID` con el `TenantID`

---

## 5. Reglas de Negocio Importantes

### 5.1 Cache

**OBLIGATORIO** cachear estos endpoints por 15 minutos:
- `UnitTypePriceList_v2`
- `DiscountPlansRetrieve`
- `InsuranceCoverageRetrieve`

Limpiar cache completamente cada noche a las 00:00.

### 5.2 Validación de Montos

SIEMPRE llamar `MoveInCostRetrieveWithDiscount_v2` antes de `MoveInWithDiscount_v4`.

El monto del pago DEBE coincidir exactamente con el total calculado, o el move-in fallará con error `-11`.

### 5.3 Descuentos por Canal

Filtrar descuentos donde `iAvailableAt` incluye el bit 32 (Website):

```javascript
// Si iAvailableAt >= 16 (bit mask)
const isAvailableOnWebsite = (iAvailableAt & 32) !== 0;

// Si iAvailableAt < 16 (valor único)
const isAvailableOnWebsite = iAvailableAt === 0 || iAvailableAt === 2;
```

### 5.4 Restricciones de Descuentos por Tipo

Si `ConcessionUnitTypes` NO tiene registros para un `ConcessionID`:
- El descuento aplica a TODOS los tipos de unidades

Si `ConcessionUnitTypes` tiene registros para un `ConcessionID`:
- El descuento SOLO aplica a esos `UnitTypeID` específicos

### 5.5 Valores por Defecto

- `InsuranceCoverageID = -999` → Sin seguro
- `ConcessionPlanID = -999` → Sin descuento
- `iWaitingID = -999` → Move-in directo (no es conversión de reserva)
- `bTestMode = false` → Producción (procesa pago real)

### 5.6 Manejo de Fechas

Todas las fechas DEBEN enviarse en formato ISO 8601:
```
2025-01-20T00:00:00Z
```

---

## 6. Códigos de Error Comunes

| Código | Endpoint | Descripción | Solución |
|--------|----------|-------------|----------|
| -11 | MoveIn | Payment amount mismatch | Recalcular con MoveInCostRetrieve |
| -2 | MoveIn | Unit not available | Unit ya fue rentada, mostrar error |
| -25 | Varios | Invalid Unit ID | Validar que UnitID existe |
| -95 | Varios | Invalid Tenant ID | Validar que TenantID existe |
| -3 | Reservation | Invalid concession | Validar ConcessionID antes de enviar |
| -14 | MoveIn | Invalid credit card | Validar formato de tarjeta |
| -100 | MoveIn | Credit card not authorized | Rechazado por procesador de pagos |

---

## 7. Flujos Resumidos

### Flujo de Reserva (Completo)

```
1. GET /api/units
   → Mostrar unidades disponibles con precios y descuentos

2. POST /api/reservation/create
   → Crear tenant (si no existe)
   → Crear reserva
   → Retornar WaitingListID

FIN (no hay más pasos)
```

### Flujo de Move-In Directo (Completo)

```
1. GET /api/units
   → Mostrar unidades disponibles con precios y descuentos

2. POST /api/movein/calculate
   → Calcular costo total exacto

3. POST /api/movein/execute
   → Crear tenant (si no existe)
   → Procesar pago
   → Ejecutar move-in
   → Retornar LedgerID

FIN (e-sign se verá más adelante)
```

### Conversión de Reserva a Move-In

```
1. Usuario ya tiene una reserva (WaitingListID existente)

2. POST /api/movein/convert-reservation
   → Calcular costo
   → Procesar pago
   → Convertir reserva a move-in
   → Retornar LedgerID

FIN
```

---

## 8. Testing

### Modo de Prueba

Para testing SIN procesar pagos reales:

```json
{
  "moveIn": {
    "testMode": true
  }
}
```

Esto setea `bTestMode = true` en `MoveInWithDiscount_v4`.

**IMPORTANTE:** En producción, `testMode` debe ser `false` o no enviarse.

---

## 9. Consideraciones de Seguridad

1. **NO exponer credenciales SOAP** en el frontend
2. Validar todos los inputs antes de llamar SOAP endpoints
3. Sanitizar números de tarjeta (solo mostrar últimos 4 dígitos)
4. Usar HTTPS para todos los endpoints
5. Implementar rate limiting en endpoints de pago
6. Loggear todos los errores de SOAP para debugging
7. NO guardar números de tarjeta completos en logs

---

## 10. Formato de SOAP Requests

Todos los requests SOAP deben incluir estas credenciales:

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <{ENDPOINT_NAME} xmlns="http://tempuri.org/CallCenterWs/CallCenterWs">
      <sCorpCode>CDRH</sCorpCode>
      <sLocationCode>L012</sLocationCode>
      <sCorpUserName>Usuario:::MEGACENTER9J348FCJ3U</sCorpUserName>
      <sCorpPassword>****</sCorpPassword>
      <!-- Parámetros adicionales aquí -->
    </{ENDPOINT_NAME}>
  </soap12:Body>
</soap12:Envelope>
```

**Headers requeridos:**
```
Content-Type: text/xml; charset=utf-8
SOAPAction: http://tempuri.org/CallCenterWs/CallCenterWs/{ENDPOINT_NAME}
```

---

## Resumen de Endpoints Necesarios

| Endpoint REST | Método | SOAP Endpoint(s) | Cacheable |
|---------------|--------|------------------|-----------|
| `/api/units` | GET | UnitTypePriceList_v2, DiscountPlansRetrieve, InsuranceCoverageRetrieve, UnitsInformationAvailableUnitsOnly_v2 | Sí (15 min) |
| `/api/reservation/create` | POST | TenantListDetailed_v3, TenantNewDetailed_v2, ReservationNewWithSource_v5 | No |
| `/api/movein/calculate` | POST | MoveInCostRetrieveWithDiscount_v2 | No |
| `/api/movein/execute` | POST | TenantListDetailed_v3, TenantNewDetailed_v2, MoveInWithDiscount_v4 | No |
| `/api/movein/convert-reservation` | POST | MoveInCostRetrieveWithDiscount_v2, MoveInWithDiscount_v4 | No |
| `/api/tenant/search` | GET | TenantListDetailed_v3 | No |
| `/api/tenant/:id/ledgers` | GET | LedgersByTenantID | No |
