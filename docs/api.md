# SiteLink API - Documentación para Megacenter

Documentación de los endpoints de SiteLink CallCenterWs necesarios para el flujo de move-in online.

## Configuración Base

**URL Base:** `https://api.smdservers.net/CCWs_3.5/CallCenterWs.asmx`  
**Protocolo:** SOAP 1.2  
**Content-Type:** `text/xml; charset=utf-8`

## Autenticación

Todos los endpoints requieren estas 4 credenciales en cada request:

| Campo           | Descripción                  | Ejemplo                                |
| --------------- | ---------------------------- | -------------------------------------- |
| `sCorpCode`     | Código de corporación        | `CDRH`                                 |
| `sLocationCode` | Código de sucursal           | `L012`                                 |
| `sCorpUserName` | Usuario con formato especial | `NombreUsuario:::MEGACENTER9J348FCJ3U` |
| `sCorpPassword` | Contraseña                   | `****`                                 |

---

## Arquitectura de Endpoints

```
CACHE (cada 15 min)
├── UnitTypePriceList_v2        → Tipos de unidades y precios
├── DiscountPlansRetrieve       → Promociones disponibles
└── InsuranceCoverageRetrieve   → Opciones de seguro

UNITS (consulta de unidades)
├── UnitsInformation_v2                    → Todas las unidades (disponibles + ocupadas)
├── UnitsInformation_v3                    → Todas + opción de incluir excluidas de web
└── UnitsInformationAvailableUnitsOnly_v2  → Solo disponibles

TENANTS (clientes)
├── TenantNewDetailed_v2        → Crear nuevo tenant
└── TenantListDetailed          → Buscar tenants existentes

LEDGERS (arriendos)
└── LedgersByTenantID           → Arriendos de un tenant

RESERVATION (sin pago inmediato)
└── ReservationNewWithSource_v5  → Crear reservación con tracking

MOVE-IN FLOW (tiempo real)
├── MoveInCostRetrieveWithDiscount_v2      → Calcular costo
├── MoveInWithDiscount_v4                   → Ejecutar move-in
└── TenantBillingInfoUpdate_v2              → (opcional) Config autopago

E-SIGN (firma electrónica)
└── SiteLinkeSignCreateLeaseURL_v2  → Generar URL de firma
```

---

## Endpoints de Cache

### UnitTypePriceList_v2

Genera lista de precios para todos los tipos de unidades. Incluye información estándar del tipo, la primera unidad disponible de cada tipo, admin fee, reservation fee, y si el tipo es interior.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/UnitTypePriceList_v2`

**Parámetros:** Solo autenticación

**Request:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <UnitTypePriceList_v2 xmlns="http://tempuri.org/CallCenterWs/CallCenterWs">
      <sCorpCode>CDRH</sCorpCode>
      <sLocationCode>L012</sLocationCode>
      <sCorpUserName>Usuario:::MEGACENTER9J348FCJ3U</sCorpUserName>
      <sCorpPassword>****</sCorpPassword>
    </UnitTypePriceList_v2>
  </soap12:Body>
</soap12:Envelope>
```

**Response:** DataSet con dos tablas: "Table" y "RT"

**Tabla "Table"** (múltiples rows, una por tipo de unidad):

| #   | Tipo    | Campo                    | Descripción                                                           |
| --- | ------- | ------------------------ | --------------------------------------------------------------------- |
| 1   | Integer | SiteID                   | Site ID                                                               |
| 2   | Integer | iCurrencyDecimals        | Decimales para redondeo de cargos                                     |
| 3   | Integer | iTaxDecimals             | Decimales para redondeo de impuestos                                  |
| 4   | Decimal | dcTax1Rate_Rent          | Tasa de impuesto 1 para renta                                         |
| 5   | Decimal | dcTax2Rate_Rent          | Tasa de impuesto 2 para renta                                         |
| 6   | Integer | iRegionalOptions         | N/A                                                                   |
| 7   | Integer | UnitTypeID               | **ID del tipo de unidad**                                             |
| 8   | String  | sTypeName                | Nombre del tipo (ej: "Self Storage", "Parking")                       |
| 9   | Boolean | bChargeTax1              | ¿Cobra impuesto 1?                                                    |
| 10  | Boolean | bChargeTax2              | ¿Cobra impuesto 2?                                                    |
| 11  | Integer | iDefLeaseNum             | N/A                                                                   |
| 12  | Boolean | bMobile                  | ¿Tipo designado para móvil?                                           |
| 13  | Boolean | bClimate                 | ¿Tiene control de clima?                                              |
| 14  | Boolean | bPower                   | ¿Tiene electricidad?                                                  |
| 15  | Boolean | bAlarm                   | ¿Tiene alarma?                                                        |
| 16  | Boolean | bInside                  | ¿Es interior?                                                         |
| 17  | Integer | iFloor                   | Piso donde está el tipo                                               |
| 18  | Decimal | dcWidth                  | Ancho de la unidad                                                    |
| 19  | Decimal | dcLength                 | Largo de la unidad                                                    |
| 20  | Decimal | dcArea                   | Área total del tipo                                                   |
| 21  | Decimal | dcPushRate_NotRounded    | N/A para este API                                                     |
| 22  | Decimal | dcPushRate               | N/A para este API                                                     |
| 23  | Decimal | dcStdRate                | **Tarifa estándar mensual**                                           |
| 24  | Decimal | dcStdWeeklyRate          | Tarifa estándar semanal                                               |
| 25  | Integer | iTotalUnits              | Total de unidades de este tipo                                        |
| 26  | Integer | iTotalOccupied           | Unidades ocupadas de este tipo                                        |
| 27  | Integer | iTotalVacant             | **Unidades disponibles de este tipo**                                 |
| 28  | Integer | iTotalReserved           | Unidades reservadas de este tipo                                      |
| 29  | Integer | UnitID_FirstAvailable    | **UnitID de la primera unidad disponible**                            |
| 30  | String  | sUnitName_FirstAvailable | Nombre de la primera unidad disponible                                |
| 31  | String  | sUnitDesc_FirstAvailable | Descripción de la primera unidad disponible                           |
| 32  | Integer | UnitID_Representative    | UnitID de la unidad representativa del tipo                           |
| 33  | String  | sUnitName_Representative | Nombre de la unidad representativa                                    |
| 34  | String  | sUnitDesc_Representative | Descripción de la unidad representativa                               |
| 35  | Decimal | dcAdminFee               | **Fee de administración**                                             |
| 36  | Decimal | dcReservationFee         | **Fee de reservación**                                                |
| 37  | Boolean | bRented_FirstAvailable   | True si la primera disponible ya está rentada                         |
| 38  | Boolean | bExcludeFromInsurance    | ¿Excluido de seguro?                                                  |
| 39  | Integer | ConcessionID             | ID del mejor descuento disponible (vincula con DiscountPlansRetrieve) |
| 40  | Decimal | dcWebRate                | **Tarifa web**                                                        |
| 41  | Decimal | dcBoardRate              | Tarifa de tablero                                                     |
| 42  | Decimal | dcPreferredRate          | **Tarifa preferida**                                                  |
| 43  | Integer | iPreferredChannelType    | Canal que corresponde a la tarifa preferida                           |
| 44  | Boolean | bPreferredIsPushRate     | ¿La tarifa preferida es push rate?                                    |

**Tabla "RT"** (una row):

| Tipo    | Campo    | Descripción                   |
| ------- | -------- | ----------------------------- |
| Integer | Ret_Code | Código de retorno (1 = éxito) |

**En caso de error**, RT contiene:

| Tipo    | Campo    | Descripción                                |
| ------- | -------- | ------------------------------------------ |
| Integer | Ret_Code | Código de error (ver sección 7 del manual) |
| String  | Ret_Msg  | Mensaje describiendo el error              |

---

### DiscountPlansRetrieve

Retorna los planes de descuento disponibles. La tabla `ConcessionPlans` tiene toda la data de descuentos. La tabla `ConcessionUnitTypes` determina restricciones por tipo de unidad.

