# MMM-OneDrive Agent Guide

## Working Rules

- Treat generated outputs as read-only. If a task points at `lib/*.js` or `MMM-OneDrive.js`, make the real change in `src/` and regenerate with `npm run build`.
- Do not edit runtime state files unless the task explicitly requires it. `cache/` and `msal/token.json` are local runtime artifacts and are gitignored.
- Prefer the smallest validation that matches the edited area: targeted Jest tests first, then broader checks only if needed.

## Commands

- `npm run build` regenerates the bundled outputs from TypeScript source.
- `npm run test` runs the Jest test suite.
- `npm run lint` runs ESLint with automatic fixes.
- `npm run install-prod` installs production dependencies for MagicMirror deployments.

## Source Of Truth

- Frontend module code lives in `src/frontend/main.ts` and builds to `MMM-OneDrive.js`.
- Backend source lives in `src/backend/`.
  - `src/backend/lib.ts` builds to `lib/lib.js`.
  - `src/backend/OneDrivePhotos.ts` builds to `lib/OneDrivePhotos.js`.
  - `src/backend/DiskCaching.ts` builds to `lib/DiskCaching.js`.
- Backend and frontend use different TypeScript lib targets. Keep browser-only APIs in frontend files and Node-specific APIs in backend files.

## Tests

- Backend behavior tests live in `src/backend/OneDrivePhotos.test.ts`.
- Frontend behavior tests live in `src/frontend/main.test.ts`.
- Node helper coverage lives in `node_helper.test.ts`.
- Jest maps MagicMirror-specific imports through `tests/logger.mock.js` and `tests/node_helper.mock.js`.

## Useful Docs

- Setup and auth flow: [docs/INSTALL.md](../docs/INSTALL.md)
- Raspberry Pi memory guidance: [docs/MEMORY_SWAP.md](../docs/MEMORY_SWAP.md)
- User-facing configuration options: [README.md](../README.md)

## Related Customizations

- Generated-output protection is enforced in [.github/instructions/generated-build-artifacts.instructions.md](../.github/instructions/generated-build-artifacts.instructions.md).