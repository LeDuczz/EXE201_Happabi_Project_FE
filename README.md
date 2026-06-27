# Happabi Frontend

Happabi Frontend is the web client for a maternity and postpartum care platform. It provides role-specific experiences for mothers, nurses, doctors, and administrators, and connects to the Happabi backend for booking, payment, onboarding, work-session, wallet, notification, feedback, AI chat, and operations workflows.

## Technology Stack

| Area | Technology |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript |
| Build tool | Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| HTTP client | Axios |
| Realtime | Socket.IO Client |
| Icons | Lucide React |
| OCR support | Tesseract.js |
| Authentication | AWS Cognito hosted UI and JWT-backed API sessions |
| Quality | ESLint, TypeScript build checks |

## Product Scope

The application is organized around four operational roles:

- `MOTHER`: discover nurses, create bookings, pay through PayOS, follow work sessions, confirm completion, request cancellation/refund, submit reviews, and send feedback.
- `NURSE`: complete onboarding, manage availability windows, receive bookings, execute work-session checklists, upload evidence, manage wallet/deposit/withdrawals, and report incidents.
- `DOCTOR`: review nurse onboarding hồ sơ, inspect KYC/certification documents, and approve or reject professional verification.
- `ADMIN`: manage users, doctor accounts, platform wallet, withdrawal payouts, incidents, feedback, AI knowledge base, system configuration, audit logs, and business dashboard.

## Key Features

### Authentication and Profile

- Login, register, OTP verification, social callback, and forgot password flows.
- Role-aware layout and navigation.
- User profile pages for mother, nurse, doctor, and admin.
- Phone/email verification UX.

### Mother Experience

- Real mother dashboard backed by API data.
- Nurse search, public nurse profile, nurse comparison, and booking flow.
- Booking payment through PayOS with pending-payment recovery.
- Booking management with upcoming, active, pending, and historical views.
- Work-session completion confirmation and nurse review.
- Cancellation and refund user flows.

### Nurse Experience

- Onboarding flow with profile, KYC, certification, contract, deposit activation, and local OCR support.
- Availability window management.
- Nurse home dashboard with real operational metrics.
- Work-session checklist, check-in, checkout, evidence upload, and incident reporting.
- Revenue and wallet view, deposit, top-up, bank account, and withdrawal request management.

### Doctor Experience

- Nurse onboarding review list and detail pages.
- Document review actions for profile, KYC, and certifications.
- Approval/rejection workflow with professional verification context.

### Admin Experience

- Operations dashboard with GMV, payment volume, platform revenue, payment processing fees, nurse payouts, and net cash contribution.
- User management and doctor account creation.
- Platform wallet and nurse withdrawal payout processing.
- Work-session incident review.
- User feedback review.
- AI knowledge base review and approval.
- System financial configuration for commission and payment gateway fees.
- Audit log browsing.

### Realtime Notification

- Socket.IO connection from the topbar.
- Notification bell with unread count.
- Popup preview for newly received notifications.
- Notification text normalization for Vietnamese UI display.

### AI Chat

- Conversation list, message view, composer, and chat formatting.
- API integration with backend AI chat and knowledge retrieval services.

## Project Structure

```text
src
├── api             # Backend API clients
├── components      # Shared UI and domain components
├── config          # Environment helpers
├── contexts        # Authentication/session context
├── hooks           # Feature-specific React hooks
├── pages           # Route-level pages grouped by role
├── types           # Shared TypeScript contracts
├── utils           # Formatting, validation, API error, notification text
├── App.tsx         # Route configuration
└── main.tsx        # Application bootstrap
```

## Local Development

### Prerequisites

- Node.js compatible with the project dependencies
- npm
- Happabi backend running and reachable
- AWS Cognito configuration for authentication flows

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The Vite development server usually runs on `http://localhost:5173`.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Environment Variables

The frontend reads runtime configuration from Vite environment variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend REST API base URL |
| `VITE_BACKEND_URL` | Optional backend URL fallback |
| `VITE_SOCKET_URL` | Socket.IO server URL |
| `VITE_AWS_REGION` | AWS region |
| `VITE_AWS_COGNITO_USER_POOL_ID` | Cognito user pool ID |
| `VITE_AWS_COGNITO_CLIENT_ID` | Cognito app client ID |
| `VITE_AWS_COGNITO_DOMAIN` | Cognito hosted UI domain |
| `VITE_COGNITO_REDIRECT_SIGN_IN` | Hosted UI sign-in callback URL |
| `VITE_COGNITO_REDIRECT_SIGN_OUT` | Hosted UI sign-out callback URL |
| `VITE_DEV_ALLOWED_HOSTS` | Optional Vite dev server allowed hosts |

Do not commit production secrets or environment-specific credentials.

## API Contract Style

- API clients are grouped by business area under `src/api`.
- Types are normalized at the boundary where practical.
- User-facing text is Vietnamese in the frontend, while backend business messages remain English.
- Date, money, status, and notification formatting should be handled in frontend utilities/components.

## Production Notes

- Build artifacts are static and can be served by Nginx, Caddy, or another static web server.
- Authentication depends on Cognito and backend JWT validation.
- Realtime notification delivery requires the configured Socket.IO endpoint.
- Critical business correctness is enforced by the backend; frontend validation is for UX only.
- Keep all mock data out of production-facing pages unless explicitly marked as demo.

## Quality Gates

Recommended checks before merging:

```bash
npm run build
npm run lint
```

Manual QA should cover:

- Login/register/OTP by role.
- Mother booking and payment recovery.
- Nurse onboarding, availability, work-session, and wallet flows.
- Doctor nurse-review flow.
- Admin dashboard, wallet, incident, feedback, knowledge base, and system config pages.
- Realtime notification popup and notification list.