**Regla importante:** Si NO hay registros en `ConcessionUnitTypes` para un `ConcessionID`, ese plan aplica a TODOS los tipos y tamaños. Si hay 1+ registros, el plan SOLO aplica a esos tipos/tamaños específicos.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/DiscountPlansRetrieve`

**Parámetros:** Solo autenticación

**Response:** DataSet con tres tablas: "RT", "ConcessionPlans", "ConcessionUnitTypes"

**Tabla "ConcessionPlans"** (una row por plan de descuento):

| #   | Tipo     | Campo                | Descripción                                                                                                                 |
| --- | -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Integer  | ConcessionID         | **ID del plan de descuento**                                                                                                |
| 2   | Integer  | SiteID               | Site ID                                                                                                                     |
| 3   | Integer  | QTTouchDiscPlanID    | QT Touch Discount Plan ID                                                                                                   |
| 4   | Integer  | iConcessionGlobalNum | Número global del plan                                                                                                      |
| 5   | String   | sPlanName            | **Nombre del plan**                                                                                                         |
| 7   | String   | sDescription         | Descripción del plan                                                                                                        |
| 8   | String   | sComment             | Comentario del plan                                                                                                         |
| 9   | Integer  | iShowOn              | Dónde se muestra: 0=Todas, 1=Solo Move-ins, 2=Solo Pagos                                                                    |
| 10  | Boolean  | bNeverExpires        | True si nunca expira                                                                                                        |
| 11  | Integer  | iExpirMonths         | Meses hasta que expira el descuento                                                                                         |
| 12  | Boolean  | bPrepay              | True si requiere prepago                                                                                                    |
| 13  | Boolean  | bOnPmt               | N/A                                                                                                                         |
| 14  | Boolean  | bManualCredit        | N/A                                                                                                                         |
| 15  | Integer  | iPrePaidMonths       | Meses de prepago requeridos                                                                                                 |
| 16  | Integer  | iInMonth             | Mes en que se aplica el descuento                                                                                           |
| 17  | Integer  | iAmtType             | **Tipo de descuento:** 0=Monto fijo (usar dcFixedDiscount), 1=Porcentaje (usar dcPCDiscount), 2=Tarifa fija (usar dcChgAmt) |
| 18  | Decimal  | dcChgAmt             | Precio fijo para el item                                                                                                    |
| 19  | Decimal  | dcFixedDiscount      | **Monto de descuento fijo**                                                                                                 |
| 20  | Decimal  | dcPCDiscount         | **Porcentaje de descuento**                                                                                                 |
| 21  | Boolean  | bRound               | True si el descuento se redondea                                                                                            |
| 22  | Decimal  | dcRoundTo            | Tipo de redondeo (ver código de ejemplo)                                                                                    |
| 23  | Integer  | ChargeDescID         | Charge Description ID                                                                                                       |
| 24  | Integer  | iQty                 | Cantidad asociada                                                                                                           |
| 25  | Integer  | iOfferItemAction     | N/A                                                                                                                         |
| 26  | Decimal  | dcMaxAmountOff       | **Máximo descuento que puede dar el plan**                                                                                  |
| 27  | Boolean  | bForCopr             | True para promociones corporativas                                                                                          |
| 28  | Decimal  | dcMaxOccPct          | N/A                                                                                                                         |
| 29  | Boolean  | bForAllUnits         | True si aplica a todas las unidades                                                                                         |
| 30  | Boolean  | bPermanent           | N/A                                                                                                                         |
| 31  | Datetime | dDisabled            | Si no es NULL, el descuento está deshabilitado                                                                              |
| 32  | String   | sDefChgDesc          | Descripción de cargo por defecto                                                                                            |
| 33  | String   | sChgDesc             | Descripción de cargo personalizada                                                                                          |
| 34  | String   | sChgCategory         | Categoría del cargo                                                                                                         |
| 35  | Boolean  | bApplyAtMoveIn       | **True si se aplica en move-in**                                                                                            |
| 36  | Boolean  | bProrateAtMoveIn     | True si se prorratea en move-in                                                                                             |
| 37  | Decimal  | dcPrice              | Precio del cargo                                                                                                            |
| 38  | Decimal  | dcTax1Rate           | Tasa impuesto 1                                                                                                             |
| 39  | Decimal  | dcTax2Rate           | Tasa impuesto 2                                                                                                             |
| 40  | Decimal  | dcCost               | POS - Costo del item                                                                                                        |
| 41  | Decimal  | dcInStock            | POS - Cantidad en stock                                                                                                     |
| 42  | Integer  | iAvailableAt         | **Disponibilidad por canal** (ver valores abajo)                                                                            |

**Valores de `iAvailableAt`:**

Si `iAvailableAt < 16` (valor único):

- 0 = Everywhere (todos)
- 1 = Client Only
- 2 = Website Only
- 3 = Kiosk Only
- 4 = Call Center And Corp Only
- 5 = SpareFoot Only

Si `iAvailableAt >= 16` (múltiples canales, usar bit mask):

- 16 = Client Bit Mask
- 32 = Website Bit Mask
- 64 = Kiosk Bit Mask
- 128 = Call Center And Corp Bit Mask
- 256 = SpareFoot Bit Mask

**Tabla "ConcessionUnitTypes"** (restricciones por tipo de unidad):

| #   | Tipo    | Campo                | Descripción                     |
| --- | ------- | -------------------- | ------------------------------- |
| 1   | Integer | ConcessionUnitTypeID | ID de la restricción            |
| 2   | Integer | ConcessionID         | ID del plan (FK)                |
| 3   | Boolean | UnitTypeID           | ID del tipo de unidad permitido |
| 4   | String  | dcWidth              | Ancho permitido                 |
| 5   | Integer | dcLength             | Largo permitido                 |

**Tabla "RT":**

- Éxito: `Ret_Code = 1`
- Error: `Ret_Code = -1` (General failure), `Ret_Msg` = mensaje

**Lógica de redondeo (código de ejemplo):**

```javascript
// dcRoundTo values:
// 0.0 = No redondear
// 0.1 = Redondear a 0.10
// 0.5 = Redondear a 0.50
// 1.0 = Redondear a 1.00
// 5.0 = Redondear a 5.00
// 10.0 = Redondear a 10.00
```

---

### InsuranceCoverageRetrieve

Obtiene los planes de seguro disponibles para el sitio.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/InsuranceCoverageRetrieve`

**Parámetros:** Solo autenticación

**Response:** DataSet con dos tablas: "RT" y "Table"

**Tabla "Table"** (una row por opción de seguro):

| #   | Tipo    | Campo           | Descripción                                |
| --- | ------- | --------------- | ------------------------------------------ |
| 1   | Integer | InsurCoverageID | **ID de la cobertura** (usar en MoveIn)    |
| 2   | Integer | SiteID          | Site ID de la instalación                  |
| 3   | Decimal | dcCoverage      | **Monto de cobertura** (ej: 2000, 5000)    |
| 4   | Decimal | dcPremium       | **Prima mensual** (lo que paga el cliente) |
| 5   | Decimal | dcPCTheft       | Porcentaje de cobertura por robo           |
| 6   | String  | sCoverageDesc   | **Descripción de la cobertura**            |
| 7   | String  | sProvidor       | Nombre del proveedor de seguro             |

**Tabla "RT":**

- Éxito: `Ret_Code = 1`
- Error: `Ret_Code` = código de error, `Ret_Msg` = mensaje

---

## Endpoints de Units (Consulta de Unidades)

### UnitsInformationByUnitID

Obtiene información detallada de una unidad específica por su ID. Retorna todos los datos de la unidad incluyendo pricing, características, ubicación y datos del tipo de unidad.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/UnitsInformationByUnitID`

**Parámetros adicionales:**

| Campo    | Tipo    | Requerido | Descripción              |
| -------- | ------- | --------- | ------------------------ |
| `UnitID` | Integer | Sí        | ID de la unidad a buscar |

**Request:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <UnitsInformationByUnitID xmlns="http://tempuri.org/CallCenterWs/CallCenterWs">
      <sCorpCode>CDRH</sCorpCode>
      <sLocationCode>L012</sLocationCode>
      <sCorpUserName>Andres Schilkrut:::MEGACENTER9J348FCJ3U</sCorpUserName>
      <sCorpPassword>Laperla16699@@</sCorpPassword>
      <UnitID>79081</UnitID>
    </UnitsInformationByUnitID>
  </soap12:Body>
</soap12:Envelope>
```

**Response:** DataSet con dos tablas: "Table" y "RT"

**Tabla "Table"** (una row con la información completa de la unidad):

