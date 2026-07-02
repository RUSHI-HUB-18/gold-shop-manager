# Gold Shop Manager - Jewellery Shop Management System

Gold Shop Manager is a premium, full-stack Next.js web application designed to help jewelry store administrators manage daily gold rates, catalog items, and quickly calculate transparent pricing for customers.

The live application is hosted at: **[https://goldshop-portal.netlify.app](https://goldshop-portal.netlify.app)**

---

## 🌟 Features
- **Real-Time Calculator**: Instantly calculate final jewelry prices including daily gold rate, making charges, and GST.
- **Dynamic Dashboard**: View daily calculation statistics, active catalog items, and today's gold rate at a glance with shimmer skeleton loading.
- **24-Hour Rate Reset**: Enforces daily gold rate updates. If a new day begins, calculations are halted until the admin enters the fresh rate.
- **History Logs**: Every calculation is saved securely with powerful search and filtering (by purity, user, date).
- **Secure Authentication**: Custom authentication system with secure JWT tokens, bcrypt password hashing, password strength enforcement, and OTP password resets.
- **Admin Settings**: Configure global GST percentages and manage catalog items (add, edit, delete).

---

## 🏗️ Project Architecture

This application is built with a feature-ready, maintainable, and scalable architecture designed for seamless future expansions (e.g. Billing, Customers, Inventory modules).

### Folder Structure

```text
src/
├── app/                  # Next.js pages and API routing
│   ├── admin/            # Guarded admin panels
│   └── api/              # Backend endpoint handlers
├── components/           # Larger components and layouts
│   └── ui/               # Reusable base atomic UI elements (Button, Input, Alert, Spinner, Card, Skeleton)
├── hooks/                # Custom React hooks (useLoading, useAuth)
├── services/             # Core business service actions (authService, calculatorService, settingsService)
├── utils/                # Standardized utility helpers (currency, date, validation, format, api, logger)
├── constants/            # Global constant lookup charts
├── types/                # Shared typescript models and interfaces
├── config/               # Application configuration constants (branding, metadata)
└── lib/                  # Database client instantiation (Prisma helper)
```

### Architectural Principles

1. **Services Layer**: Business logic and network API operations reside in `src/services/` rather than UI components.
2. **React Hooks**: Hooks (under `src/hooks/`) are strictly reserved for managing React state and UI triggers.
3. **Utility Split**: Formatting, validation, logging, and networking are divided into dedicated modules (`currency.ts`, `date.ts`, `validation.ts`, `format.ts`, `api.ts`, `logger.ts`) instead of being bundled in a single file.
4. **No Over-engineering**: Abstractions are only created when there is code duplication or an immediate future module dependency.

---

## 🔐 Authentication & Session Flow

The system employs a secure cookie-based session framework:
1. **JWT Session Token**: Created on login/registration, encrypted, and written to a secure `httpOnly` cookie (`auth_token`).
2. **Edge Route Protection**: `src/middleware.ts` runs on the Next.js edge runtime, validating the cookie presence for all `/admin/*` paths. Unauthenticated requests are immediately redirected back to the sign-in screen `/`.
3. **API Integrity Interceptor**: All `/api/*` endpoints query Prisma and verify JWT signatures. The client-side `apiClient` checks for `401 Unauthorized` responses and automatically redirects the browser to `/` to clean the cache.
4. **Console-Only OTP Logging**: OTP passcodes are printed exclusively to the server console to prevent exposure to front-end HTTP inspectors.

---

## 🛠️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RUSHI-HUB-18/gold-shop-manager.git
   cd gold-shop-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add your connection string and a random secret:
   ```env
   DATABASE_URL="postgresql://username:password@host/database"
   JWT_SECRET="your-secure-random-jwt-secret-key"
   ```

4. **Initialize the Database**:
   ```bash
   npx prisma db push
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Build & Deployment

### Production Build
Generate an optimized Next.js build locally:
```bash
npm run build
```
This runs `prisma generate && next build` to compile client pages and statically optimize routes.

### Netlify Deployment
1. Import your GitHub repository into Netlify.
2. Set the `DATABASE_URL` and `JWT_SECRET` variables in the Environment Variables section.
3. Specify the build command: `prisma generate && next build`
4. Set the publish directory to `.next` (handled by the Netlify Next.js adapter).
5. Deploy!

---

## 📋 Future Roadmap

Future phases of Gold Shop Manager will introduce:
1. **Customer Management**: Profile store customers and link purchase histories.
2. **Billing System**: Draft bills, calculate discounts, and configure invoice logs.
3. **Invoice/PDF Printing**: Generate professional, downloadable PDF receipts.
4. **Reports & Dashboard**: Advanced calculations, gold usage tracking, and daily sales metrics.
5. **Backup & Restore**: Backup inventory and log records securely.
