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
| HttpClient | 22 | Chiamate REST con cookie sessione + Accept-Language |
| @ngx-translate/core | 18 | Internazionalizzazione (i18n) |
| jsPDF + jspdf-autotable | — | Generazione PDF lato client |
| Photon API (OpenStreetMap) | — | Geocoding autocompletamento indirizzi di residenza |
| Dataset ISTAT comuni | — | 7904 comuni (via backend `/api/v1/comuni`) per luogo di nascita |
| Bootstrap Icons | 1.13 | Iconografia |
| Bootstrap | 5.3 | CSS framework base |

---

## Design System

| Elemento | Valore |
|---|---|
| Font | Plus Jakarta Sans (Google Fonts) |
| Primary | `#0a192f` (navy) |
| Gold accent | `#e5a93c` |
| Green | `#10b981` (amount in) |
| Red | `#ef4444` (amount out) |
| Background | `#f4f6f8` (light) / `#0f172a` (dark) |
| Surface | `#ffffff` (light) / `#1e293b` (dark) |
| Border radius | 12-16px |
| Shadow | `0 1px 3px rgba(0,0,0,0.06)` |
| Dark mode | `prefers-color-scheme` + `data-bs-theme` |

### Transaction Amount Colors

| Direction | Color | Sign |
|---|---|---|
| Incoming (deposit, received transfer) | `#10b981` (green) | `+` |
| Outgoing (withdrawal, sent transfer) | `#ef4444` (red) | `-` |
| Self/internal transfer | `#6b7280` (neutral gray) | none |

---

## Internazionalizzazione (i18n)

Il supporto multi-lingua è implementato tramite `@ngx-translate/core`:

- **Lingue supportate**: Italiano (`it`), Inglese (`en`)
- **File di traduzione**: `src/assets/i18n/it.json`, `src/assets/i18n/en.json`
- **Lingua di default**: Italiano (salvata in `localStorage`)
- **Language switcher**: accessibile da layout sidebar, login, register, limits-setup, pin-setup, pin-verify
- **PDF statement**: genera estratto conto nella lingua corrente (intestatario, date, header tabella, paginazione)
- **Date/currency formatting**: locale-aware (`it-IT` / `en-GB`)
- **Backend i18n**: `Accept-Language` header inviato via interceptor per traduzione errori lato server
- **Notifications**: tradotte server-side usando `messageKey` + `messageParams`

### Chiavi di traduzione

| Prefisso | Ambito |
|---|---|
| `DASHBOARD.*` | Pannello customer |
| `ACCOUNTS.*` | Gestione conti + chiusura |
| `ACCOUNT_DETAIL.*` | Dettaglio conto |
| `TRANSACTIONS.*` | Transazioni |
| `TX_TYPE.*` | Tipi transazione (DEPOSIT, WITHDRAWAL, TRANSFER, INTERNAL_TRANSFER, ecc.) |
| `PROFILE.*` | Profilo + PDF |
| `LIMITS.*` | Gestione limiti |
| `LIMITS_SETUP.*` | Setup iniziale limiti |
| `LIMIT_TYPE.*` | Tipi limite |
| `PIN.*` | Setup/verifica PIN |
| `NOTIFICATIONS.*` | Notifiche |
| `NOTIFICATION_TYPE.*` | Tipi notifica |
| `REQUESTS.*` | Richieste cliente |
| `REQUEST_TYPE.*` | Tipi richiesta |
| `EMPLOYEE.*` | Pagine dipendente |
| `ADMIN.*` | Pagine admin |
| `SIDEBAR.*` | Navigazione sidebar |
| `CARDS.*` | Gestione carte |
| `CARD_TYPE.*` | Tipi carta |
| `BENEFICIARIES.*` | Beneficiari |
| `REGISTER.*` | Registrazione |

---

## Architettura del Progetto

