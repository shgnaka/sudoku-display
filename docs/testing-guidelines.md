# Testing Guidelines

## Query priority
- Use `getByRole` / `findByRole` first.
- Use `getByLabelText` for form controls.
- Use `getByText` for user-visible messages.
- Use `querySelector` only when there is no accessible selector.

## Test naming
- Prefer: `条件_操作_期待`.
- Keep names short and behavior-focused.

## `waitFor` usage
- Use `waitFor` only for async state transitions.
- Do not wrap synchronous UI updates in `waitFor`.

## Avoid implementation coupling
- Prefer assertions on behavior (`disabled`, `readOnly`, aria labels, visible text).
- Avoid asserting CSS classes unless class is part of externally required behavior.

## Shared setup
- Use `src/test-utils/renderApp.tsx` for app-level rendering and viewport/hash setup.
- Keep API mocks centralized in shared test utilities.

## Critical tests gate
- Run `npm run test:critical` for high-risk logic areas before full test suite.
- Keep these tests fast and deterministic.