| Campo                     | Tipo     | Descripción                                             |
| ------------------------- | -------- | ------------------------------------------------------- |
| `UnitID`                  | Integer  | **ID de la unidad**                                     |
| `SiteID`                  | Integer  | Site ID                                                 |
| `UnitTypeID`              | Integer  | ID del tipo de unidad                                   |
| `sUnitName`               | String   | **Nombre de la unidad** (ej: "2C05")                    |
| `sTypeName`               | String   | **Nombre del tipo** (ej: "Locker Unit")                 |
| `sUnitDesc`               | String   | Descripción de la unidad                                |
| `dcWidth`                 | Decimal  | Ancho en pies                                           |
| `dcLength`                | Decimal  | Largo en pies                                           |
| `bClimate`                | Boolean  | ¿Control de clima?                                      |
| `bInside`                 | Boolean  | ¿Es interior?                                           |
| `bPower`                  | Boolean  | ¿Tiene electricidad?                                    |
| `bAlarm`                  | Boolean  | ¿Tiene alarma?                                          |
| `bMobile`                 | Boolean  | ¿Es móvil?                                              |
| `bRentable`               | Boolean  | **¿Se puede rentar?**                                   |
| `bRented`                 | Boolean  | **¿Está rentada?**                                      |
| `bDamaged`                | Boolean  | ¿Está dañada?                                           |
| `bCorporate`              | Boolean  | ¿Es corporativa?                                        |
| `bExcludeFromWebsite`     | Boolean  | ¿Excluida del sitio web?                                |
| `bNotReadyToRent`         | Boolean  | ¿No lista para rentar?                                  |
| `iFloor`                  | Integer  | Número de piso                                          |
| `iWalkThruOrder`          | Integer  | Orden walk-through                                      |
| `iEntryLoc`               | Integer  | Tipo entrada (0-3)                                      |
| `iDoorType`               | Integer  | Tipo puerta (0-2)                                       |
| `dcPushRate`              | Decimal  | **Tarifa push**                                         |
| `dcStdRate`               | Decimal  | **Tarifa estándar mensual**                             |
| `dcStdWeeklyRate`         | Decimal  | Tarifa estándar semanal                                 |
| `dcBoardRate`             | Decimal  | Tarifa de tablero                                       |
| `dcWebRate`               | Decimal  | **Tarifa web**                                          |
| `dcPreferredRate`         | Decimal  | Tarifa preferida                                        |
| `iPreferredChannelType`   | Integer  | Canal de tarifa preferida                               |
| `bPreferredIsPushRate`    | Boolean  | ¿Preferida es push rate?                                |
| `dcStdSecDep`             | Decimal  | Depósito de seguridad estándar                          |
| `dcStdLateFee`            | Decimal  | Tarifa de mora estándar                                 |
| `dcSchedRateMonthly`      | Decimal  | Tarifa mensual programada                               |
| `dcSchedRateWeekly`       | Decimal  | Tarifa semanal programada                               |
| `bChargeTax1`             | Boolean  | ¿Cobra impuesto 1?                                      |
| `bChargeTax2`             | Boolean  | ¿Cobra impuesto 2?                                      |
| `dcMapTop`                | Decimal  | Posición top en mapa                                    |
| `dcMapLeft`               | Decimal  | Posición left en mapa                                   |
| `dcMapTheta`              | Decimal  | Rotación en mapa                                        |
| `bMapReversWL`            | Boolean  | Revertir ancho/largo en mapa                            |
| `sTrackingCode`           | String   | Código de tracking                                      |
| `sRFID`                   | String   | RFID                                                    |
| `sGlobalUnitName`         | String   | Nombre global de unidad                                 |
| `sUnitNote`               | String   | Notas de la unidad                                      |
| `dUnitNote`               | DateTime | Fecha de la nota                                        |
| `dCreated`                | DateTime | Fecha creación                                          |
| `dUpdated`                | DateTime | Fecha actualización                                     |
| `dDeleted`                | DateTime | Fecha eliminación                                       |
| `dBuilt`                  | DateTime | Fecha construcción                                      |
| `dFirstInService`         | DateTime | Primera fecha en servicio                               |
| `dDamaged`                | DateTime | Fecha de daño                                           |
| _Campos de Unit Type_     |          |                                                         |
| `sDefTypeName`            | String   | Nombre default del tipo                                 |
| `sCategory`               | String   | Categoría                                               |
| `iDefLeaseNum`            | Integer  | Número de lease default                                 |
| `bExcludeFromInsurance`   | Boolean  | ¿Excluido de seguro?                                    |
| `bShowOnReservations`     | Boolean  | ¿Mostrar en reservaciones?                              |
| `iVacateNoticeDays`       | Integer  | Días de aviso para desocupar                            |
| `iInsuranceRequired`      | Integer  | Nivel de seguro requerido                               |
| `BillingFreqID_Default`   | Integer  | ID de frecuencia de cobro default                       |
| `DefaultCoverageID`       | Integer  | ID de cobertura default                                 |
| `bWaitingListReserved`    | Boolean  | ¿Reservada en waiting list?                             |

**Tabla "RT":**

- Éxito: `Ret_Code = 1`
- Error: `Ret_Code` = código de error, `Ret_Msg` = mensaje

**Caso de uso:** Obtener toda la información de una unidad específica para mostrar detalles completos al usuario o para verificar disponibilidad y pricing de una unidad en particular.

---

### UnitsInformation_v2

Obtiene información de TODAS las unidades (disponibles y ocupadas). Usa polling incremental para reducir bandwidth.

**Recomendación SiteLink:** Cache local que refresca cada 15 minutos. Limpiar cache cada noche para asegurar data fresca.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/UnitsInformation_v2`

**Parámetros adicionales:**

| Campo               | Tipo | Requerido | Descripción                                                                                                                          |
| ------------------- | ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `lngLastTimePolled` | Long | Sí        | Ticks del último poll. Usar valor > 1 mes atrás para obtener todas. Guardar `lngLastTimePolled` del response para siguiente llamada. |

**Request:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <UnitsInformation_v2 xmlns="http://tempuri.org/CallCenterWs/CallCenterWs">
      <sCorpCode>CDRH</sCorpCode>
      <sLocationCode>L012</sLocationCode>
      <sCorpUserName>Usuario:::MEGACENTER9J348FCJ3U</sCorpUserName>
      <sCorpPassword>****</sCorpPassword>
      <lngLastTimePolled>0</lngLastTimePolled>
    </UnitsInformation_v2>
  </soap12:Body>
</soap12:Envelope>
```

**Response:** DataSet con dos tablas: "Table" y "Table1"

**Tabla "Table"** (una row por unidad):

| #   | Tipo    | Campo                 | Descripción                                                                    |
| --- | ------- | --------------------- | ------------------------------------------------------------------------------ |
| 1   | Integer | Ret_Code              | Código retorno (1=éxito)                                                       |
| 2   | Integer | UnitTypeID            | N/A                                                                            |
| 3   | String  | sTypeName             | Tipo de unidad (Self Storage, Parking, etc.)                                   |
| 4   | Integer | iDefLeaseNum          | N/A                                                                            |
| 5   | Integer | UnitID                | **ID de la unidad**                                                            |
| 6   | String  | sUnitName             | **Nombre de la unidad** (ej: U123)                                             |
| 7   | Decimal | dcWidth               | Ancho                                                                          |
| 8   | Decimal | dcLength              | Largo                                                                          |
| 9   | Boolean | bClimate              | ¿Control de clima?                                                             |
| 10  | Decimal | dcStdRate             | **Tarifa estándar**                                                            |
| 11  | Boolean | bRented               | **True si está rentada**                                                       |
| 12  | Boolean | bInside               | ¿Es interior?                                                                  |
| 13  | Boolean | bPower                | ¿Tiene electricidad?                                                           |
| 14  | Boolean | bAlarm                | ¿Tiene alarma?                                                                 |
| 15  | Integer | iFloor                | Piso                                                                           |
| 16  | Boolean | bWaitingListReserved  | **True si está reservada**                                                     |
| 17  | Date    | dMovedOut             | Última fecha de move-out                                                       |
| 18  | Boolean | bCorporate            | ¿Es unidad corporativa?                                                        |
| 19  | Boolean | bRentable             | **True si se puede rentar**                                                    |
| 20  | Date    | dDeleted              | Fecha de eliminación (null si activa)                                          |
| 21  | Decimal | dcBoardRate           | Tarifa de tablero                                                              |
| 22  | String  | sUnitNote             | Nota de la unidad                                                              |
| 23  | Decimal | dcPushRate            | Tarifa push                                                                    |
| 24  | Decimal | dcTax1Rate            | Tasa impuesto 1                                                                |
| 25  | Decimal | dcTax2Rate            | Tasa impuesto 2                                                                |
| 26  | String  | sUnitDesc             | Descripción de la unidad                                                       |
| 27  | Decimal | dcMapTop              | N/A (para mapas)                                                               |
| 28  | Decimal | dcMapLeft             | N/A (para mapas)                                                               |
| 29  | Decimal | dcMapTheta            | N/A (para mapas)                                                               |
| 30  | Boolean | bMapReversWL          | N/A                                                                            |
| 31  | Integer | iEntryLoc             | **Ubicación entrada:** 0=Undefined, 1=Exterior, 2=Interior Hallway, 3=Elevator |
| 32  | Integer | iDoorType             | **Tipo puerta:** 0=Undefined, 1=Rollup, 2=Swing                                |
| 33  | Integer | iADA                  | 1 si acceso discapacidad                                                       |
| 34  | Decimal | dcStdSecDep           | Depósito de seguridad estándar                                                 |
| 35  | Boolean | bMobile               | ¿Es portable?                                                                  |
| 36  | Decimal | dcPreferredRate       | Tarifa preferida                                                               |
| 37  | Integer | iPreferredChannelType | Canal de tarifa preferida                                                      |
| 38  | Boolean | bPreferredIsPushRate  | ¿Preferida es push rate?                                                       |

**Tabla "Table1"** (una row - metadata del poll):

