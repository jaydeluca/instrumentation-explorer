# Testing

## Unit Tests

Run the unit tests to verify the redirect logic:

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode
npm run test

# Run unit tests once
npm run test:run
```

The tests cover:
- URL parameter parsing and restoration
- Base64 encoded instrumentation parameters
- Hash fragment preservation
- Edge cases and error handling

## E2E Tests

Run end-to-end tests with Playwright:

```bash
# Install Playwright browsers (one-time setup)
npm run install-browsers

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e-ui
```

## Test Files

- `frontend/src/utils/githubPagesRouting.test.ts` - Unit tests for redirect utilities
- `frontend/src/test/githubPagesRedirect.test.ts` - Integration tests for redirect logic
- `frontend/src/test/e2e/githubPagesRedirect.spec.ts` - End-to-end Playwright tests
- `test-github-pages-redirect.mjs` - Demonstration script

## Running All Tests

To run the complete test suite:

```bash
npm run test:all
```

This runs:
1. Unit tests
2. Build verification
3. E2E tests

## CI Integration

The tests are integrated into the CI pipeline (`.github/workflows/ci-build.yml`):
- **Unit tests** run on every PR automatically
- **Linting** ensures code quality standards
- **E2E tests** run on every PR to verify the redirect flow works
- **Build verification** ensures the fix doesn't break the build process

The CI workflow runs:
1. Data processing validation
2. Frontend linting (`npm run lint`)
3. Unit tests (`npm run test:run`)
4. Build verification (`npm run build`)
5. E2E tests (`npm run test:e2e`)