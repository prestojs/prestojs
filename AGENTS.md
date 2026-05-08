# AGENTS.md

## Scope

This repository is a Yarn workspaces monorepo. For current work, focus on:

- `js-packages/@prestojs/viewmodel`
- `js-packages/@prestojs/util`

Primary target: `ViewModelCache`.

## Environment / commands

- Node version is pinned in `.nvmrc` (`22`).
- Before running any `yarn` command, initialize Node with `nvm`:

```bash
source ~/.nvm/nvm.sh && nvm use
```

Use this full pattern for tests:

```bash
source ~/.nvm/nvm.sh && nvm use && yarn <command>
```

## High-value files

### ViewModel cache internals

- `js-packages/@prestojs/viewmodel/src/ViewModelCache.ts`
  - Core cache behavior
  - `RecordFieldNameCache` internals
  - listener batching (`defaultListenerBatcher`)
  - public API: `add`, `addList`, `get`, `getAll`, `getList`, `delete`, `deleteAll`, `addListener`

- `js-packages/@prestojs/viewmodel/src/fieldUtils.ts`
  - `normalizeFields`
  - `ViewModelFieldPaths`
  - `CACHE_KEY_FIELD_SEPARATOR`
  - Field-path normalization rules used as cache keys

- `js-packages/@prestojs/viewmodel/src/ViewModelFactory.ts`
  - Static `cache` getter/setter
  - Cache instantiation and custom cache validation

- `js-packages/@prestojs/viewmodel/src/useViewModelCache.ts`
  - React subscription hook built on `cache.addListener`
  - selector memoization/equality behavior

### Util touchpoints relevant to cache behavior

- `js-packages/@prestojs/util/src/comparison.ts`
  - `isEqual` (shallow + `isEqual` interface customization)
- `js-packages/@prestojs/util/src/useMemoOne.ts`
  - used by `useViewModelCache` selector memoization
- `js-packages/@prestojs/util/src/index.ts`
  - export surface for util helpers

### Documentation references

- `doc-site/pages/docs/getting-started/viewmodel.mdx`
  - High-level source of truth for caching semantics
  - Covers partial records, subset/superset behavior, related cache propagation, listeners, and `useViewModelCache`

## Behavior guardrails for ViewModelCache changes

- Preserve normalized-field behavior:
  - primary key fields are always included
  - relation `sourceFieldName` is included when relation fields are requested
- Preserve subset/superset cache semantics (partial records update compatible subsets).
- Preserve relation traversal and nested relation listener propagation.
- Preserve listener batching guarantees (`batch`, `addList`, and nested change propagation).
- Preserve referential stability guarantees where expected (`getAll`, `getList`, selector outcomes in `useViewModelCache`).

## Tests to run

Baseline suite for this focus area:

```bash
source ~/.nvm/nvm.sh && nvm use && yarn test viewmodel
```

Targeted suites:

```bash
source ~/.nvm/nvm.sh && nvm use && yarn test js-packages/@prestojs/viewmodel/src/__tests__/ViewModelCache.test.ts
source ~/.nvm/nvm.sh && nvm use && yarn test js-packages/@prestojs/viewmodel/src/__tests__/useViewModelCache.test.tsx
source ~/.nvm/nvm.sh && nvm use && yarn test js-packages/@prestojs/viewmodel/src/__tests__/fieldUtil.test.ts
source ~/.nvm/nvm.sh && nvm use && yarn test js-packages/@prestojs/rest/src/__tests__/viewModelCachingMiddleware.test.ts
```

## Notes

- Jest runs in-band from root `package.json` (`jest --runInBand`).
- `yarn test viewmodel` also matches rest middleware cache integration tests; keep this in mind when interpreting failures.
- If cache semantics or hook behavior change, update examples/wording in `doc-site/pages/docs/getting-started/viewmodel.mdx` in the same change.
