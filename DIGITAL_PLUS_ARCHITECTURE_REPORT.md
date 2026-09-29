# DIGITAL+ CURRENT ARCHITECTURE REPORT

## 1. Current Stack
- **Frontend**: React Native (Expo) for mobile, Expo Router for web, TypeScript.
- **Backend / API**: Supabase (PostgreSQL) providing authentication, RLS policies, and serverless functions.
- **Database**: PostgreSQL hosted on Supabase.
- **State Management**: Zustand stores (`useAppDataStore`, `useAuthStore`, etc.).
- **Styling**: Tailwind-like utility classes via custom CSS (`global.css`).
- **Deployment**: Expo EAS for mobile builds, Vercel for web (via `expo-router`).

## 2. Frontends
- **Mobile App** (`app/` and `src/`): Uses Expo, React Navigation, and custom UI components.
- **Web App** (`app/` with file‑based routing): Shares most React components with mobile.
- **No existing WhatsApp UI** – integration will be server‑side only.

## 3. Backend / API
- Supabase provides auth (`auth.users`), RLS policies, and a set of tables (profiles, wallets, transactions, categories, budgets, goals, bills, plans, whatsapp_accounts, whatsapp_messages).
- No custom server code yet; all data access is via Supabase client in the app.

## 4. Supabase Schema & Auth
- **Profiles** table extends `auth.users` (one‑to‑one).
- **Wallets**, **Transactions**, **Categories**, **Budgets**, **Goals**, **Bills**, **Plans** are all linked to `profiles.id` via `user_id`.
- **RLS** policies enforce that each user can only access their own rows (see `schema.sql`).
- **Triggers**: `handle_new_user` creates a profile on sign‑up.
- **WhatsApp tables** already exist (`whatsapp_accounts`, `whatsapp_messages`) with proper RLS.

## 5. Financial Business Logic
- Core logic lives in client‑side stores (`useAppDataStore.ts`).
- Functions for creating, updating, deleting wallets, transactions, budgets, etc., call Supabase directly.
- Balance calculations are performed locally by recomputing from `baseWalletBalances` and transaction lists.
- No dedicated service layer; business rules are scattered across store actions.

## 6. Existing Reusable Services
- `src/core/services/exportService.ts` provides CSV/PDF export utilities.
- No generic API wrapper; each store directly uses `supabase.from(...)`.

## 7. Security Controls
- Row‑Level Security (RLS) policies for every table, restricting access to the authenticated user.
- No server‑side validation beyond Supabase constraints; client performs most checks.
- Secrets (Supabase URL/key) are stored in environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

## 8. Deployment Setup
- **Mobile**: `expo start`, `expo run:android/ios`, EAS build profiles in `eas.json`.
- **Web**: `expo start --web`, deployed via Vercel (continuous deployment from GitHub).
- **CI/CD**: GitHub Actions trigger EAS builds and Vercel deployments on push.

## 9. Gaps for WhatsApp Integration
- **Service Layer**: No unified server‑side service layer; WhatsApp backend will need its own API to call existing Supabase tables safely.
- **Validation**: Business‑logic validation is client‑side only; a backend endpoint must centralize validation for WhatsApp.
- **Webhook Endpoint**: No existing HTTP endpoint for inbound WhatsApp messages.
- **Environment Variables**: Missing WhatsApp credentials (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, etc.).
- **Idempotency**: No mechanism to deduplicate webhook events.
- **AI Layer**: Not yet implemented; will be added in later stages.

## 10. Recommended Architecture for WhatsApp
- Add a lightweight Node.js/Express (or Supabase Edge Function) service that:
  1. Exposes `/api/whatsapp/webhook` (GET/POST) with proper verification.
  2. Authenticates requests using the WhatsApp access token.
  3. Calls existing Supabase tables via the Supabase client (server‑side) to enforce RLS and validation.
  4. Implements idempotent processing using `whatsapp_message_id`.
  5. Returns structured responses that the bot can send back via the Cloud API.

---
*Report generated automatically for Stage 0 – Project Discovery and Audit.*
