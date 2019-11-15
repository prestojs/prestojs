# Manual Tests

## Webpack

- [ ] Do js source maps work?
    - Add a `console.log` in App.js render and see if it maps to correct file and location in Chrome
- [ ] Do css source maps work? 
    - Inspect the main App wrapper in Chrome element inspector and see if styles map to correct file and location
- [ ] Does hot reload work?
    - Change text in `WelcomeView.js` and see it reflects on screen without hard refresh
- [ ] Do build errors show in browser or silently ignored?
    - Add a syntax error to App.js and see it's shown in browser
- [ ] Are ant / djrad less vars properly used?
    - Change `@primary-color` in _variables.less, observe change on login button
- [ ] Does production build work?
    ```bash
    yarn run build
    cd django-root
    ./manage.py collectstatic_djrad && ./manage.py collectstatic --no-input
    DEBUG=0 ./manage.py runserver --insecure --noreload 0.0.0.0:8000
    ```
    - Visit [http://127.0.0.1:8000/app/](http://127.0.0.1:8000/app/) and verify build works
- [ ] Is CSS optimized?
    - inspect build .css manually and check it looks compressed etc
- [ ] Has js been minified?
    - TODO: Not sure best way to verify this one
