# Testing Guidelines

## Query priority
- Use `getByRole` / `findByRole` first.
- Use `getByLabelText` for form controls.
- Use `getByText` for user-visible messages.
- For UI tests, do not use `querySelector`/`querySelectorAll`; use role/label/text or explicit `data-testid`.

## Test naming
- Prefer: `条件_操作_期待`.
- Keep names short and behavior-focused.

## `waitFor` usage
- Use `waitFor` only for async state transitions.
- Do not wrap synchronous UI updates in `waitFor`.

## Avoid implementation coupling
- Prefer assertions on behavior (`disabled`, `readOnly`, aria labels, visible text).
- Do not assert CSS classes in UI tests unless the class is part of a documented public contract.

## Shared setup
- Use `src/test-utils/renderApp.tsx` for app-level rendering and viewport/hash setup.
- Keep API mocks centralized in shared test utilities.

## Critical tests gate
- Run `npm run test:critical` for high-risk logic areas before full test suite.
- Keep these tests fast and deterministic.
