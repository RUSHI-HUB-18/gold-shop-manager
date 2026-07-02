# Changelog

All notable changes to the **Gold Shop Manager** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-07-02
### Added
- Created a robust folder architecture including folders for components, hooks, services, types, constants, utilities, and config.
- Created central config in `src/config/app.ts` for branding variables.
- Created reusable UI elements under `src/components/ui/` (`Button`, `Input`, `Alert`, `Spinner`, `Card`, `Skeleton`, and `EmptyState`).
- Added customized shimmer skeleton loaders for dashboard widgets.
- Introduced `authService`, `calculatorService`, and `settingsService` layers to separate core business computations and API fetching from page components.
- Extracted centralized typescript models in `src/types/index.ts`.
- Extracted shared constants in `src/constants/index.ts`.
- Added a `__tests__` directory for future unit testing.

### Refactored
- Split local utilities into modular files under `src/utils/` (`currency`, `date`, `validation`, `format`, `api`, `logger`).
- Upgraded the unified `apiClient` fetch helper to support custom timeouts, HTTP methods (GET, POST, PUT, DELETE), automatic JSON parsing, and 401 session ejection interceptors.
- Cleaned up console log statements and replaced them with a central logging wrapper.
- Standardized UI branding across browser tab metadata, sign-in headers, and administration panels.

---

## [0.2.0] - 2026-07-02
### Added
- Split combined registration field into distinct `Email Address (Optional)` and `Mobile Number (Optional)` form inputs.
- Implemented real-time form validation checks with inline UI error notices.
- Configured format checkers for valid email and 10-digit mobile phone numbers.
- Enabled duplication checks for email and mobile phone inputs in register APIs.

### Changed
- Standardized logins to detect email format vs mobile format and query database columns accordingly.
- Enhanced password reset API to find accounts by email or mobile.

---

## [0.1.0] - 2026-07-02
### Added
- Secured all statistical, setting, inventory, and calculation log APIs to validate authentication cookies on requests.
- Integrated authorization middleware route guard inside `src/middleware.ts` for redirecting unauthenticated requests.
- Added active session eviction cookie removal route and back-history clearing client-side logouts.
- Resolved server-side owner identification on calculations logs mapping.