```
src/app/
├── core/
│   ├── animations/        # Route transition animations
│   ├── components/        # Shared components (empty-state, skeleton, toast)
│   ├── guards/            # auth.guard.ts — roleGuard, customerSetupGuard, setupPageGuard, loginRedirectGuard
│   ├── interceptors/      # auth.interceptor.ts (Accept-Language + cookie) + error.interceptor.ts (normalizzazione errori)
│   ├── models/            # DTO interfaces per dominio (account/, auth/, card/, ecc.)
│   └── services/          # API services (auth, customer, employee, admin, notification, toast)
├── layout/                # Shell layout: sidebar + bottom nav + header + notifications dropdown
├── pages/
│   ├── auth/              # 2 componenti (Login + Registrazione)
│   ├── customer/          # 14 componenti (dashboard, conti, transazioni, ecc.)
│   ├── employee/          # 7 componenti (dashboard, registrazioni, conti, ecc.)
│   └── admin/             # 6 componenti (dashboard, dipendenti, conti, ecc.)
├── app.routes.ts          # Routing completo con guard chain
├── app.config.ts          # Providers bootstrap + i18n config
└── app.*                  # Root component
```

### Core Modules

#### Guards (`core/guards/auth.guard.ts`)

Il flusso di onboarding utente C è determinato dallo stato di setup:

```
resolveCustomerState(user, pinVerified):
  limitsSetupComplete === false → limits-setup
  pinSetupComplete === false    → pin-setup
  !pinVerified                  → pin-verify
  altrimenti                    → dashboard
```

| Guard | Funzione |
|---|---|
| `roleGuard('C'\|'D'\|'A')` | Blocca la route se non autenticato o ruolo errato |
| `customerSetupGuard` | Reindirizza il cliente a limits-setup → pin-setup → pin-verify finché il setup non è completo |
| `setupPageGuard('limits-setup'\|'pin-setup'\|'pin-verify')` | Permette solo la pagina di setup richiesta (e reindirizza altrove) |
| `loginRedirectGuard` | Reindirizza utenti già loggati al loro dashboard di ruolo |

#### Interceptors (`core/interceptors/`)

`auth.interceptor.ts`:
- Imposta header `Accept-Language` (`it`/`en`) per i18n lato server
- Imposta `withCredentials: true` per invio automatico del cookie `bank_token`
- Catch `401` (fuori dalle route auth pubbliche) → toast "sessione scaduta" + logout + redirect login
- **Non** inietta alcun Bearer token: il JWT è dentro il cookie (mai in memoria/localStorage)

`error.interceptor.ts`:
- `normalizeHttpError` estrae `message` + `errorCode` dal body `ErrorResponseDto`
- `handleHttpError` propaga l'errore normalizzato a servizi/componenti

#### Services (`core/services/`)

| Service | Metodi principali |
|---|---|
| `auth.service.ts` | login, register, logout, restoreSession (`/me`), getUser, isLoggedIn, saveSession, uploadProfilePicture, setupPin, getPinStatus, verifyPin, isPinVerified (TTL 10min in `localStorage`) |
| `customer.service.ts` | getAccounts, openAccount, closureRequest, getTransactions, deposit, withdraw, transfer, getCards, getBeneficiaries, getProfile, getNotifications, getLimits, cancelTransaction |
| `employee.service.ts` | getPendingRegistrations, validateRegistration, rejectRegistration, getRefusedRegistrations, reopenRegistration, deleteUser, getCustomers, getAccounts, activateAccount, freezeAccount, validateClosure, rejectClosure, getCards, blockCard, unblockCard, getPasswordRequests, approvePasswordRequest, rejectPasswordRequest, getLimitRequests, approveLimitRequest, rejectLimitRequest |
| `admin.service.ts` | getDashboard, getEmployees, createEmployee, suspendEmployee, activateEmployee, getCustomers, getAccounts, getTransactions, getAuditLogs, checkBeneficiary |
| `notification.service.ts` | getNotifications, getUnreadCount, markAsRead, markAllAsRead |
| `toast.service.ts` | show, i18nShow, success, error, info, warning, i18n* (supporto retraduzione) |

---

## Integrazione Backend

### Endpoint API

Il frontend consuma **60+ endpoint REST** del backend Spring Boot (`http://localhost:8081`):

