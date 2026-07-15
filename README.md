# JavaIsland Bank — Frontend

Frontend Angular 22 per la banca digitale **JavaIsland Bank**. Mobile-first, collegato al backend Spring Boot + Keycloak + PostgreSQL.

---

## Stack Tecnologico

| Tecnologia | Versione | Ruolo |
|---|---|---|
| Angular | 22 | Framework SPA |
| TypeScript | 6.0 | Tipizzazione statica |
| Vite | (built-in) | Bundler / dev server |
| CSS puro | — | Styling mobile-first |
| RxJS | 7.8 | Gestione asincrona |
| Angular Router | 22 | Navigazione + guard |
| HttpClient | 22 | Chiamate REST con interceptor JWT |

---

## Architettura del Progetto

```
src/app/
├── core/
│   ├── guards/           # Auth guard + role guard
│   ├── interceptors/     # Bearer token injection
│   ├── models/           # 19 DTO interfaces (7 domini)
│   └── services/         # 3 servizi API (auth, customer, employee)
├── layout/
│   └── layout.*          # Shell: sidebar + bottom nav (mobile-first)
├── pages/
│   ├── auth/             # Login + Registrazione
│   ├── customer/         # Dashboard, Conti, Transazioni, Beneficiari, Carte
│   └── employee/         # Dashboard, Registrazioni, Conti, Carte
├── app.routes.ts         # Routing completo con guard
├── app.config.ts         # Bootstrap providers
└── app.*                 # Root component
```

---

## Integrazione Backend

### Endpoint API

Il frontend consuma **37 endpoint REST** del backend Spring Boot (`http://localhost:8081`):

| Area | Endpoint | Metodo |
|---|---|---|
| **Auth** | `POST /api/v1/auth/register` | Registrazione pubblica |
| | `POST /api/v1/auth/keycloak-login` | Login via Keycloak ROPC |
| **Customer Accounts** | `GET /api/v1/customer/accounts` | Lista conti |
| | `POST /api/v1/customer/accounts/open` | Apri conto |
| | `POST /api/v1/customer/accounts/closure-request` | Richiesta chiusura |
| | `GET /api/v1/customer/accounts/{number}` | Dettaglio conto |
| | `GET /api/v1/customer/accounts/{number}/limits` | Limiti conto |
| **Customer Transactions** | `POST /api/v1/customer/transactions/deposit` | Deposito |
| | `POST /api/v1/customer/transactions/withdraw` | Prelievo |
| | `POST /api/v1/customer/transactions/transfer` | Bonifico |
| | `GET /api/v1/customer/transactions/recent/{number}` | Transazioni recenti |
| | `GET /api/v1/customer/transactions/all` | Storico paginato |
| **Customer Beneficiaries** | `GET /api/v1/customer/beneficiaries` | Lista |
| | `POST /api/v1/customer/beneficiaries` | Aggiungi |
| | `DELETE /api/v1/customer/beneficiaries/{id}` | Elimina |
| **Customer Cards** | `GET /api/v1/customer/cards` | Lista carte |
| | `GET /api/v1/customer/cards/{id}` | Dettaglio |
| | `GET /api/v1/customer/cards/{id}/sensitive` | Dati completi (PAN + CVV) |
| **Employee Users** | `GET /api/v1/employee/users/registrations/pending` | Registrazioni in attesa |
| | `PUT /api/v1/employee/users/registrations/{id}/validate` | Valida registrazione |
| | `PUT /api/v1/employee/users/registrations/{id}/reject` | Rifiuta registrazione |
| | `GET /api/v1/employee/users/customers` | Lista clienti |
| **Employee Accounts** | `GET /api/v1/employee/accounts` | Tutti i conti (filtro status) |
| | `GET /api/v1/employee/accounts/user/{id}` | Conti per utente |
| | `PUT /api/v1/employee/accounts/{number}/activate` | Attiva conto |
| | `PUT /api/v1/employee/accounts/{number}/reject` | Rifiuta conto |
| | `PUT /api/v1/employee/accounts/{number}/freeze` | Congela conto |
| | `PUT /api/v1/employee/accounts/{number}/closure/validate` | Valida chiusura |
| | `PUT /api/v1/employee/accounts/{number}/closure/reject` | Rifiuta chiusura |
| | `GET /api/v1/employee/accounts/{number}` | Dettaglio conto |
| | `GET /api/v1/employee/accounts/{number}/limits` | Limiti conto |
| | `PUT /api/v1/employee/accounts/{number}/limits/{type}` | Imposta limite |
| **Employee Cards** | `GET /api/v1/employee/cards` | Tutte le carte |
| | `GET /api/v1/employee/cards/{id}` | Dettaglio carta |
| | `GET /api/v1/employee/accounts/{number}/cards` | Carte per conto |