| Tipo     | Campo             | Descripción                                   |
| -------- | ----------------- | --------------------------------------------- |
| DateTime | dLatestUpdated    | Última vez que se actualizó una unidad        |
| Long     | lngLastTimePolled | **Guardar este valor para el siguiente poll** |

**En caso de error**, tabla "RT":

| Tipo    | Campo    | Descripción                              |
| ------- | -------- | ---------------------------------------- |
| Integer | Ret_Code | 0=No unit data found, -1=General failure |
| String  | Ret_Msg  | Mensaje de error                         |

**Diferencia con AvailableUnitsOnly:** Este endpoint retorna TODAS las unidades incluyendo las ocupadas (`bRented=true`), útil para mostrar un mapa completo de la instalación.

---

### UnitsInformation_v3

Igual que v2 pero con opción de incluir unidades excluidas del sitio web. Agrega campo `dcWebRate`.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/UnitsInformation_v3`

**Parámetros adicionales:**

| Campo                             | Tipo    | Requerido | Descripción                                                       |
| --------------------------------- | ------- | --------- | ----------------------------------------------------------------- |
| `lngLastTimePolled`               | Long    | Sí        | Ticks del último poll. Usar valor antiguo para obtener todas.     |
| `bReturnExcludedFromWebsiteUnits` | Boolean | Sí        | Si `true`, incluye unidades marcadas como excluidas del sitio web |

**Request:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <UnitsInformation_v3 xmlns="http://tempuri.org/CallCenterWs/CallCenterWs">
      <sCorpCode>CDRH</sCorpCode>
      <sLocationCode>L012</sLocationCode>
      <sCorpUserName>Usuario:::MEGACENTER9J348FCJ3U</sCorpUserName>
      <sCorpPassword>****</sCorpPassword>
      <lngLastTimePolled>0</lngLastTimePolled>
      <bReturnExcludedFromWebsiteUnits>false</bReturnExcludedFromWebsiteUnits>
    </UnitsInformation_v3>
  </soap12:Body>
</soap12:Envelope>
```

**Response:** DataSet con dos tablas: "Table" y "Table1"

**Tabla "Table"** (una row por unidad):

| #   | Tipo    | Campo                 | Descripción                                                      |
| --- | ------- | --------------------- | ---------------------------------------------------------------- |
| 1   | Integer | Ret_Code              | Código retorno (1=éxito)                                         |
| 2   | Integer | UnitTypeID            | N/A                                                              |
| 3   | String  | sTypeName             | Tipo de unidad                                                   |
| 4   | Integer | iDefLeaseNum          | N/A                                                              |
| 5   | Integer | UnitID                | **ID de la unidad**                                              |
| 6   | String  | sUnitName             | **Nombre de la unidad**                                          |
| 7   | Decimal | dcWidth               | Ancho                                                            |
| 8   | Decimal | dcLength              | Largo                                                            |
| 9   | Boolean | bClimate              | ¿Control de clima?                                               |
| 10  | Decimal | dcStdRate             | **Tarifa estándar**                                              |
| 11  | Boolean | bRented               | **True si está rentada**                                         |
| 12  | Boolean | bInside               | ¿Es interior?                                                    |
| 13  | Boolean | bPower                | ¿Tiene electricidad?                                             |
| 14  | Boolean | bAlarm                | ¿Tiene alarma?                                                   |
| 15  | Integer | iFloor                | Piso                                                             |
| 16  | Boolean | bWaitingListReserved  | **True si está reservada**                                       |
| 17  | Date    | dMovedOut             | Última fecha de move-out                                         |
| 18  | Boolean | bCorporate            | ¿Es unidad corporativa?                                          |
| 19  | Boolean | bRentable             | **True si se puede rentar**                                      |
| 20  | Date    | dDeleted              | Fecha eliminación                                                |
| 21  | Decimal | dcBoardRate           | Tarifa de tablero                                                |
| 22  | String  | sUnitNote             | Nota de la unidad                                                |
| 23  | Decimal | dcPushRate            | Tarifa push                                                      |
| 24  | Decimal | dcTax1Rate            | Tasa impuesto 1                                                  |
| 25  | Decimal | dcTax2Rate            | Tasa impuesto 2                                                  |
| 26  | String  | sUnitDesc             | Descripción de la unidad                                         |
| 27  | Decimal | dcMapTop              | N/A                                                              |
| 28  | Decimal | dcMapLeft             | N/A                                                              |
| 29  | Decimal | dcMapTheta            | N/A                                                              |
| 30  | Boolean | bMapReversWL          | N/A                                                              |
| 31  | Integer | iEntryLoc             | Entrada: 0=Undefined, 1=Exterior, 2=Interior Hallway, 3=Elevator |
| 32  | Integer | iDoorType             | Puerta: 0=Undefined, 1=Rollup, 2=Swing                           |
| 33  | Integer | iADA                  | 1 si acceso discapacidad                                         |
| 34  | Decimal | dcStdSecDep           | Depósito de seguridad                                            |
| 35  | Boolean | bMobile               | ¿Es portable?                                                    |
| 36  | Decimal | dcWebRate             | **Tarifa web** (nuevo en v3)                                     |
| 37  | Decimal | dcPreferredRate       | Tarifa preferida                                                 |
| 38  | Integer | iPreferredChannelType | Canal de tarifa preferida                                        |
| 39  | Boolean | bPreferredIsPushRate  | ¿Preferida es push rate?                                         |

**Tabla "Table1"** (metadata del poll):

| Tipo     | Campo             | Descripción                     |
| -------- | ----------------- | ------------------------------- |
| DateTime | dLatestUpdated    | Última actualización            |
| Long     | lngLastTimePolled | **Guardar para siguiente poll** |

**Error (tabla "RT"):** `Ret_Code` = 0 (no data) o -1 (failure), `Ret_Msg` = mensaje

**Diferencia con v2:** Agrega `bReturnExcludedFromWebsiteUnits` en params y `dcWebRate` en response.

---

## Endpoints de Tenants (Clientes)

### TenantListDetailed (v3)

Busca tenants por múltiples criterios. Búsqueda fuzzy - "Jo Smi" encuentra "John Smith". Si no se pasa location code, busca en todos los sites del corp code.

**Límite:** Máximo 50 tenants por búsqueda.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/TenantListDetailed_v3`

**Parámetros de búsqueda (todos opcionales, actúan como filtros):**

| #   | Tipo   | Campo            | Descripción                             |
| --- | ------ | ---------------- | --------------------------------------- |
| 1   | String | sCorpCode        | Corp code (requerido)                   |
| 2   | String | sLocationCode    | Location code (vacío = todos los sites) |
| 3-4 | String | Auth             | Usuario y password                      |
| 5   | String | sTenantFirstName | Filtro por nombre                       |
| 6   | String | sTenantLastName  | Filtro por apellido                     |
| 7   | String | sAddressLine1    | Filtro por dirección 1                  |
| 8   | String | sAddressLine2    | Filtro por dirección 2                  |
| 9   | String | sCity            | Filtro por ciudad                       |
| 10  | String | sState           | Filtro por estado/región                |
| 11  | String | sZipCode         | Filtro por código postal                |
| 12  | String | sEmailAddress    | Filtro por email                        |
| 13  | String | sPhoneNumber     | Filtro por teléfono                     |
| 14  | String | sCompanyName     | Filtro por empresa                      |
| 15  | String | sUnitName        | Filtro por nombre de unidad             |
| 16  | String | sAccessCode      | Filtro por código acceso                |
| 17  | String | sBPayCRN         | Filtro por BPay CRN                     |

**Response:** DataSet con tabla "Table"

**Tabla "Table"** (una row por tenant encontrado, máx 50):

| #   | Tipo    | Campo                | Descripción                       |
| --- | ------- | -------------------- | --------------------------------- |
| 1   | Integer | SiteID               | Site ID                           |
| 2   | Integer | **TenantID**         | **ID del tenant**                 |
| 3   | String  | sLocationCode        | Código de ubicación               |
| 4   | String  | sFName               | Nombre                            |
| 5   | String  | sMI                  | Inicial                           |
| 6   | String  | sLName               | Apellido                          |
| 7   | String  | sCompany             | Empresa                           |
| 8   | String  | sAddr1               | Dirección 1                       |
| 9   | String  | sAddr2               | Dirección 2                       |
| 10  | String  | sCity                | Ciudad                            |
| 11  | String  | sRegion              | Estado/Región                     |
| 12  | String  | sPostalCode          | Código postal                     |
| 13  | String  | sPhone               | Teléfono                          |
| 14  | String  | sEmail               | Email                             |
| 15  | String  | sMobile              | Celular                           |
| 16  | String  | sLicense             | Licencia                          |
| 17  | String  | sAccessCode          | Código acceso                     |
| 18  | Boolean | **bHasActiveLedger** | **True si tiene arriendo activo** |

**Error (tabla "RT"):** `Ret_Code = -1` (Failed to get data), `Ret_Msg` = mensaje

**Caso de uso:** Buscar si un cliente ya existe antes de crear uno nuevo, evitando duplicados. Usar `bHasActiveLedger` para saber si tiene arriendo vigente.

---

## Endpoints de Ledgers (Arriendos)

### LedgersByTenantID

Obtiene todos los arriendos (ledgers) de un tenant. Incluye info completa del tenant + datos de cada ledger.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/LedgersByTenantID`