| Area | Endpoint | Metodo |
|---|---|---|
| **Auth** | `POST /api/v1/auth/register` | Registrazione pubblica |
| | `POST /api/v1/auth/keycloak-login` | Login via Keycloak ROPC (imposta cookie `bank_token`) |
| | `GET /api/v1/auth/me` | Restore sessione (profilo dal JWT) |
| | `POST /api/v1/auth/logout` | Logout (cancella cookie) |
| **Customer Accounts** | `GET /api/v1/customer/accounts` | Lista conti |
| | `GET /api/v1/customer/accounts/holder-info` | Info intestatario |
| | `GET /api/v1/customer/accounts/monthly-summary` | Riepilogo mensile |
| | `GET /api/v1/customer/accounts/last-active-check` | Controllo ultimo conto attivo |
| | `POST /api/v1/customer/accounts/open` | Apri conto |
| | `POST /api/v1/customer/accounts/closure-request` | Richiesta chiusura |
| | `GET /api/v1/customer/accounts/{number}` | Dettaglio conto |
| | `GET /api/v1/customer/accounts/{number}/limits` | Limiti conto |
| | `PUT /api/v1/customer/accounts/{number}/limits/{type}` | Modifica limite |
| | `PUT /api/v1/customer/accounts/limits-setup-complete` | Flag setup completato |
| **Customer Transactions** | `POST /api/v1/customer/transactions/deposit` | Deposito |
| | `POST /api/v1/customer/transactions/withdraw` | Prelievo |
| | `POST /api/v1/customer/transactions/transfer` | Bonifico (standard, istantaneo, schedulato) |
| | `GET /api/v1/customer/transactions/recent/{number}` | Transazioni recenti |
| | `GET /api/v1/customer/transactions/all` | Storico paginato |
| | `DELETE /api/v1/customer/transactions/{id}/cancel` | Cancella transazione pendente |
| **Customer Beneficiaries** | `GET /api/v1/customer/beneficiaries` | Lista |
| | `POST /api/v1/customer/beneficiaries` | Aggiungi (IBAN validato dal backend: esiste, attivo, non proprio) |
| | `DELETE /api/v1/customer/beneficiaries/{id}` | Elimina |
| | `GET /api/v1/customer/beneficiaries/check` | Verifica esistenza |
| | `PUT /api/v1/customer/beneficiaries/{id}/rename` | Rinomina |
| **Customer Cards** | `GET /api/v1/customer/cards` | Lista carte |
| | `GET /api/v1/customer/cards/{id}` | Dettaglio |
| | `GET /api/v1/customer/cards/{id}/sensitive` | Dati sensibili (PAN + CVV) |
| **Customer Profile** | `GET /api/v1/customer/profile` | Dati profilo |
| | `POST /api/v1/profile-picture` | Upload foto |
| | `DELETE /api/v1/profile-picture` | Elimina foto |
| **Customer Notifications** | `GET /api/v1/customer/notifications` | Lista notifiche |
| | `GET /api/v1/customer/notifications/unread-count` | Conteggio non lette |
| | `PUT /api/v1/customer/notifications/{id}/read` | Segna come letta |
| | `PUT /api/v1/customer/notifications/read-all` | Segna tutte come lette |
| **Customer PIN** | `POST /api/v1/user/pin/setup` | Configura PIN |
| | `GET /api/v1/user/pin/status` | Stato PIN |
| | `POST /api/v1/user/pin/verify` | Verifica PIN |
| **Customer Password** | `POST /api/v1/customer/password-change` | Richiedi cambio password |
| **Customer Limit Change** | `POST /api/v1/customer/limit-change` | Richiedi modifica limite |
| **Customer Requests** | `GET /api/v1/customer/requests` | Lista richieste |
| **Employee Users** | `GET /api/v1/employee/users/registrations/pending` | Registrazioni in attesa |
| | `PUT /api/v1/employee/users/registrations/{id}/validate` | Valida registrazione |
| | `PUT /api/v1/employee/users/registrations/{id}/reject` | Rifiuta registrazione |
| | `GET /api/v1/employee/users/registrations/refused` | Registrazioni rifiutate |
| | `PUT /api/v1/employee/users/registrations/{id}/reopen` | Riapri registrazione |
| | `DELETE /api/v1/employee/users/registrations/{id}` | Elimina utente rifiutato |
| | `GET /api/v1/employee/users/customers` | Lista clienti |
| | `GET /api/v1/employee/users/{id}/detail` | Dettaglio utente |
| | `GET /api/v1/employee/users/password-requests/pending` | Richieste cambio password |
| | `PUT /api/v1/employee/users/password-requests/{id}/approve` | Approva cambio password |
| | `PUT /api/v1/employee/users/password-requests/{id}/reject` | Rifiuta cambio password |
| | `GET /api/v1/employee/users/limit-requests/pending` | Richieste modifica limite |
| | `PUT /api/v1/employee/users/limit-requests/{id}/approve` | Approva modifica limite |
| | `PUT /api/v1/employee/users/limit-requests/{id}/reject` | Rifiuta modifica limite |
| | `GET /api/v1/employee/users/all-requests` | Tutte le richieste pendenti |
| **Employee Accounts** | `GET /api/v1/employee/accounts` | Tutti i conti (filtro status) |
| | `GET /api/v1/employee/accounts/user/{id}` | Conti per utente |
| | `GET /api/v1/employee/accounts/{number}` | Dettaglio conto |
| | `GET /api/v1/employee/accounts/{number}/user-detail` | Conto + dati utente |
| | `PUT /api/v1/employee/accounts/{number}/activate` | Attiva conto |
| | `PUT /api/v1/employee/accounts/{number}/reject` | Rifiuta apertura |
| | `PUT /api/v1/employee/accounts/{number}/freeze` | Congela conto |
| | `PUT /api/v1/employee/accounts/{number}/unfreeze` | Scongela conto |
| | `PUT /api/v1/employee/accounts/{number}/closure/validate` | Valida chiusura |
| | `PUT /api/v1/employee/accounts/{number}/closure/reject` | Rifiuta chiusura |
| | `GET /api/v1/employee/accounts/{number}/limits` | Limiti conto |
| | `PUT /api/v1/employee/accounts/{number}/limits/{type}` | Imposta limite |
| **Employee Cards** | `GET /api/v1/employee/cards` | Tutte le carte |
| | `GET /api/v1/employee/cards/{id}` | Dettaglio carta |
| | `GET /api/v1/employee/cards/{id}/sensitive` | Dati sensibili |
| | `PUT /api/v1/employee/cards/{id}/block` | Blocca carta |
| | `PUT /api/v1/employee/cards/{id}/unblock` | Sblocca carta |
| | `GET /api/v1/employee/accounts/{number}/cards` | Carte per conto |
| **Admin Dashboard** | `GET /api/v1/admin/dashboard` | Statistiche aggregate |
| **Admin Accounts** | `GET /api/v1/admin/accounts` | Tutti i conti |
| | `GET /api/v1/admin/accounts/{number}` | Dettaglio conto |
| | `GET /api/v1/admin/accounts/{number}/limits` | Limiti conto |
| | `PUT /api/v1/admin/accounts/{number}/limits/{type}` | Imposta limite |
| **Admin Customers** | `GET /api/v1/admin/customers` | Lista clienti |
| | `GET /api/v1/admin/customers/{id}` | Dettaglio cliente |
| **Admin Employees** | `GET /api/v1/admin/employees` | Lista dipendenti |
| | `GET /api/v1/admin/employees/{id}` | Dettaglio dipendente |
| | `POST /api/v1/admin/employees` | Crea dipendente |
| | `PUT /api/v1/admin/employees/{id}/suspend` | Sospendi (force logout) |
| | `PUT /api/v1/admin/employees/{id}/activate` | Attiva dipendente |
| **Admin Transactions** | `GET /api/v1/admin/transactions` | Transazioni (paginate) |
| **Admin Limits** | `GET /api/v1/admin/limits` | Lista tipi limite |
| | `PUT /api/v1/admin/limits/{type}` | Aggiorna limite globale |
| **Admin Audit Logs** | `GET /api/v1/admin/audit-logs` | Log audit paginati |

