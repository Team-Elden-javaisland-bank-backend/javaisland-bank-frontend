# EldenBank — Frontend

Frontend Angular 22 per la banca digitale **EldenBank**. Mobile-first, collegato al backend Spring Boot + Keycloak + PostgreSQL.

---

## Stack Tecnologico

| Tecnologia | Versione | Ruolo |
|---|---|---|
| Angular | 22 | Framework SPA |
| TypeScript | 6.0 | Tipizzazione statica |
| Vite | (built-in) | Bundler / dev server |
| CSS puro | — | Styling mobile-first con design system navy/gold |
| RxJS | 7.8 | Gestione asincrona |
| Angular Signals | 22 | State reattivo |
| Angular Router | 22 | Navigazione + guard |
| HttpClient | 22 | Chiamate REST con interceptor JWT |
| @ngx-translate/core | 16 | Internazionalizzazione (i18n) |
| jsPDF + jspdf-autotable | — | Generazione PDF lato client |
| Bootstrap Icons | 1.11 | Iconografia |

---

## Design System

| Elemento | Valore |
|---|---|
| Font | Plus Jakarta Sans (Google Fonts) |
| Primary | `#0a192f` (navy) |
| Gold accent | `#e5a93c` |
| Green | `#10b981` |
| Red | `#ef4444` |
| Background | `#f4f6f8` (light) / `#0f172a` (dark) |
| Surface | `#ffffff` (light) / `#1e293b` (dark) |
| Border radius | 12-16px |
| Shadow | `0 1px 3px rgba(0,0,0,0.06)` |
| Dark mode | `prefers-color-scheme` + `data-bs-theme` |

---

## Internazionalizzazione (i18n)

Il supporto multi-lingua è implementato tramite `@ngx-translate/core`:

- **Lingue supportate**: Italiano (`it`), Inglese (`en`)
- **File di traduzione**: `src/assets/i18n/it.json`, `src/assets/i18n/en.json`
- **Lingua di default**: Italiano (salvata in `localStorage`)
- **Language switcher**: accessible from layout sidebar, login, register, limits-setup, pin-setup, pin-verify pages
- **PDF statement**: genera estratto conto nella lingua corrente (intestatario, date, header tabella, paginazione)
- **Date/currency formatting**: locale-aware (`it-IT` / `en-GB`)
- **Backend i18n**: `Accept-Language` header sent via interceptor for server-side error message translation
- **Notifications**: translated server-side using `messageKey` + `messageParams`

### Chiavi di traduzione

| Prefisso | Ambito |
|---|---|
| `DASHBOARD.*` | Pannello customer |
| `ACCOUNT_DETAIL.*` | Dettaglio conto |
| `TRANSACTIONS.*` | Transazioni |
| `PROFILE.*` | Profilo + PDF |
| `LIMITS.*` | Gestione limiti |
| `LIMITS_SETUP.*` | Setup iniziale limiti |
| `PIN.*` | Setup/verifica PIN |
| `NOTIFICATIONS.*` | Notifiche |
| `REQUESTS.*` | Richieste cliente |
| `TX_TYPE.*` | Tipi transazione |
| `LIMIT_TYPE.*` | Tipi limite |
| `NOTIFICATION_TYPE.*` | Tipi notifica |
| `REQUEST_TYPE.*` | Tipi richiesta |
| `EMPLOYEE.*` | Pagine dipendente |
| `ADMIN.*` | Pagine admin |

---

## Architettura del Progetto