### Database

PostgreSQL `javaisland_backend` — tabelle: `users`, `accounts`, `account_limits`, `cards`, `transactions`, `beneficiaries` + tabelle lookup (`user_statuses`, `role_types`, `account_statuses`, `card_statuses`, `card_types`, `transaction_statuses`, `transaction_types`, `limit_types`).

### Keycloak

- **Realm**: `javaisland-realm`
- **Client ID**: `bank-backend`
- **Ruoli**: `C` (Cliente), `D` (Dipendente)
- **Flow**: registrazione → utente in stato PENDING → dipendente valida → utente creato in Keycloak con ruolo C → login ROPC → JWT

### Swagger

Documentazione API disponibile su: `http://localhost:8081/swagger-ui/index.html`

---

## Stile Mobile-First

### Design System

| Elemento | Valore |
|---|---|
| Font | Inter (Google Fonts) |
| Primary color | `#e94560` (rosso) |
| Background | `#f5f6fa` (grigio chiaro) |
| Sidebar | `#1a1a2e` (blu scuro) |
| Border radius | `10-16px` |
| Shadow | `0 2px 8px rgba(0,0,0,0.06)` |

### Breakpoints

| Breakpoint | Layout |
|---|---|
| **< 768px** (mobile) | Top bar + hamburger menu + bottom nav con icone SVG. Tabelle scroll orizzontale. Form stack verticali. Grid 1 colonna. Modal slide-up dal basso. |
| **≥ 768px** (tablet) | Sidebar fissa 240px. Bottom nav nascosto. Grid multi-colonne. Modal centrati. |
| **≥ 1024px** (desktop) | Sidebar 260px. Padding più ampio. |

### Componenti UI

- **Bottom Nav** — 4 icone SVG (Home, Conti, Transazioni, Carte) con indicatori attivi
- **Sidebar** — slide-in drawer su mobile, fisso su desktop, con badge ruolo
- **Tabelle** — wrapper con scroll orizzontale su mobile, `min-width` per mantenere leggibilità
- **Form** — input `font-size: 16px` (evita zoom iOS), `-webkit-appearance: none`, stack verticali su mobile
- **Tabs** — scroll orizzontale se non entrano nello schermo
- **Modal** — slide-up dal basso su mobile, centrata su desktop
- **Card** — gradienti diversi per DEBIT/CREDIT, reveal CVV con toggle

---

## Avvio

### Prerequisiti

- Node.js 20+
- PostgreSQL in esecuzione su `localhost:5432`
- Keycloak in esecuzione su `localhost:8080`
- Backend Spring Boot in esecuzione su `localhost:8081`

### Installazione

```bash
cd front-end/bank-frontend
npm install
```

### Development

```bash
npm start
# → http://localhost:3000
```

### Build produzione

```bash
npm run build
# → dist/bank-frontend/
```

### Test

```bash
npm test
```

---

## Porte

| Servizio | Porta | URL |
|---|---|---|
| Frontend (Angular) | `3000` | http://localhost:3000 |
| Backend (Spring Boot) | `8081` | http://localhost:8081 |
| Swagger UI | `8081` | http://localhost:8081/swagger-ui/index.html |
| Keycloak | `8080` | http://localhost:8080 |
| Keycloak Admin Console | `8080` | http://localhost:8080/admin/master/console/ |
| PostgreSQL | `5432` | jdbc:postgresql://localhost:5432/javaisland_backend |

---

## Flusso Utente

```
1. Utente si registra → POST /api/v1/auth/register
   → Stato: PENDING, Account: INATTIVO, Carta: INATTIVA

2. Dipendente valida → PUT /api/v1/employee/users/registrations/{id}/validate
   → Crea utente Keycloak con ruolo C
   → Stato: ACTIVE, Account: ATTIVO, Carta: ATTIVA

3. Login → POST /api/v1/auth/keycloak-login
   → JWT + ruolo + dati utente

4. Customer: gestisce conti, transazioni, beneficiari, carte
5. Employee: gestisce registrazioni, conti, limiti, carte
```

---

## Struttura Modelli (Database)

```
users ──┬── accounts ──┬── account_limits (6 tipi)
        │              └── cards (DEBIT/CREDIT)
        └── beneficiaries

transactions ── source_account → accounts
              └── destination_account → accounts
```