### Database

PostgreSQL `javaisland_backend` — 18 tabelle: `users`, `accounts`, `account_limits`, `cards`, `transactions`, `beneficiaries`, `notifications`, `audit_logs`, `user_pins`, `password_change_requests` + 8 tabelle lookup.

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
- **Login** — Email + password, language switcher, link registrazione, reindirizzamento ruolo
- **Registrazione** — Form completo dati anagrafici con validazione. Luogo di nascita da dataset ISTAT comuni (endpoint `/api/v1/comuni`, codifica catastale per codice fiscale), residenza con autocompletamento via Photon API (indirizzi OpenStreetMap), lingua selezionabile

### Customer

| Pagina | Route | Descrizione |
|---|---|---|
| **Dashboard** | `/customer/dashboard` | Hero banner, saldo totale, conti in carosello 3D, quick actions, transazioni recenti, summary card |
| **Conti** | `/customer/accounts` | Lista conti con carosello, summary stats, apertura nuovo conto, richiesta chiusura con modale di sicurezza |
| **Dettaglio Conto** | `/customer/accounts/:number` | Saldo, stato, data apertura, limiti operativi, dettaglio completo |
| **Transazioni** | `/customer/transactions` | Storico paginato con filtri data, colori per direzione |
| **Operazioni** | `/customer/operations` | Deposito, prelievo, bonifico (standard/istantaneo/schedulato), con verifica PIN |
| **Beneficiari** | `/customer/beneficiaries` | CRUD contatti per bonifici rapidi; IBAN validato dal backend (toast i18n se non trovato) |
| **Carte** | `/customer/cards` | Lista carte con gradienti, dettaglio, reveal dati sensibili |
| **Profilo** | `/customer/profile` | Dati personali, foto profilo, cambio password, estratto conto PDF |
| **Limiti** | `/customer/limits` | Visualizzazione e modifica limiti operativi (con policy) |
| **Limits Setup** | `/customer/limits-setup` | Configurazione iniziale obbligatoria dei 6 limiti |
| **PIN Setup** | `/customer/pin-setup` | Configurazione PIN 6 cifre obbligatoria |
| **PIN Verify** | `/customer/pin-verify` | Verifica PIN per operazioni sensibili |
| **Notifiche** | `/customer/notifications` | Lista notifiche con segna come letta, segna tutte |
| **Richieste** | `/customer/requests` | Stato richieste cambio password e modifica limiti |