**Parámetros adicionales:**

| Campo       | Tipo   | Requerido | Descripción   |
| ----------- | ------ | --------- | ------------- |
| `sTenantID` | String | Sí        | ID del tenant |

**Response:** DataSet con tabla "Ledgers"

**Tabla "Ledgers"** (una row por ledger/arriendo, 81 campos):

**Info del Tenant (campos 1-57):**

| #     | Tipo    | Campo            | Descripción                                                   |
| ----- | ------- | ---------------- | ------------------------------------------------------------- |
| 1     | Integer | TenantID         | ID del tenant                                                 |
| 2     | Integer | SiteID           | Site ID                                                       |
| 3     | Integer | EmployeeID       | N/A                                                           |
| 4     | String  | sAccessCode      | Código acceso/gate                                            |
| 5     | String  | sWebPassword     | Password web                                                  |
| 6     | String  | sMrMrs           | Prefijo                                                       |
| 7     | String  | sFName           | Nombre                                                        |
| 8     | String  | sMI              | Inicial                                                       |
| 9     | String  | sLName           | Apellido                                                      |
| 10    | String  | sCompany         | Empresa                                                       |
| 11-17 | String  | Dirección        | sAddr1, sAddr2, sCity, sRegion, sPostalCode, sCountry, sPhone |
| 18-28 | String  | Alt Contact      | Contacto alternativo                                          |
| 29-40 | String  | Bus Contact      | Contacto business                                             |
| 41-44 | String  | Otros            | sFax, sEmail, sPager, sMobile                                 |
| 45    | Boolean | bCommercial      | ¿Comercial?                                                   |
| 46    | Boolean | bTaxExempt       | ¿Exento impuestos?                                            |
| 47    | Boolean | bSpecial         | N/A                                                           |
| 48    | Boolean | bNeverLockOut    | N/A                                                           |
| 49    | Boolean | bCompanyIsTenant | ¿Empresa es tenant?                                           |
| 50    | Boolean | bOnWaitingList   | ¿En waiting list?                                             |
| 51    | Boolean | bNoChecks        | ¿Tiene NSF?                                                   |
| 52    | Date    | dDOB             | Fecha nacimiento                                              |
| 53    | String  | sTenNote         | Notas                                                         |
| 54    | Integer | iPrimaryPic      | N/A                                                           |
| 55    | String  | sLicense         | Licencia                                                      |
| 56    | String  | sLicRegion       | Región licencia                                               |
| 57    | String  | sSSN             | SSN                                                           |
| 58-67 | Mixed   | N/A              | Campos internos                                               |

**Info del Ledger (campos 68-81):**

| #   | Tipo    | Campo               | Descripción                       |
| --- | ------- | ------------------- | --------------------------------- |
| 68  | Integer | **LedgerID**        | **ID del ledger/arriendo**        |
| 69  | Boolean | **bOverlocked**     | **True si unidad está bloqueada** |
| 70  | String  | **sUnitName**       | **Nombre de la unidad**           |
| 71  | Decimal | **dcChargeBalance** | **Balance de cargos pendientes**  |
| 72  | Date    | **dPaidThru**       | **Pagado hasta (fecha)**          |
| 73  | BigInt  | uTSbigint           | N/A                               |
| 74  | Decimal | **dcTotalDue**      | **Total adeudado**                |
| 75  | Integer | iLeaseNum           | Número de lease                   |
| 76  | Date    | **dMovedIn**        | **Fecha de move-in**              |
| 77  | Decimal | **dcRent**          | **Renta mensual**                 |
| 78  | String  | sBillingFrequency   | Frecuencia de cobro               |
| 79  | String  | TenantName          | Nombre completo                   |
| 80  | String  | Address             | Dirección completa                |
| 81  | String  | ContactInfo         | Info de contacto                  |

**Error (tabla "RT"):** `Ret_Code = -1` (Invalid tenant ID), `Ret_Msg` = mensaje

**Caso de uso:** Ver historial de arriendos, verificar balances, saber si tiene deuda pendiente.

---

## Endpoints de E-Sign (Firma Electrónica)

### SiteLinkeSignCreateLeaseURL_v2

Genera URL para firma electrónica del contrato. **Llamar después del move-in** usando el LedgerID retornado.

**Requisito:** El Lease en SiteLink debe tener el keyword `ESign.Signature1` configurado.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/SiteLinkeSignCreateLeaseURL_v2`

**Parámetros:**

| #   | Tipo    | Campo          | Descripción                                                 |
| --- | ------- | -------------- | ----------------------------------------------------------- |
| 1-4 | String  | Auth           | Credenciales                                                |
| 5   | Integer | **iTenantID**  | **ID del tenant**                                           |
| 6   | Integer | **iLedgerID**  | **ID del ledger** (de MoveInWithDiscount_v4)                |
| 7   | String  | **sFormIDs**   | **FormIDs separados por coma** (de FormsRetrieve, opcional) |
| 8   | String  | **sReturnUrl** | **URL de retorno** después de firmar                        |

**Response:** DataSet con tabla "RT"

**Éxito:**

| Tipo    | Campo        | Descripción                  |
| ------- | ------------ | ---------------------------- |
| Integer | Ret_Code     | 1 = Success                  |
| String  | **EsignUrl** | **URL de firma electrónica** |

**Códigos de error:**

| Código | Descripción                                  |
| ------ | -------------------------------------------- |
| -2     | Lease does not have ESign.Signature1 keyword |
| -24    | Invalid Ledger ID                            |
| -95    | Invalid Tenant ID                            |

**Flujo típico:**

```
1. MoveInWithDiscount_v4 → LedgerID
2. SiteLinkeSignCreateLeaseURL_v2 → EsignUrl
3. Redirigir tenant a EsignUrl
4. Tenant firma → redirigido a sReturnUrl
```

**Nota:** El typo "SiteLinkeSig**n**" (con 'e' extra) es del API original.

---

## Endpoints de Reservaciones

### ReservationNewWithSource_v5

Crea una reservación para un tenant existente. Incluye tracking de fuente, tipo de inquiry, fechas de expiración/follow-up, y ConcessionID para descuentos.

**Requisito:** El tenant debe existir previamente (crear con TenantNewDetailed_v2).

**Nota:** El tenant se coloca en la Waiting List de SiteLink y NO aparece en el bulletin board.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/ReservationNewWithSource_v5`

**Parámetros:**

| #   | Tipo    | DBNull  | Campo              | Descripción                                                    |
| --- | ------- | ------- | ------------------ | -------------------------------------------------------------- |
| 1-4 | String  | N/A     | Auth               | Credenciales                                                   |
| 5   | String  | N/A     | **sTenantID**      | **ID del tenant** (requerido)                                  |
| 6   | String  | N/A     | **sUnitID**        | **ID unidad 1** (requerido)                                    |
| 7   | String  | ""      | sUnitID2           | ID unidad 2 (opcional)                                         |
| 8   | String  | ""      | sUnitID3           | ID unidad 3 (opcional)                                         |
| 9   | Date    | N/A     | **dNeeded**        | **Fecha que necesita la unidad**                               |
| 10  | String  | ""      | sComment           | Nota/comentario de la reservación                              |
| 11  | Integer | N/A     | **iSource**        | **Fuente (código):** 1=Call Center, 5=Website                  |
| 12  | String  | ""      | sSource            | Fuente (texto libre)                                           |
| 13  | Integer | N/A     | **QTRentalTypeID** | **Tipo:** 1=Quote (Inquiry), 2=Order (Reservation)             |
| 14  | Integer | N/A     | **iInquiryType**   | **Tipo inquiry:** 0=Unknown, 1=Email, 2=Web, 3=Phone, 4=WalkIn |
| 15  | Decimal | Nothing | dcQuotedRate       | Tarifa cotizada                                                |
| 16  | Date    | Nothing | dExpires           | Fecha expiración de la reserva                                 |
| 17  | Date    | Nothing | dFollowUp          | Fecha de follow-up                                             |
| 18  | String  | ""      | sTrackingCode      | Código tracking (UTM, etc.)                                    |
| 19  | String  | ""      | sCallerID          | ID del llamante                                                |
| 20  | Integer | -999    | ConcessionID       | ID del descuento (-999 = ninguno)                              |

**Response:** DataSet con tabla "RT"

**Éxito:**

| Tipo    | Campo    | Descripción                         |
| ------- | -------- | ----------------------------------- |
| Integer | Ret_Code | **WaitingListID** (número positivo) |
| String  | Ret_Msg  | iGlobalWaitingNum                   |

