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
| @angular/animations | 22 | Transizioni pagine + toast |

---

## Architettura del Progetto

```
src/app/
├── core/
│   ├── animations/        # Route transition animations (fade+slide)
│   ├── components/
│   │   ├── empty-state/   # Shared empty state component (8 @Input)
│   │   ├── skeleton/      # Skeleton loader (4 varianti)
│   │   └── toast/         # Toast notification component
│   ├── guards/            # Auth guard + role guard
│   ├── interceptors/      # Bearer token injection
│   ├── models/            # 21 DTO interfaces (8 domini)
│   └── services/          # 4 servizi API (auth, customer, employee, toast)
├── layout/
│   └── layout.*           # Shell: sidebar + bottom nav + toast + route animation
├── pages/
│   ├── auth/              # Login + Registrazione
│   ├── customer/          # Dashboard, Conti, Transazioni, Beneficiari, Carte, Limiti
│   └── employee/          # Dashboard, Registrazioni, Conti, Carte, Limiti
├── app.routes.ts          # Routing completo con guard
├── app.config.ts          # Bootstrap providers (provideAnimations)
└── app.*                  # Root component
```

---

## Design System

### Palette — Prussian Blue + Warm Gold

| Token | Colore | Uso |
|---|---|---|
| `--bi-navy` | `#0a192f` | Primario, headers, testi |
| `--bi-navy-light` | `#172a45` | Variante chiara |
| `--bi-gold` | `#e5a93c` | Accent, CTA, brand |
| `--bi-gold-light` | `#f0c264` | Hover states |
| `--bi-green` | `#10b981` | Successo, depositi |
| `--bi-red` | `#ef4444` | Errore, prelievi |
| `--bi-bg` | `#f4f6f8` | Background principale |
| `--bi-surface` | `#ffffff` | Card, pannelli |

### Font

- **Plus Jakarta Sans** (Google Fonts) — font principale
- **SF Mono / Cascadia Code** — codici IBAN, numeri carta

### Componenti UI

| Componente | Descrizione |
|---|---|
| **Account Card Carousel** | Carosello con effetto mazzo, peek preview su entrambi i lati, animazione `cubic-bezier(0.23, 1, 0.32, 1)` |
| **Dashboard Mini-Carousel** | Versione compatta del carosello per la dashboard |
| **2-Column Grid Layout** | Layout sidebar + contenuto per dashboard e pagine con pannelli informativi |
| **Summary Bar** | Barra riepilogativa con statistiche (conti, saldo, transazioni) |
| **Sidebar Panels** | Quick actions, security tips, policy explainer, help contacts |
| **Toast Notifications** | Notifiche slide-in con auto-dismiss (success/error/info/warning) |
| **Skeleton Loader** | Placeholder animato per caricamento (card/table/stats/lines) |
| **Empty State** | Componente condiviso per stati vuoti con icona, titolo, messaggio, azione |
| **Page Transitions** | Animazioni fade+slide (250ms) tra le pagine |
| **Bottom Nav** | Navigazione mobile con 4 icone + indicatori attivi |
| **Sidebar** | Slide-in drawer su mobile, fisso su desktop, con avatar e badge ruolo |

### Accessibilita'

- Skip-to-content link
- `aria-label` su navs, forms, buttons
- `role="alert"` su messaggi di errore
- `:focus-visible` con gold outline per navigazione tastiera
- `prefers-reduced-motion` per disabilitare animazioni
- `prefers-color-scheme: dark` per dark mode automatico

### Breakpoints

| Breakpoint | Layout |
|---|---|
| **< 768px** (mobile) | Top bar + hamburger + bottom nav. Carosello compatto. Grid 1 colonna. |
| **≥ 768px** (tablet) | Sidebar fissa. Grid multi-colonne. Carosello con peek. |
| **≥ 1200px** (desktop) | Layout 2 colonne con sidebar. Carosello con peek completo. |

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

## Avvio

### Prerequisiti

- Node.js 20+
- PostgreSQL in esecuzione su `localhost:5432` (via Docker: porta `5433`)
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
| PostgreSQL | `5433` | jdbc:postgresql://localhost:5433/javaisland_backend |

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