#### Feature: Transazioni con segno e colore

- **Dashboard**: transazioni recenti mostrano importo con `+`/`-` e colore verde/rosso
- **Pagina transazioni**: stessa logica con classi CSS `.tx-amount-in` / `.tx-amount-out` / `.tx-amount-self`
- **Trasferimenti interni** (tra propri conti): mostrati come "Trasferimento Interno", nessun segno, colore neutro grigio
- Rilevamento automatico: se source e destination appartengono entrambi all'utente → self-transfer

#### Feature: Modale sicurezza chiusura conto

- Se l'utente tenta di chiudere l'unico conto attivo, la modale mostra:
  - Icona informativa con animazione bounce
  - Titolo: "Impossibile chiudere il conto"
  - Messaggio: "Non puoi chiudere il tuo unico conto attivo..."
  - Pulsante "Ho capito"
  - Link "Contatta assistenza"
- Animazione: zoom-in + backdrop blur
- Doppia protezione: frontend + backend check

### Employee

| Pagina | Route | Descrizione |
|---|---|---|
| **Dashboard** | `/employee/dashboard` | KPI cards, quick actions, overview statistiche, notifiche, tips |
| **Registrazioni** | `/employee/registrations` | Tab pending/refused: valuta, rifiuta, riapri, elimina |
| **Conti** | `/employee/accounts` | Gestione conti (attiva, congela, chiudi), limiti per conto, dettaglio utente |
| **Carte** | `/employee/cards` | Gestione carte (blocca/sblocca), dettaglio, dati sensibili |
| **Limiti** | `/employee/limits` | Impostazione limiti per conto |
| **Clienti** | `/employee/customers` | Lista clienti con dettaglio (profili, conti, carte) |
| **Richieste** | `/employee/requests` | Gestione richieste cambio password e modifica limiti (pending lists, approve/reject) |