**Códigos de error:**

| Código | Descripción                   |
| ------ | ----------------------------- |
| -1     | Unable to connect to database |
| -2     | Error in saving Reservation   |
| -3     | Invalid concession plan ID    |
| -25    | Invalid UnitID                |
| -26    | Error getting rent tax rates  |
| -95    | Invalid TenantID              |

**IMPORTANTE:** Guardar el `WaitingListID` retornado para:

1. Agregar fee de reservación con `ReservationFeeAdd`
2. Convertir a move-in pasando `WaitingID` a `MoveInWithDiscount_v4`

---

## Endpoints de Move-In (Tiempo Real)

### UnitsInformationAvailableUnitsOnly_v2

Obtiene solo unidades **disponibles** para arriendo. Usa polling incremental.

**Nota importante:** Una unidad reservada en waiting list **SÍ aparece como disponible** en este endpoint.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/UnitsInformationAvailableUnitsOnly_v2`

**Parámetros adicionales:**

| Campo               | Tipo | Requerido | Descripción                                                   |
| ------------------- | ---- | --------- | ------------------------------------------------------------- |
| `lngLastTimePolled` | Long | Sí        | Ticks del último poll. Usar valor antiguo para obtener todas. |

**Request:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <UnitsInformationAvailableUnitsOnly_v2 xmlns="http://tempuri.org/CallCenterWs/CallCenterWs">
      <sCorpCode>CDRH</sCorpCode>
      <sLocationCode>L012</sLocationCode>
      <sCorpUserName>Usuario:::MEGACENTER9J348FCJ3U</sCorpUserName>
      <sCorpPassword>****</sCorpPassword>
      <lngLastTimePolled>0</lngLastTimePolled>
    </UnitsInformationAvailableUnitsOnly_v2>
  </soap12:Body>
</soap12:Envelope>
```

**Response:** DataSet con dos tablas: "Table" y "Table1"

**Tabla "Table"** (una row por unidad disponible):

| #   | Tipo    | Campo                 | Descripción                                                      |
| --- | ------- | --------------------- | ---------------------------------------------------------------- |
| 1   | Integer | Ret_Code              | Código retorno (1=éxito)                                         |
| 2   | Integer | UnitTypeID            | N/A                                                              |
| 3   | String  | sTypeName             | Tipo de unidad                                                   |
| 4   | Integer | iDefLeaseNum          | N/A                                                              |
| 5   | Integer | UnitID                | **ID de la unidad**                                              |
| 6   | String  | sUnitName             | **Nombre de la unidad** (ej: U123)                               |
| 7   | Decimal | dcWidth               | Ancho                                                            |
| 8   | Decimal | dcLength              | Largo                                                            |
| 9   | Boolean | bClimate              | ¿Control de clima?                                               |
| 10  | Decimal | dcStdRate             | **Tarifa estándar**                                              |
| 11  | Boolean | bRented               | True si rentada (siempre false aquí)                             |
| 12  | Boolean | bInside               | ¿Es interior?                                                    |
| 13  | Boolean | bPower                | ¿Tiene electricidad?                                             |
| 14  | Boolean | bAlarm                | ¿Tiene alarma?                                                   |
| 15  | Integer | iFloor                | Piso                                                             |
| 16  | Boolean | bWaitingListReserved  | **True si está reservada** (puede aparecer aquí!)                |
| 17  | Date    | dMovedOut             | Última fecha de move-out                                         |
| 18  | Boolean | bCorporate            | ¿Es unidad corporativa?                                          |
| 19  | Boolean | bRentable             | True si se puede rentar                                          |
| 20  | Date    | dDeleted              | Fecha eliminación                                                |
| 21  | Decimal | dcBoardRate           | Tarifa de tablero                                                |
| 22  | String  | sUnitNote             | Nota de la unidad                                                |
| 23  | Decimal | dcPushRate            | Tarifa push                                                      |
| 24  | Decimal | dcTax1Rate            | Tasa impuesto 1                                                  |
| 25  | Decimal | dcTax2Rate            | Tasa impuesto 2                                                  |
| 26  | String  | sUnitDesc             | Descripción                                                      |
| 27  | Decimal | dcMapTop              | N/A                                                              |
| 28  | Decimal | dcMapLeft             | N/A                                                              |
| 29  | Decimal | dcMapTheta            | N/A                                                              |
| 30  | Boolean | bMapReversWL          | N/A                                                              |
| 31  | Integer | iEntryLoc             | Entrada: 0=Undefined, 1=Exterior, 2=Interior Hallway, 3=Elevator |
| 32  | Integer | iDoorType             | Puerta: 0=Undefined, 1=Rollup, 2=Swing                           |
| 33  | Integer | iADA                  | 1 si acceso discapacidad                                         |
| 34  | Decimal | dcStdSecDep           | Depósito de seguridad                                            |
| 35  | Boolean | bMobile               | ¿Es portable?                                                    |
| 36  | Decimal | dcWebRate             | **Tarifa web**                                                   |
| 37  | Decimal | dcPreferredRate       | Tarifa preferida                                                 |
| 38  | Integer | iPreferredChannelType | Canal de tarifa preferida                                        |
| 39  | Boolean | bPreferredIsPushRate  | ¿Preferida es push rate?                                         |

**Tabla "Table1"** (metadata del poll):

| Tipo     | Campo             | Descripción                     |
| -------- | ----------------- | ------------------------------- |
| DateTime | dLatestUpdated    | Última actualización            |
| Long     | lngLastTimePolled | **Guardar para siguiente poll** |

**Error (tabla "RT"):** `Ret_Code` = 0 (no data) o -1 (failure), `Ret_Msg` = mensaje

---

### MoveInCostRetrieveWithDiscount_v2

Calcula el costo total de move-in para una unidad específica. **Llamar ANTES de MoveIn** para validar que el monto coincide.

Permite seleccionar canal de tarifa (StandardRate vs WebRate) para features como strike-through pricing.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/MoveInCostRetrieveWithDiscount_v2`

**Parámetros:**

| #   | Tipo    | Default | Campo               | Descripción                          |
| --- | ------- | ------- | ------------------- | ------------------------------------ |
| 1-4 | String  | N/A     | Auth                | Credenciales                         |
| 5   | Integer | N/A     | **iUnitID**         | **ID de la unidad**                  |
| 6   | Date    | N/A     | **dMoveInDate**     | **Fecha de move-in**                 |
| 7   | Integer | -999    | InsuranceCoverageID | ID seguro (-999 = sin seguro)        |
| 8   | Integer | -999    | ConcessionPlanID    | ID descuento (-999 = sin descuento)  |
| 9   | Integer | 0       | **ChannelType**     | **Canal:** 0=StandardRate, 1=WebRate |

**Response:** DataSet con tabla "Table" (múltiples rows, una por cargo)

**Tabla "Table"** (desglose de cargos):

| #     | Tipo    | Campo                 | Descripción                                                           |
| ----- | ------- | --------------------- | --------------------------------------------------------------------- |
| 1     | Integer | Ret_Code              | 1=éxito                                                               |
| 2     | Integer | UnitID                | ID de la unidad                                                       |
| 3     | String  | **ChargeDescription** | Tipo de cargo (Monthly Rent Fee, Administrative Fee, Insurance, etc.) |
| 4     | Decimal | **ChargeAmount**      | **Monto del cargo**                                                   |
| 5     | Decimal | **TaxAmount**         | **Impuesto del cargo**                                                |
| 6     | Date    | StartDate             | Fecha inicio del cargo                                                |
| 7     | Date    | EndDate               | Fecha fin del cargo                                                   |
| 8     | Integer | Width                 | Ancho unidad                                                          |
| 9     | Integer | Length                | Largo unidad                                                          |
| 10    | Boolean | bClimate              | ¿Clima controlado?                                                    |
| 11    | String  | UnitName              | Nombre unidad                                                         |
| 12    | String  | TypeName              | Tipo (Self Storage, RV Parking, etc.)                                 |
| 13    | Decimal | dcPushRate            | N/A                                                                   |
| 14    | Boolean | bAnnivDateLeasing     | ¿Lease con fecha aniversario?                                         |
| 15    | Boolean | b2ndMonthProrate      | N/A                                                                   |
| 16-18 | Integer | Prorate fields        | N/A                                                                   |
| 19    | Boolean | **bMoveInRequired**   | **True si cargo es requerido en move-in**                             |
| 20    | Decimal | **dcDiscount**        | **Monto descontado**                                                  |
| 21    | Decimal | **dcTotal**           | **Total del cargo (después de descuento)**                            |
| 22    | Integer | ConcessionID          | ID del descuento aplicado                                             |
| 23    | Decimal | dcTenantRate          | Tarifa estándar del tenant                                            |
| 24    | Decimal | WebRate               | Tarifa web                                                            |

**Cálculo del total a pagar:**

```javascript
const totalMoveIn = rows
  .filter((r) => r.bMoveInRequired)
  .reduce((sum, r) => sum + r.dcTotal + r.TaxAmount, 0);
