# !! Template Setup Checklist !!
### [Project Creation Checklist](doc/checklist.md)

* TEMPLATEFIXME: remove or update this section after template setup is completed.


# My Project
* [Overview](#overview)
    * [Purpose](#purpose)
    * [Tech Stack](#tech-stack)
* [Architecture](#architecture)
    * [User Signup/Registration](#user-signup-registration)
    * [Code Generation](django-root/codegen/README.md)
* [QA](#qa)
* [Sentry](#sentry)
* [Development](#development)
    * [Staging](#staging)
* [Deployment](#deployment)

master: [![build status](https://gitlab.internal.alliancesoftware.com.au/alliance/template-django/badges/master/build.svg)](https://gitlab.internal.alliancesoftware.com.au/alliance/template-django/commits/master)

## Overview

### Purpose
* TEMPLATEFIXME: Update this section

A web app for generating widgets

Key functionality
* Do things
    * Do little things
    * Do big things
* Play music
    * Music is sourced from a microphone hooked up to a jukebox
    * Email user when music has finished playing


### Tech Stack
* TEMPLATEFIXME: Update this section
* Hosted at XYZ
* Ubuntu 16 LTS
* nginx + gunicorn
* Python 3.7.3
    * Django 2.2
* Bootstrap
* React 16
    * Redux
    * ImmutableJS
    * ant.design
* MySQL 8.0
* Postgres 10
* node 10 (dev only)
    * webpack build

## Frontend

### SVG support

Import svg's either as a URL or convert to a react component:

```js
import svgUrl from './icon.svg';
// data:image/svg+xml;base64,PD94bW....
import { ReactComponent as Icon } from './icon.svg';
// Usage as any other component
<Icon />
```

See [svgr](https://github.com/smooth-code/svgr).

## Architecture
* TEMPLATEFIXME: Update this section
* Mostly ReactJS
    * Multiple Single Page Apps
* Note that
* Interesting things
* Javascript for the entire site is aggregated using `django-compress`
* Admin is accessible only to staff
    * `django-stronghold` means login required by default

### User Signup/Registration

TEMPLATEFIXME: Review user sign-up

* New users can sign-up at `<app-root>/signup/`, and the login prompt will provide a link to the sign-up form
* When a user completes the signup form, they will be sent an email containing an activation link. The email template for the activation email is located in:
`<core-app>/templates/email/user_signup_activation.html`
* The activation link is valid for `settings.USER_ACTIVATION_TOKEN_MAX_AGE_DAYS` days, if a user attempts to use an expired activation link they will be prompted to sign-up again
* A sign-up attempt on an existing user record (identified by email address) will succeed if that user account has not been activated, otherwise it will fail

### User Profiles

#### User
* The core `User` table stores auth login details
    * email is username

#### Profile
* One of two types of profiles will be attached to a user (can still create plain User for super user if necessary)
    * Uses `allianceutils`' [GenericUserProfile](https://gitlab.internal.alliancesoftware.com.au/alliance/alliance-django-utils#genericuserprofile)
    * Two profile tables:
        * `CustomerProfile`
        * `AdminProfile`
    * Each profile has a `user_type` field which is used to define the set of permissions that the user has

#### Group
* Django `Group` table is not used
    * For this particular project the `user_type` field on the profile performs the function that django's `Group` records usually do (attaching permissions to a `User`)

#### Permissions
* A custom `CSVPermissionsBackend` provides permission checks
    * `settings.CSV_PERMISSIONS_PATH` defines a CSV file containing permissions definitions
    * The motivation behind this is to
        * be able to provide a summary of access control to the client that they can understand
        * be able to easily enumerate all possible permissions in the system
        * reduce the number of custom permission functions
            * most permissions checks fit into a standard pattern
* The permissions CSV file is parsed on server startup
    * If there are any validation errors then the server will refuse to start
    * Definitive file format can be found in `csv_permissions.permissions._parse_csv()`
    * Each permission must be defined as a global or per-object permission
        * calling `has_perm()` with an object for a global permission will raise an exception
        * calling `has_perm()` without an object for a per-object permission will raise an exception
    * Possible values for a cell in the spreadsheet:
        * `yes` - user type has this global permission
        * `all` - user type has access to all records
        * `own` - user type has access only to records it owns
        * `own: func` - user type has access only to records it owns, use `func` to determine if they own it
        * `custom: func` - user type should invoke `func` to determine if user has this permission
        * `` - user type does not have this permission

## QA

* TEMPLATEFIXME: Update this section based on agreed level of QA from client workshop(s)

Testing Expectations

* Automated Unit Tests
    * All Business Logic
    * Factories for all models and smoke tests to ensure factories work
    * No frontend unit tests
* Automated End to End Tests
    * Using Cypress for E2E tests
    * Basic tests for X, Y, Z sections: (TEMPLATEFIXME: identify which sections/screens)
* Manual Tests
    * Formal test scripts for X, Y, Z sections: (TEMPLATEFIXME: identify which sections/screens)
    * Ad-hoc tests by dedicated QA person for remaining features
* Regression Tests
    * Automatically running all automated tests on checkin via CI
    * Not running full manual test suite before each release

## Sentry

[Sentry](https://sentry.io) is used to capture errors for python on staging/production.

To setup on Heroku, install the Sentry Addon (Free Tier for staging, choose appropriate one for production)
To setup on elsewhere, visit sentry website and create an account with your project email address, then set env vars:

```
SENTRY_DSN="<DSN FROM SENTRY PROJECT FOR DJANGO>"
SENTRY_DSN_JS="<DSN FROM SENTRY PROJECT FOR JS>" #Optional
```

After the Initial setup, modify your ``./frontend/sentry.properties`` file and change the org/project to new
values.

Sentry has the concept of releases which we set to the current git commit short hash. You can match up errors
from Sentry to the commit they were deployed from (eg. any issue raised against that release could have been
 introduced from changes from that release hash to the prior release hash).

To allow better debugging Sentry needs source maps so it can provide detailed stack trace. To achieve this
as part of the frontend build we generate source maps, upload them to Sentry (using [@sentry/webpack-plugin]
(https://github.com/getsentry/sentry-webpack-plugin)) and then remove them so we don't deploy them (see
`postbuild` step in `package.json`). Note that we retain the source maps in the
 `frontend/dist-source-maps/` in case required - they are just remove from `frontend/dist/` so
they don't end up accessible in production.

In order for this to work when you run a build you need to have a token setup to access the API. If you don't
have this the build will prompt you to set it up before continuing. To set this up at any time run:

```bash
SENTRY_PROPERTIES=./frontend/sentry.properties yarn sentry-cli login
# Check TT to see if your project already has a token. If not, create one and record it in TT.
# Verify this works:
SENTRY_PROPERTIES=./frontend/sentry.properties yarn sentry-cli projects list
SENTRY_PROPERTIES=./frontend/sentry.properties yarn sentry-cli releases list
```


If you want to run a build without sending artifacts to Sentry then use this command:

```bash
yarn build --disable-sentry
```


## Development

### Install Dependencies

* Setup git hooks. This adds a pre-commit hook to lint your code.

```bash
cd .git
rm -rf hooks
ln -s ../git-hooks hooks
```

* Install OS packages
    * TEMPLATEFIXME: Update this section

```bash
brew install nonstandard-package1
brew install nonstandard-package2
# (Don't need to list DB packages or core python here; they are assumed)
```

* Create & activate a python virtualenv
    * Assumes a working OSX brew-based `pyenv` + `pyenv-virtualenvwrapper` install
```bash
bin/init-dev-virtualenv.sh
```

* Activate node version (`nvm use`)
* Install package dependencies:

```bash
yarn install
pip install -r requirements.txt
pip install -r requirements/dev.txt
```

### Configuration
* If you get an `Unrecognised host` error
    * Add your hostname & platform (macOS is `'darwin'`) to `_dev_hosts` in `django-root/django_site/settings/__init__.py`
* (mysql only) Add database username/password to `django-root/django_site/settings/dev.py` (will read from `~/.my.cnf` if not specified)
* For environmental variables, you can create a .env file in your project root and it'll be used by the project.
    * Use .env.sample as a reference for common env variables you want to set.
    * OS-level env variables has a higher priority over .env, ie, if a value's set by OS (or heroku), the same value in .env will be ignored.

### Database Setup

* Run `bin/resetdb.sh`
    * CAUTION: If you are using a `~/.my.cnf` settings file, make sure you have not pointed it at a previous database or you will overwrite it

* Fixtures:
    * `init` - core reference data that shouldn't be edited but should be in the DB (eg postcodes)
    * `groups` - groups & their permissions. This is used to
    * `dev_users` - users for testing purposes
    * `dev` - application data for testing purposes

* To generate and update fixtures you need for the app, see: https://docs.djangoproject.com/en/2.2/ref/django-admin/#dumpdata
    * an --indent of 4 is recommended to keep output readable
    * see the section above for fixture naming conventions
    * eg: `./manage.py dumpdata -a --indent 4 --natural-foreign --output xenopus_frog/fixtures/init.json xenopus_frog`


### Dev Servers

* Webpack dev server

```bash
yarn dev
```

* Django server

```bash
cd django-root
./mange.py runserver_plus
```

### Testing

* Full run
```bash
bin/run-tests-django.sh
```

* Fast run
    * Expects DB migrations to be up-to-date
```bash
bin/run-tests-django.sh --keepdb --nomigrations
```

#### E2E Testing
TEMPLATEFIXME: Update this section

TODO: update with cypress instructions when added

Run tests

TODO: update with cypress instructions when added

#### Manual Testing

See [Manual Tests](doc/manual-tests.md)

### Staging
* Staging environment is located at tt:client=123#account_1234
    * You can also use TT links like tt:client=123 tt:staff=123 tt:wiki=Hello_World
* To copy live DB to staging:
    * run `~/bin/resetstaging.sh`
    * (Heroku) Use [pg:copy](https://devcenter.heroku.com/articles/heroku-postgres-backups#direct-database-to-database-copies) to copy data from production to staging
    * (Heroku) `heroku pg:copy test-django-template-production::FIXME FIXME --app test-django-template-staging`

## Deployment
* TEMPLATEFIXME: Update this section

* Deployed on Rackspace
    * nginx frontend web server
    * gunicorn fastcgi wsgi behind nginx
* gunicorn configured as a system daemon called `myproject`
* Site settings are in `~/env`

### Production Build

* Build assets

```bash
yarn build
```

* Commit changes and push to `master` branch

### Update Server

#### Staging Deployment

* Reset the staging DB from live DB (see [Staging](#staging) )
* Follow instructions for a live deployment with the following changes:
    * Don't create a `sendlive` tag; check out `stage` branch instead
    * Can skip maintenance mode
    * Deployment directory is `~/stagingsite`
    * Service to reload is `myprojectstaging`

* Heroku Deployment
    * [Push to heroku remote](https://dashboard.heroku.com/apps/test-django-template/deploy/heroku-git#deploy-heroku-git)

#### Live Deployment

* Tag and push the release: `git tag sendlive/YYYYMMDD-hhmm && git push --tags`
* SSH to the server using details at tt:accountId=1234
* Create a DB backup
    * `~/bin/dbdump.sh`
* Verify that there are no uncommitted changes on the server
    * `cd ~/livesite && git status`
* Enable maintenance mode
    * ???
* Update code

```bash
cd ~/livesite
git fetch
git checkout sendlive/YYYYMMDD-hhmm
bin/venv-update venv= [TEMPLATEFIXME: venv location] install= -r requirements.txt
cd django-root
./manage.py migrate
./manage.py collectstatic
# sysvinit:
service myproject reload
# systemd:
systemctl --user restart myservice
```

* Verify server is working
    * `systemctl --user status myservice`
    * Load website (TEMPLATEFIXME: ...)
* If something goes wrong
    * Checkout previous sendlive tag
    * Restore DB if necessary
* Disable maintenance mode

* (Heroku) Promote staging to live
    * `heroku pipelines:promote --app test-django-template-staging`
