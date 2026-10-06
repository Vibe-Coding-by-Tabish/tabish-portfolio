# Testing

Framework: [Playwright](https://playwright.dev) (`@playwright/test` 1.63), end-to-end only.

```bash
npm test                      # builds, serves via `vite preview` on :4173, runs all specs
npx playwright test --ui      # interactive runner
npx playwright install chromium   # first-time browser download
```

## Layout

- `e2e/*.spec.ts` — specs. Every test runs in two projects: `desktop` (1280×720) and `mobile` (375×812, touch).
- `e2e/smoke.spec.ts` — homepage, resume route, theme toggle.
- `e2e/*.regression-N.spec.ts` — one file per fixed bug, headed with a `Regression:` comment naming the issue.

## Conventions

- Select by role and accessible name (`getByRole('button', { name: 'Open menu' })`), fall back to section ids (`#projects`).
- Use `test.skip(isMobile, ...)` / `test.skip(!isMobile, ...)` for controls that only exist at one breakpoint.
- Assert observable state (scroll position, `data-theme`, document width), not implementation details.
- No fixtures or teardown needed: the site is static and stateless apart from the theme stored in the browser.

## Layers

| Layer | Status |
|-------|--------|
| Unit | none (components are presentational) |
| E2E | Playwright, desktop + mobile |
| CI | `.github/workflows/test.yml` on push and pull_request |

Aim for 100% coverage of user-facing behavior: test new interactions, every regression, and both branches of breakpoint-specific UI.