### Admin

| Pagina | Route | Descrizione |
|---|---|---|
| **Dashboard** | `/admin/dashboard` | Hero banner, 4 KPI cards, overview sistema, quick actions, sidebar statistiche |
| **Clienti** | `/admin/customers` | Lista e dettaglio clienti |
| **Dipendenti** | `/admin/employees` | CRUD dipendenti, sospensione con force logout, attivazione |
| **Conti** | `/admin/accounts` | Lista e gestione conti, limiti |
| **Transazioni** | `/admin/transactions` | Cronologia transazioni con filtri |
| **Audit Logs** | `/admin/audit-logs` | Log audit con filtri per azione |
| **Limiti Globali** | `/admin/limits` | (non implementata come pagina separata — gestita dal backend) |

---

## Stile Mobile-First

### Breakpoints

| Breakpoint | Layout |
|---|---|
| **< 768px** (mobile) | Top bar + hamburger menu + bottom nav con icone SVG. Tabelle scroll orizzontale. Form stack verticali. Grid 1 colonna. |
| **≥ 768px** (tablet) | Sidebar fissa 240px. Bottom nav nascosto. Grid multi-colonne. |
| **≥ 1024px** (desktop) | Sidebar 260px. Padding più ampio. |

### Dashboard Grid Layout

```
Desktop (≥ 768px):
┌──────────────────────┬──────────────────────┐
│ dash-left (row 1)    │ dash-right (row 1)   │
│ Account Carousel     │ Quick Actions        │
├──────────────────────┼──────────────────────┤
│ dash-left (row 2)    │ dash-right (row 2)   │
│ Recent Transactions  │ Security + Summary   │
└──────────────────────┴──────────────────────┘

Mobile (< 768px):
┌──────────────────────┐
│ Account Carousel     │
├──────────────────────┤
│ Quick Actions        │
├──────────────────────┤
│ Recent Transactions  │
├──────────────────────┤
│ Security + Summary   │
└──────────────────────┘
```

### Componenti UI

- **Bottom Nav** — 4 icone SVG (Home, Conti, Transazioni, Carte) con indicatori attivi, visibile solo su mobile
- **Sidebar** — slide-in drawer su mobile, fisso su desktop, con badge ruolo, language switcher, notifiche dropdown
- **Account Carousel** — 3D perspective con slide prima/dopo, dots navigazione, contatore
- **Tabelle** — wrapper con scroll orizzontale su mobile, `min-width` per mantenere leggibilità
- **Form** — input `font-size: 16px` (evita zoom iOS), stack verticali su mobile
- **Tabs** — scroll orizzontale se non entrano nello schermo
- **Modal** — backdrop blur, animazioni fade-in/zoom-in, slide-up su mobile
- **Card** — gradienti diversi per tipo conto, status badge, balance highlight
- **KPI Cards** — icona colorata + label + valore, hover con ombra
- **Action Cards** — icona + titolo + descrizione + chevron, border gold su hover
- **Hero Banner** — gradient navy con decorazioni gold, data in alto a destra
- **Toast Notifications** — posizione fissa bottom center, auto-dismiss 5s, success/error/warning/info
- **Notifications Dropdown** — click-outside per chiudere, badge conteggio non lette
- **PDF Statement** — generazione estratto conto con jsPDF, header tradotti, tabella movimenti, paginazione
- **Loading** — spinner gold centrato con testo, skeleton placeholders
- **Empty State** — icona + titolo + descrizione + CTA button

### Dark Mode

- Supportato via `prefers-color-scheme: dark` e `data-bs-theme="dark"`
- Variabili CSS: `--bi-bg`, `--bi-text`, `--bi-surface`, `--bi-border`
- Tutte le componenti supportano dark mode (card, tabelle, form, sidebar, carosello, etc.)