```
src/app/
├── core/
│   ├── guards/           # Auth guard + role guard + limitsSetupGuard + pinSetupGuard + pinVerifyGuard
│   ├── interceptors/     # Bearer token injection + Accept-Language header + 401 force logout
│   ├── models/           # DTO interfaces (accounts, transactions, cards, users, etc.)
│   └── services/         # API services (auth, customer, employee, admin, notification)
├── layout/
│   └── layout.*          # Shell: sidebar + bottom nav + notifications dropdown + language switcher
├── pages/
│   ├── auth/             # Login + Registrazione + Language switcher
│   ├── customer/         # Dashboard, Conti, Transazioni, Beneficiari, Carte, Profilo, Notifiche, Limiti, Limits Setup, PIN Setup, PIN Verify
│   ├── employee/         # Dashboard, Registrazioni (pending + refused), Conti, Carte, Limiti, Richieste
│   └── admin/            # Dashboard, Clienti, Dipendenti, Conti, Transazioni, Audit Logs, Limiti Globali
├── app.routes.ts         # Routing completo con guard
├── app.config.ts         # Bootstrap providers + i18n config
└── app.*                 # Root component
```

---

## Integrazione Backend

### Endpoint API

Il frontend consuma **44+ endpoint REST** del backend Spring Boot (`http://localhost:8081`):

| Area | Endpoint | Metodo |
|---|---|---|
| **Auth** | `POST /api/v1/auth/register` | Registrazione pubblica |
| | `POST /api/v1/auth/keycloak-login` | Login via Keycloak ROPC |
| **Customer Accounts** | `GET /api/v1/customer/accounts` | Lista conti |
| | `GET /api/v1/customer/accounts/holder-info` | Info intestatario |
| | `GET /api/v1/customer/accounts/monthly-summary` | Riepilogo mensile |
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
| **Customer Saved Beneficiaries** | `GET /api/v1/customer/saved-beneficiaries` | Lista salvati |
| | `POST /api/v1/customer/saved-beneficiaries` | Salva |
| | `DELETE /api/v1/customer/saved-beneficiaries/{id}` | Elimina |
| **Customer Cards** | `GET /api/v1/customer/cards` | Lista carte |
| | `GET /api/v1/customer/cards/{id}` | Dettaglio |
| | `GET /api/v1/customer/cards/{id}/sensitive` | Dati completi (PAN + CVV) |
| **Customer Profile** | `POST /api/v1/profile-picture` | Upload foto profilo |
| | `DELETE /api/v1/profile-picture` | Elimina foto profilo |
| **Customer Notifications** | `GET /api/v1/customer/notifications` | Lista notifiche |
| | `PUT /api/v1/customer/notifications/{id}/read` | Segna come letta |
| **Customer PIN** | `POST /api/v1/customer/pin/setup` | Configura PIN |
| | `GET /api/v1/customer/pin/status` | Stato PIN |
| | `POST /api/v1/customer/pin/verify` | Verifica PIN |
| **Employee Users** | `GET /api/v1/employee/users/registrations/pending` | Registrazioni in attesa |
| | `PUT /api/v1/employee/users/registrations/{id}/validate` | Valida registrazione |
| | `PUT /api/v1/employee/users/registrations/{id}/reject` | Rifiuta registrazione |
| | `GET /api/v1/employee/users/registrations/refused` | Registrazioni rifiutate |
| | `PUT /api/v1/employee/users/registrations/{id}/reopen` | Riapri registrazione |
| | `DELETE /api/v1/employee/users/registrations/{id}` | Elimina utente rifiutato |
| | `GET /api/v1/employee/users/customers` | Lista clienti |
| **Employee Accounts** | `GET /api/v1/employee/accounts` | Tutti i conti (filtro status) |
| | `GET /api/v1/employee/accounts/user/{id}` | Conti per utente |
| | `GET /api/v1/employee/accounts/{number}` | Dettaglio conto |
| | `PUT /api/v1/employee/accounts/{number}/activate` | Attiva conto |
| | `PUT /api/v1/employee/accounts/{number}/freeze` | Congela conto |
| | `PUT /api/v1/employee/accounts/{number}/closure/validate` | Valida chiusura |
| | `PUT /api/v1/employee/accounts/{number}/closure/reject` | Rifiuta chiusura |
| | `GET /api/v1/employee/accounts/{number}/limits` | Limiti conto |
| | `PUT /api/v1/employee/accounts/{number}/limits/{type}` | Imposta limite |
| **Employee Cards** | `GET /api/v1/employee/cards` | Tutte le carte |
| | `GET /api/v1/employee/cards/{id}` | Dettaglio carta |
| | `GET /api/v1/employee/accounts/{number}/cards` | Carte per conto |
| | `PATCH /api/v1/employee/cards/{id}/status` | Aggiorna stato carta |
| **Admin Dashboard** | `GET /api/v1/admin/dashboard` | Statistiche aggregate |
| **Admin Employees** | `GET /api/v1/admin/employees` | Lista dipendenti |
| | `POST /api/v1/admin/employees` | Crea dipendente |
| | `GET /api/v1/admin/employees/{id}` | Dettaglio dipendente |
| | `PUT /api/v1/admin/employees/{id}/suspend` | Sospendi dipendente (force logout) |
| **Admin Limits** | `GET /api/v1/admin/limits` | Lista tipi limite |
| | `PUT /api/v1/admin/limits/{type}` | Aggiorna limite globale |
| **Admin Audit Logs** | `GET /api/v1/admin/audit-logs` | Log audit paginati |

