# Contributing

Thank you for helping improve the Routune Node.js library.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
```

## Generated code

`src/generated/openapi.ts` is generated from `openapi/routune-public.v1.json`. Do not edit it by hand. To update it after an API change:

```sh
npm run generate
```

CI fails when the generated file is out of date (`npm run check:generated`).

## Pull requests

- Keep changes focused and include tests for new behaviour.
- Describe user-facing changes in `CHANGELOG.md`.
- For larger changes, open an issue first so we can agree on the approach.
