---
description: "Use when a task touches generated build artifacts, Rollup outputs, or files under lib/. Prevent direct edits to generated JavaScript and route changes back to source files plus rebuild steps."
name: "Generated Build Artifacts"
applyTo: "lib/**/*.js, src/backend/**/*.ts"
---
# Generated Build Artifacts

- Treat files under `lib/` with the auto-generated banner as build outputs, not primary edit targets.
- Do not make direct code changes in `lib/*.js` unless the user explicitly asks to modify generated output.
- When a request points at a generated file in `lib/`, find the owning source in `src/` and make the change there instead.
- After changing the source for a generated `lib/*.js` file, regenerate the output with `npm run build` before finishing when the environment allows it.
- If the generated file is shown only as evidence or a debugging surface, use it to trace behavior, then move the edit to source.