### Database

PostgreSQL `javaisland_backend` — tabelle: `users`, `accounts`, `account_limits`, `cards`, `transactions`, `beneficiaries`, `saved_beneficiaries`, `notifications`, `audit_logs` + tabelle lookup (`user_statuses`, `role_types`, `account_statuses`, `card_statuses`, `card_types`, `transaction_statuses`, `transaction_types`, `limit_types`).

### Keycloak

- **Realm**: `javaisland-realm`
- **Client ID**: `bank-backend`
- **Ruoli**: `C` (Cliente), `D` (Dipendente), `A` (Admin)
- **Flow**: registrazione → utente in stato PENDING → dipendente valida → utente creato in Keycloak con ruolo C → login ROPC → JWT

### Swagger

Documentazione API disponibile su: `http://localhost:8081/swagger-ui/index.html`

---

## Pagine

### Auth
- **Login** — Email + password, language switcher, link registrazione
- **Registrazione** — Form completo dati anagrafici, language switcher, validazione client-side

### Customer
- **Dashboard** — Hero banner, saldi conti, carosello carte, transazioni recenti, quick actions, notifiche
- **Conti** — Lista conti, apertura nuovo conto, richiesta chiusura
- **Dettaglio Conto** — Saldo, stato, data apertura, limiti operativi
- **Transazioni** — Deposito, prelievo, bonifico, storico paginato con filtri data
- **Beneficiari** — Gestione contatti per bonifici rapidi
- **Carte** — Lista carte, dettaglio con reveal CVV, dati sensibili (PAN + CVV)
- **Profilo** — Dati personali, foto profilo, estratto conto PDF
- **Notifiche** — Lista notifiche con segna come letta
- **Limiti** — Visualizzazione e modifica limiti operativi (solo dopo setup)
- **Limits Setup** — Configurazione iniziale obbligatoria dei 6 limiti prima di poter operare
- **PIN Setup** — Configurazione PIN 6 cifre (obbligatorio prima delle operazioni)
- **PIN Verify** — Verifica PIN per operazioni sensibili

### Employee
- **Dashboard** — KPI cards, quick actions, overview statistiche, notifiche, tips
- **Registrazioni** — Tab pending/refused, valuta/rifiuta/riapri/eliminaregistrazioni
- **Conti** — Gestione conti (attiva, congela, chiudi), limiti per conto
- **Carte** — Gestione carte (stato), dettaglio carta
- **Limiti** — Impostazione limiti per conto
- **Richieste** — Gestione richieste cliente