```

**Códigos de error:**

| Código | Descripción                   |
| ------ | ----------------------------- |
| 0      | No data available             |
| -1     | General failure               |
| -2     | Invalid Concession Plan ID    |
| -3     | Invalid Insurance Coverage ID |
| -25    | Invalid Unit ID               |
| -29    | Invalid channel type          |

---

### TenantNewDetailed_v2

Crea un nuevo tenant/cliente con toda la información disponible. A diferencia de TenantNewDetailed, esta versión permite setear el código de acceso/gate directamente.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/TenantNewDetailed_v2`

**Parámetros (52 campos):**

| #     | Tipo    | DBNull  | Campo            | Descripción                          |
| ----- | ------- | ------- | ---------------- | ------------------------------------ |
| 1-4   | String  | N/A     | Auth             | Credenciales estándar                |
| 5     | String  | ""      | sWebPassword     | Password para pagos online           |
| 6     | String  | ""      | sMrMrs           | Prefijo (Mr., Mrs., Ms.)             |
| 7     | String  | N/A     | **sFName**       | **Nombre** (requerido)               |
| 8     | String  | ""      | sMI              | Inicial segundo nombre               |
| 9     | String  | N/A     | **sLName**       | **Apellido** (requerido)             |
| 10    | String  | ""      | sCompany         | Nombre empresa                       |
| 11    | String  | ""      | sAddr1           | Dirección línea 1                    |
| 12    | String  | ""      | sAddr2           | Dirección línea 2                    |
| 13    | String  | ""      | sCity            | Ciudad                               |
| 14    | String  | ""      | sRegion          | Estado/Región                        |
| 15    | String  | ""      | sPostalCode      | Código postal                        |
| 16    | String  | ""      | sCountry         | País                                 |
| 17    | String  | ""      | sPhone           | Teléfono                             |
| 18-28 | String  | ""      | \*Alt            | Contacto alternativo (mismos campos) |
| 29-40 | String  | ""      | \*Bus            | Contacto business (mismos campos)    |
| 41    | String  | ""      | sFax             | Fax                                  |
| 42    | String  | ""      | **sEmail**       | **Email**                            |
| 43    | String  | ""      | sPager           | Pager                                |
| 44    | String  | ""      | sMobile          | Celular                              |
| 45    | Boolean | N/A     | bCommercial      | ¿Es comercial?                       |
| 46    | Boolean | N/A     | bCompanyIsTenant | ¿Empresa es el tenant?               |
| 47    | Date    | Nothing | dDOB             | Fecha nacimiento                     |
| 48    | String  | ""      | sTenNote         | Notas del tenant                     |
| 49    | String  | ""      | sLicense         | Número licencia/RUT                  |
| 50    | String  | ""      | sLicRegion       | Región de licencia                   |
| 51    | String  | ""      | sSSN             | Social Security Number               |
| 52    | String  | N/A     | **sGateCode**    | **Código acceso gate**               |

**Response:** DataSet con dos tablas: "RT" y "Tenants"

**Tabla "RT"** (resultado):

| Tipo    | Campo        | Descripción               |
| ------- | ------------ | ------------------------- |
| Integer | Ret_Code     | 1=éxito                   |
| Integer | **TenantID** | **ID del tenant creado**  |
| String  | AccessCode   | Código de acceso generado |

**Tabla "Tenants"** (datos del tenant creado, 67 campos):

| #     | Tipo    | Campo              | Descripción                                                                                          |
| ----- | ------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| 1     | Integer | **TenantID**       | **ID del tenant**                                                                                    |
| 2     | Integer | SiteID             | Site ID                                                                                              |
| 3     | Integer | EmployeeID         | N/A                                                                                                  |
| 4     | String  | sAccessCode        | Código acceso/gate                                                                                   |
| 5     | String  | sWebPassword       | Password web                                                                                         |
| 6-17  | String  | Contacto principal | sMrMrs, sFName, sMI, sLName, sCompany, sAddr1, sAddr2, sCity, sRegion, sPostalCode, sCountry, sPhone |
| 18-28 | String  | Contacto Alt       | Campos alternativo                                                                                   |
| 29-40 | String  | Contacto Bus       | Campos business                                                                                      |
| 41-44 | String  | Otros              | sFax, sEmail, sPager, sMobile                                                                        |
| 45    | Boolean | bCommercial        | ¿Comercial?                                                                                          |
| 46    | Boolean | bTaxExempt         | ¿Exento impuestos?                                                                                   |
| 47    | Boolean | bSpecial           | N/A                                                                                                  |
| 48    | Boolean | bNeverLockOut      | N/A                                                                                                  |
| 49    | Boolean | bCompanyIsTenant   | ¿Empresa es tenant?                                                                                  |
| 50    | Boolean | bOnWaitingList     | ¿En waiting list?                                                                                    |
| 51    | Boolean | bNoChecks          | ¿Tiene NSF?                                                                                          |
| 52    | Date    | dDOB               | Fecha nacimiento                                                                                     |
| 53    | String  | sTenNote           | Notas                                                                                                |
| 54    | Integer | iPrimaryPic        | N/A                                                                                                  |
| 55    | String  | sLicense           | Licencia                                                                                             |
| 56    | String  | sLicRegion         | Región licencia                                                                                      |
| 57    | String  | sSSN               | SSN                                                                                                  |
| 58-67 | Mixed   | Marketing/Other    | IDs de marketing, flags N/A                                                                          |

**Códigos de error:**

| Código | Descripción                               |
| ------ | ----------------------------------------- |
| -1     | Last name and access code required        |
| -2     | Invalid or duplicate gate code            |
| -3     | Failed to get tenant data from server     |
| -4     | Failed to save tenant update              |
| -5     | Error calling function (contact SiteLink) |
| -6     | General Failure                           |
| -7     | Failed to get tenant schema               |
| -95    | Invalid TenantID                          |

---

### MoveInWithDiscount_v4

Ejecuta el move-in de un tenant a una unidad. **Requiere pago completo**. Permite configurar keypad zone, time zone y billing frequency.

