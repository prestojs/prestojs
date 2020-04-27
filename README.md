# Presto

Successor to djrad.

## Architecture

* typescript compiled with babel

## Monorepo

This is a monorepo. Structure:

* `js-packages` - all packages to be published to NPM go here. Managed with [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/)
* `python-packages` - all packages to be `pip` installed go here
* `django-testbed` - clone of the django template project for testing things end to end. all `js-packages` can be imported and any python django apps should be symlinked in `django-root`.

### Releases

TODO: Fill out more as we know what we are doing

```bash
yarn publish
```

### Initial setup

* Install dependencies

```bash
yarn install
```

* Create django virtualenv

```bash
./bin/init-dev-virtualenv.sh
```

### Installing new dependencies

See [lerna add](https://github.com/lerna/lerna/tree/master/commands/add#readme)

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

Then start a django dev server like normal:

```bash
./manage.py runserver
```

## Tests

Frontend tests are run using jest.

```bash
yarn test
```

## Build

```bash
yarn build
```

This will compile code with babel and generate typescript definitions.