### Admin
- **Dashboard** — Hero banner, 4 KPI cards, overview sistema, quick actions, sidebar (stato, statistiche, tips)
- **Clienti** — Lista e dettaglio clienti
- **Dipendenti** — CRUD dipendenti, sospensione con force logout
- **Conti** — Lista e gestione conti
- **Transazioni** — Cronologia transazioni con filtri
- **Audit Logs** — Log audit con filtri azione (REOPEN, DELETE, ecc.)
- **Limiti Globali** — Configurazione limiti globali del sistema

---

## Stile Mobile-First

### Breakpoints

| Breakpoint | Layout |
|---|---|
| **< 768px** (mobile) | Top bar + hamburger menu + bottom nav con icone SVG. Tabelle scroll orizzontale. Form stack verticali. Grid 1 colonna. Modal slide-up dal basso. |
| **≥ 768px** (tablet) | Sidebar fissa 240px. Bottom nav nascosto. Grid multi-colonne. Modal centrati. |
| **≥ 1024px** (desktop) | Sidebar 260px. Padding più ampio. |

### Componenti UI

- **Bottom Nav** — 4 icone SVG (Home, Conti, Transazioni, Carte) con indicatori attivi
- **Sidebar** — slide-in drawer su mobile, fisso su desktop, con badge ruolo e language switcher
- **Tabelle** — wrapper con scroll orizzontale su mobile, `min-width` per mantenere leggibilità
- **Form** — input `font-size: 16px` (evita zoom iOS), `-webkit-appearance: none`, stack verticali su mobile
- **Tabs** — scroll orizzontale se non entrano nello schermo
- **Modal** — slide-up dal basso su mobile, centrata su desktop
- **Card** — gradienti diversi per DEBIT/CREDIT, reveal CVV con toggle
- **KPI Cards** — icona colorata + label + valore, hover con ombra
- **Action Cards** — icona + titolo + descrizione + chevron, border gold su hover
- **Hero Banner** — gradient navy con decorazioni gold, data in alto a destra
- **Toast Notifications** — posizione fissa (bottom center), auto-dismiss 5s
- **Notifications Dropdown** — click-outside per chiudere, tradotte server-side
- **PDF Statement** — generazione estratto conto con jsPDF, header tradotti, tabella movimenti, paginazione
- **Loading Spinner** — gold color, centrato con testo

### Dark Mode

- Supportato via `prefers-color-scheme: dark` e `data-bs-theme="dark"`
- Variabili CSS: `--bi-bg`, `--bi-text`, `--bi-surface`, `--bi-border`
- Tutte le componenti supportano dark mode (card, tabelle, form, sidebar, etc.)

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

4. Primo accesso customer:
   → Setup limiti obbligatorio (6 limiti)
   → Setup PIN obbligatorio (6 cifre)
   → Accesso completo al pannello

5. Customer: gestisce conti, transazioni, beneficiari, carte, profilo, notifiche, limiti
6. Employee: gestisce registrazioni (pending + refused), conti, limiti, carte, richieste
7. Admin: gestisce dipendenti, clienti, conti, transazioni, audit log, limiti globali
```

---

## Struttura Modelli (Database)

```
users ──┬── accounts ──┬── account_limits (6 tipi)
        │              └── cards (DEBIT/CREDIT)
        ├── beneficiaries
        ├── saved_beneficiaries
        ├── notifications (message_key + message_params)
        ├── password_change_requests
        └── user_pins

transactions ── source_account → accounts
              └── destination_account → accounts

audit_logs ── (user_id, action, entity, details)
```

---

## Forza Logout

Quando un dipendente viene sospeso dall'admin:

1. `AdminEmployeeService.suspendEmployee()` disabilita l'utente in Keycloak
2. `JwtPasswordChangeFilter` controlla lo stato utente su ogni richiesta
3. Se stato != ACTIVE → risposta 401 con `ACCOUNT_SUSPENDED`
4. Frontend interceptor mostra toast con messaggio backend → logout + redirect login
