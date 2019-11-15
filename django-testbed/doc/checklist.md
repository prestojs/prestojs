# Project Creation Checklist

- [ ] Create gitlab group (if not already created)
    - [ ] Ensure group is private
    - [ ] Ensure group has an icon
- [ ] [Fork template repository](https://gitlab.internal.alliancesoftware.com.au/alliance/template-django/forks/new) into new group
    - note that fork is different to import; we want to use fork to preserve non-git repo metadata
    - [ ] Rename forked project name & URL
    - [ ] Confirm new project visibility is set to private
    - [ ] Remove fork relationship so that merge requests do not try to merge with upstream template (gitlab Settings -> General -> Advanced -> Remove fork relationship)
- [ ] Check out repo
    - [ ] Activate git hooks [^1]
- [ ] Documentation
    - [ ] Update `logo.png`
    - [ ] Add `django-root/django_site/static/favicon.ico` ([helpful converter](https://realfavicongenerator.net/))
    - [ ] Read through `README.md` and update all relevant sections. If unsure of something, leave a `TODO`
- [ ] Python setup
    - [ ] Decide on the [python version](https://alliancesoftware.atlassian.net/wiki/spaces/TEC/pages/31686658/Version+Selection)
    - [ ] Update .python-version, runtime.txt for selected python version
    - [ ] Update `.venv` with the name of the virtualenv. This name will be shared with other developers, so use something sensible and unambiguous (`reponame`, or `clientname-reponame`)
    - [ ] Create virtualenv: run `bin/init-dev-virtualenv.txt` and confirm details when prompted
    - Update to latest requirements
        - [ ] Run `requirements/freeze.sh`
        - [ ] Commit `requirements/requirements.txt`
- [ ] Frontend / NodeJS setup
    - [ ] `nvm use && yarn install`
    - [ ] Review `frontend/webpack.project.config`
    - [ ] Commit `yarn.lock`
- [ ] Project config
    - [ ] Search codebase for TEMPLATEFIXME and make necessary changes
- [ ] Core app config
    - [ ] Run `bin/init-core-app.py` to create your core app
        - [ ] review your models, and create initial migrations for the new app
        - [ ] user profile models (inc user factory)
        - [ ] TODO: flesh this out
    - [ ] create `dev.json` fixture(s)
    - [ ] create `groups.json` fixture(s)
- [ ] Deploying to Heroku?
    - Yes:
        - [ ] Follow [Heroku Deployment](https://alliancesoftware.atlassian.net/wiki/spaces/TEC/pages/21987346/Heroku+Deployment) setup checklist
        - [ ] Add Sentry addon to your heroku app
    - No:
        - [ ] Review logging configuration in base.py to ensure logs are set up correctly. The default assumes a heroku deployment which implies stream logging, which may not be correct for e.g. a VM deployment.
- [ ] Template Feedback: If you ran into any problems with the template, fix in the template repo and create a merge request. If this is going to take more than 3 hours to do then you may raise an issue without a fix in the template project.

## git hooks
[^1]: activating git hooks
```bash
cd .git
rm -rf hooks
ln -s ../git-hooks hooks
```