**IMPORTANTE:** Llamar primero `MoveInCostRetrieveWithDiscount_v2` para obtener el monto exacto.

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/MoveInWithDiscount_v4`

**Parámetros (32 campos):**

| #   | Tipo    | Default | Campo                 | Descripción                                                                  |
| --- | ------- | ------- | --------------------- | ---------------------------------------------------------------------------- |
| 1-4 | String  | N/A     | Auth                  | Credenciales                                                                 |
| 5   | Integer | N/A     | **iTenantID**         | **ID del tenant**                                                            |
| 6   | String  | N/A     | **sAccessCode**       | **Código acceso/gate**                                                       |
| 7   | Integer | N/A     | **iUnitID**           | **ID de la unidad**                                                          |
| 8   | Date    | N/A     | **dStartDate**        | **Fecha inicio** (de MoveInCostRetrieve)                                     |
| 9   | Date    | N/A     | dEndDate              | Fecha fin (de MoveInCostRetrieve)                                            |
| 10  | Decimal | N/A     | **dcPaymentAmount**   | **Monto total** (de MoveInCostRetrieve)                                      |
| 11  | Integer | N/A     | **iCCType**           | **Tipo tarjeta:** 5=MasterCard, 6=VISA, 7=Amex, 8=Discover, 9=Diners         |
| 12  | String  | ""      | sCCNumber             | Número tarjeta (solo dígitos)                                                |
| 13  | String  | ""      | sCVV                  | CVV                                                                          |
| 14  | String  | ""      | sMagData              | Datos magnéticos                                                             |
| 15  | Date    | N/A     | dCCExpiration         | Fecha expiración tarjeta                                                     |
| 16  | String  | ""      | sBillingName          | Nombre en tarjeta                                                            |
| 17  | String  | ""      | sBillingAddress       | Dirección de facturación                                                     |
| 18  | String  | ""      | sBillingZip           | Código postal facturación                                                    |
| 19  | Integer | -999    | InsuranceCoverageID   | ID seguro (-999 = ninguno)                                                   |
| 20  | Integer | -999    | ConcessionPlanID      | ID descuento (-999 = ninguno)                                                |
| 21  | Integer | N/A     | **iSource**           | **Fuente:** 1=Call Center, 5=Website API                                     |
| 22  | String  | ""      | sSource               | Fuente texto                                                                 |
| 23  | Boolean | N/A     | bUsePushRate          | ¿Usar push rate?                                                             |
| 24  | Integer | N/A     | **iPayMethod**        | **Método:** 0=Credit Card, 1=Check, 2=Cash, 3=Debit, 4=ACH                   |
| 25  | String  | ""      | sACHRouting           | Routing ACH                                                                  |
| 26  | String  | ""      | sACHAccount           | Cuenta ACH                                                                   |
| 27  | Integer | ""      | iAccountType          | Tipo cuenta: 1=Consumer Checking, 2=Consumer Savings, 3=Business Checking    |
| 28  | Integer | N/A     | iKeypadZoneID         | ID zona keypad                                                               |
| 29  | Integer | N/A     | iTimeZoneID           | ID zona horaria                                                              |
| 30  | Integer | N/A     | **iBillingFrequency** | **Frecuencia:** 3=Monthly, 7=28 Day Billing                                  |
| 31  | Integer | -999    | iWaitingID            | ID de reservación (-999 si es nuevo, o WaitingListID para convertir reserva) |
| 32  | Boolean | N/A     | **bTestMode**         | **True = NO procesa pago real** (solo SiteLink)                              |

**Response:** DataSet con tabla "RT"

**Éxito:**

| Tipo    | Campo     | Descripción                    |
| ------- | --------- | ------------------------------ |
| Integer | Ret_Code  | **LedgerID** (número positivo) |
| Integer | iLeaseNum | Número de lease                |

**Códigos de error:**

| Código  | Descripción                                      |
| ------- | ------------------------------------------------ |
| -1      | Failed to save move in                           |
| -2      | Unit ID is not available                         |
| -3      | Invalid Insurance Coverage ID                    |
| -4      | Unable to get Credit Card Type ID                |
| -5      | Unable to get payment Type ID                    |
| -6      | Charge Description error                         |
| -7      | Insurance category missing                       |
| -8      | Administrative category missing                  |
| -9      | Rent category missing                            |
| -10     | Security category missing                        |
| **-11** | **Payment amount does not match**                |
| -12     | Get Time Zones data error                        |
| -13     | Get Keypad Zones data error                      |
| -14     | Credit Card number is invalid                    |
| -17     | Invalid Concession Plan ID                       |
| -20     | Site not setup for Authorize.Net or PPI PayMover |
| -21     | No credit card config for site                   |
| -25     | Invalid unit ID                                  |
| -26     | Invalid keypad zone ID                           |
| -27     | Invalid time zone ID                             |
| -28     | Invalid billing frequency                        |
| -83     | Move in dates cannot exceed 2 months in past     |
| -84     | Debit transactions require bTestMode = True      |
| -95     | Invalid TenantID                                 |
| -100    | Credit Card not being authorized                 |

**IMPORTANTE:** Error `-11` significa que el monto no coincide con lo calculado. Volver a llamar `MoveInCostRetrieveWithDiscount_v2`.

**Flujo para convertir reservación:**

```
Pasar iWaitingID = WaitingListID de ReservationNewWithSource_v5
```

---

### TenantBillingInfoUpdate_v2 (Opcional)

Actualiza información de tarjeta de crédito, ACH, o preferencias de auto-cobro del tenant. Puede modificar expiración, nombre, dirección y zip sin cambiar el número de tarjeta (pasando el valor enmascarado).

**SOAPAction:** `http://tempuri.org/CallCenterWs/CallCenterWs/TenantBillingInfoUpdate_v2`

**Parámetros:**

| #   | Tipo    | Campo                 | Descripción                                                                    |
| --- | ------- | --------------------- | ------------------------------------------------------------------------------ |
| 1-4 | String  | Auth                  | Credenciales                                                                   |
| 5   | Integer | **iLedgerID**         | **ID del ledger**                                                              |
| 6   | Integer | **iCreditCardTypeID** | **ID tipo tarjeta** (de PaymentTypesRetrieve o TenantBillingInfoByTenantID_v2) |
| 7   | String  | sCCNumber             | Número o número enmascarado (ej: \*1234)                                       |
| 8   | Date    | dCCExpiration         | Fecha expiración                                                               |
| 9   | String  | sCCHolderName         | Nombre del titular                                                             |
| 10  | String  | sCCBillingStreet      | Dirección facturación                                                          |
| 11  | String  | sCCBillingZip         | Código postal                                                                  |
| 12  | Integer | **iAutoBillType**     | **Tipo auto-cobro:** 0=None, 1=Credit Card, 2=ACH                              |
| 13  | String  | sACHAccountNumber     | Número cuenta ACH                                                              |
| 14  | String  | sACHRoutingNumber     | Routing ACH                                                                    |
| 15  | String  | iACHAccountType       | **Tipo cuenta:** 1=Consumer Checking, 2=Consumer Savings, 3=Business Checking  |
| 16  | Integer | iDaysAfterDue         | Días después de vencido para auto-cobrar                                       |

**Response:** DataSet con tabla "RT"

**Éxito:**

| Tipo    | Campo    | Descripción                            |
| ------- | -------- | -------------------------------------- |
| Integer | Ret_Code | LedgerID actualizado (número positivo) |

**Códigos de error:**

| Código | Descripción                                          |
| ------ | ---------------------------------------------------- |
| -1     | Ledger with specified ID could not be found          |
| -2     | Could not save ledger information (contact SiteLink) |
| -95    | Invalid credit card type ID                          |

## **Caso de uso:** Configurar autopago después del move-in para cobros automáticos mensuales.

## Flujos Típicos

### Flujo de Move-In Directo (sin reservación)

```
1. Usuario selecciona ubicación
   └── Cargar desde cache: UnitTypePriceList_v2, DiscountPlansRetrieve, InsuranceCoverageRetrieve

2. Usuario busca unidades disponibles
   └── UnitsInformationAvailableUnitsOnly_v2

3. Usuario selecciona unidad y opciones
   └── MoveInCostRetrieveWithDiscount_v2 (calcular precio)

4. Usuario completa formulario de datos
   ├── (Opcional) TenantListDetailed → verificar si ya existe
   └── TenantNewDetailed_v2 (crear cliente) → obtener TenantID

5. Usuario confirma y paga
   └── MoveInWithDiscount_v4 (ejecutar move-in) → obtener LedgerID

6. Firma de contrato
   └── SiteLinkeSignCreateLeaseURL_v2 → redirigir a firma

7. (Opcional) Configurar autopago
   └── TenantBillingInfoUpdate_v2
```

### Flujo de Reservación (sin pago inmediato)

```
1. Usuario selecciona ubicación
   └── Cargar desde cache

2. Usuario busca unidades disponibles
   └── UnitsInformationAvailableUnitsOnly_v2

3. Usuario completa formulario de datos
   ├── (Opcional) TenantListDetailed → verificar si ya existe
   └── TenantNewDetailed_v2 (crear cliente) → obtener TenantID

4. Usuario confirma reservación
   └── ReservationNewWithSource_v5 → obtener WaitingID

```

### Consulta de cliente existente

```
1. Buscar tenant por email, teléfono o nombre
   └── TenantListDetailed → obtener TenantID

2. Ver arriendos del tenant
   └── LedgersByTenantID → lista de ledgers con estado y balance
```

### Consulta de inventario completo (para admin/mapas)

```
1. Obtener todas las unidades (disponibles + ocupadas)
   └── UnitsInformation_v2 o UnitsInformation_v3

2. Filtrar/mostrar según necesidad
   └── Mapa interactivo, reportes, etc.
```

---

## Notas de Implementación

### Headers Requeridos

```javascript
const headers = {
  "Content-Type": "text/xml; charset=utf-8",
  SOAPAction: "http://tempuri.org/CallCenterWs/CallCenterWs/{ENDPOINT_NAME}",
};
```

### Manejo de Fechas

Las fechas deben enviarse en formato ISO 8601:

```
2025-01-15T00:00:00Z
```

### Valores Especiales

- `InsuranceCoverageID = 0` → Sin seguro
- `ConcessionPlanID = 0` → Sin descuento
- `lngLastTimePolled = "0"` → Obtener todos los registros
- `bTestMode = true` → No procesa pago real

### Códigos de Tipo de Tarjeta

| Código | Tipo             |
| ------ | ---------------- |
| 1      | Visa             |
| 2      | MasterCard       |
| 3      | American Express |
| 4      | Discover         |

---

## Ejemplo de Wrapper TypeScript

```typescript
interface SiteLinkAuth {
  corpCode: string;
  locationCode: string;
  userName: string;
  password: string;
}

async function callSiteLink(
  endpoint: string,
  auth: SiteLinkAuth,
  params: Record<string, any> = {}
): Promise<any> {
  const soapAction = `http://tempuri.org/CallCenterWs/CallCenterWs/${endpoint}`;

  const body = buildSoapEnvelope(endpoint, {
    sCorpCode: auth.corpCode,
    sLocationCode: auth.locationCode,
    sCorpUserName: auth.userName,
    sCorpPassword: auth.password,
    ...params,
  });

  const response = await fetch(
    "https://api.smdservers.net/CCWs_3.5/CallCenterWs.asmx",
    {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: soapAction,
      },
      body,
    }
  );

  return parseSoapResponse(await response.text());
}
```
