# MMM-OneDrive Agent Guide

## Overview

MMM-OneDrive is a MagicMirror² module that authorizes against Microsoft OneDrive, indexes configured photo albums, caches images locally, and renders them in the MagicMirror browser client.

## Repository Layout

- `src/frontend/main.ts` — browser-side MagicMirror module. Builds to `MMM-OneDrive.js` (and its source map).
- `src/backend/` — Node-side TypeScript implementation.
  - `lib.ts` → `lib/lib.js`
  - `OneDrivePhotos.ts` → `lib/OneDrivePhotos.js`
  - `DiskCaching.ts` → `lib/DiskCaching.js`
  - `msal/` — Microsoft authentication configuration and cache integration.
  - `functions/` — backend helpers.
- `node_helper.js` — MagicMirror Node helper; consumes the generated backend modules in `lib/`.
- `MMM-OneDrive.css` — module styles.
- `src/types/` and `types/` — TypeScript declarations.
- `tests/` — Vitest mocks for MagicMirror-specific dependencies.
- `docs/INSTALL.md` — installation and OAuth device-code authorization flow.
- `docs/MEMORY_SWAP.md` — Raspberry Pi memory guidance.

## Source of Truth and Generated Files

- Make application changes in `src/`, not in generated JavaScript.
- `MMM-OneDrive.js`, `MMM-OneDrive.js.map`, `lib/*.js`, and `lib/*.d.ts` are Rollup outputs. Their generated-file banner is authoritative: do not edit them directly.
- After changing frontend or backend TypeScript, run `npm run build` and include the regenerated outputs when appropriate. CI runs a build and fails if it leaves the checkout dirty.
- Frontend and backend use separate TypeScript configs and runtime targets. Keep browser/DOM code in `src/frontend/` and Node-only APIs in `src/backend/`.

## Development Commands

Requires Node `>=22.21.1 <23` or `>=24` (CI uses Node 24).

```sh
npm ci                 # install locked dependencies
npm run build          # run Rollup and regenerate distributable artifacts
npm test               # run the Vitest suite once
npm run lint:ci        # check ESLint without modifying files
npm run lint           # run ESLint with --fix
npm run install-prod   # production-only install for MagicMirror deployment
```

Use the smallest relevant validation first. Run the full CI-equivalent checks (`npm run lint:ci`, `npm test`, and `npm run build`) for cross-cutting or release-ready changes.

## Testing

- Tests use **Vitest**, not Jest.
- Backend behavior tests: `src/backend/OneDrivePhotos.test.ts`.
- Frontend behavior tests: `src/frontend/main.test.ts`.
- Node-helper tests: `node_helper.test.ts`.
- `vitest.config.mts` aliases `logger` to `tests/logger.mock.ts`; add or update mocks as needed for MagicMirror-only imports.

## Style

- Follow `.editorconfig`: UTF-8, two-space indentation, trailing-whitespace removal, and a final newline.
- ESLint is the formatting and correctness authority. TypeScript tests may use `any` where practical; production code should remain type-safe.
- Existing JavaScript is CommonJS, while source TypeScript uses ES modules. Preserve the conventions of the file you edit.

## Runtime State and Credentials

- Do not edit local runtime state unless the task explicitly calls for it.
- `cache/` holds downloaded images and cached album/config data; only `cache/keep.txt` is tracked.
- `msal/token.json` and credential files are local secrets/runtime artifacts. Never commit tokens, credentials, cache contents, or backup files.

## Documentation and Configuration

- Keep `README.md` aligned with user-facing configuration changes.
- Update `docs/INSTALL.md` for setup or authentication-flow changes.
- Consider `docs/MEMORY_SWAP.md` when changes affect memory use on Raspberry Pi deployments.
- Follow the [MagicMirror module-development documentation](https://docs.magicmirror.builders/module-development/introduction.html#module-development-documentation) and its [source documentation](https://github.com/MagicMirrorOrg/MagicMirror-Documentation/tree/master/module-development) when changing MagicMirror module integration or APIs.

## Git Hygiene

- Inspect `git status` before editing. This checkout can contain unrelated in-progress work; do not revert, overwrite, or stage those changes.
- Avoid modifying generated files except through `npm run build`.
- Do not commit secrets or machine-local files such as `.DS_Store`, `cache/`, or `msal/token.json`.