---

## Flusso Utente

```
1. UTENTE SI REGISTRA → POST /api/v1/auth/register
   → Stato: PENDING, Account: INATTIVO, Carta: nessuna

2. DIPENDENTE VALIDA → PUT /api/v1/employee/users/registrations/{id}/validate
   → Crea utente Keycloak con ruolo C
   → Stato: ACTIVE, Account: ATTIVO, Carta: DEBIT ATTIVA

3. LOGIN → POST /api/v1/auth/keycloak-login
   → Il backend imposta il cookie httpOnly `bank_token` (JWT)
   → Il frontend salva in localStorage solo il profilo utente (token = '')
   → Restore sessione: GET /api/v1/auth/me

4. PRIMO ACCESSO CUSTOMER:
   a. Setup limiti obbligatorio (6 limiti) → /customer/limits-setup
   b. Setup PIN obbligatorio (6 cifre) → /customer/pin-setup
   c. Accesso completo al pannello

5. CUSTOMER: gestione conti, transazioni (+/-/colori), beneficiari, carte, profilo,
   notifiche, limiti, richieste (password change, limit change)

6. EMPLOYEE: gestione registrazioni (pending + refused), conti, limiti, carte,
   richieste password e limiti, clienti

7. ADMIN: gestione dipendenti, clienti, conti, transazioni, audit log, limiti globali
```

### Flow sicurezza chiusura conto

```
Utente clicca "Conferma Chiusura"
  ├── Frontend: onlyActiveAccounts.length <= 1?
  │     SÌ → Mostra modale errore (backdrop blur + zoom-in)
  │           Pulsante "Ho capito" → chiude modale
  │           Link "Contatta assistenza"
  │     NO → Chiama POST /api/v1/customer/accounts/closure-request
  │
  └── Backend: isLastActiveAccount(userId)?
        SÌ → ApiBankException("LAST_ACTIVE_ACCOUNT")
        NO → Procede con la richiesta di chiusura
```

### Flow visualizzazione transazioni

```
API response → TransactionResponseDto[]
  ↓
Per ogni transazione: getTxDirection(tx)
  ├── source in miei conti && destination NON in miei conti → "out" (rosso, segno -)
  ├── destination in miei conti && source NON in miei conti → "in" (verde, segno +)
  └── source && destination entrambi in miei conti → "self" (grigio, nessun segno)
```

---

## Struttura Modelli (Database)

```
users ──┬── accounts ──┬── account_limits (6 tipi, unique account+type)
        │              └── cards (DEBIT)
        ├── beneficiaries
        ├── notifications
        ├── notifications (message_key + message_params)
        ├── password_change_requests
        └── user_pins (unique user, 1:1)

transactions ── source_account → accounts
              └── destination_account → accounts
              └── scheduled_date (opzionale)

audit_logs ── performed_by_user_id → users
```

---

## Avvio

### Prerequisiti

- Node.js 20+
- PostgreSQL in esecuzione su `localhost:5432`
- Keycloak in esecuzione su `localhost:8080`
- Backend Spring Boot in esecuzione su `localhost:8081`

### Installazione

```bash
cd javaisland-bank-frontend
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
| Frontend (Angular) | 3000 | http://localhost:3000 |
| Backend (Spring Boot) | 8081 | http://localhost:8081 |
| Swagger UI | 8081 | http://localhost:8081/swagger-ui/index.html |
| Keycloak | 8080 | http://localhost:8080 |
| Keycloak Admin Console | 8080 | http://localhost:8080/admin/master/console/ |
| PostgreSQL | 5432 | jdbc:postgresql://localhost:5432/javaisland_backend |

---

## Forza Logout

Quando un dipendente viene sospeso dall'admin:

1. `AdminEmployeeService.suspendEmployee()` disabilita l'utente in Keycloak
2. `JwtPasswordChangeFilter` controlla lo stato utente su ogni richiesta
3. Se stato != ACTIVE → risposta 401 con `ACCOUNT_SUSPENDED`
4. Frontend interceptor mostra toast con messaggio backend → logout + redirect login
