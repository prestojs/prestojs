# Contributing

## Architecture

* typescript compiled with babel

## Monorepo

This is a monorepo. Structure:

* `js-packages` - all packages to be published to NPM go here. Managed with [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/)
* `doc-site` - the documentation site published to vercel

### Releases

* All packages are kept in sync to the same version. If 1 package releases all packages do.
* To bump version run `yarn version`. All packages are kept in sync with the `./bin/sync-workspace-versions.js` command which is run automatically when version is changed.
* To publish all packages run `yarn release` - this will do a build and release for everything
    * This will prompt you to enter a one time password for 2FA on npm


### Initial setup

* Install dependencies

```bash
yarn install
```

### Installing new dependencies

See [yarn workspace add](https://github.com/lerna/lerna/tree/master/commands/add#readme)

If you need to add things for dev that aren't part of the actual packages you can do
so with `yarn add -DW`, eg.

```bash
yarn add -DW eslint
```

### Dev server

To build all packages and watch for changes as well as starting the webpack devserver for the
django project run this in the root:

```bash
yarn dev
```

## Tests

Frontend tests are run using jest.

```bash
yarn test
```

## Typescript Tests

* Test using [tsd](https://github.com/SamVerschueren/tsd)
* Loads everything via `tsd_checks/index.test-d.ts`
  * If you add a new file import it there
* Run with `yarn check-types`  
  * This checks type for whole project as well; to just run `tsd` use `yarn tsd tsd_checks`

## Build

```bash
yarn build
```

This will compile code with babel and generate typescript definitions.
