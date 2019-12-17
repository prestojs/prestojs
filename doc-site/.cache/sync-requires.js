const { hot } = require("react-hot-loader/root")

// prefer default export if available
const preferDefault = m => m && m.default || m


exports.components = {
  "component---src-pages-docs-js": hot(preferDefault(require("/Users/fang/377bin/froggies/xenopus/doc-site/src/pages/Docs.js"))),
  "component---src-pages-api-js": hot(preferDefault(require("/Users/fang/377bin/froggies/xenopus/doc-site/src/pages/Api.js"))),
  "component---src-pages-404-js": hot(preferDefault(require("/Users/fang/377bin/froggies/xenopus/doc-site/src/pages/404.js"))),
  "component---src-pages-index-js": hot(preferDefault(require("/Users/fang/377bin/froggies/xenopus/doc-site/src/pages/index.js")))
}

