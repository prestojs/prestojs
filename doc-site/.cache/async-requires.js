// prefer default export if available
const preferDefault = m => m && m.default || m

exports.components = {
  "component---src-pages-docs-js": () => import("./../src/pages/Docs.js" /* webpackChunkName: "component---src-pages-docs-js" */),
  "component---src-pages-api-js": () => import("./../src/pages/Api.js" /* webpackChunkName: "component---src-pages-api-js" */),
  "component---src-pages-404-js": () => import("./../src/pages/404.js" /* webpackChunkName: "component---src-pages-404-js" */),
  "component---src-pages-index-js": () => import("./../src/pages/index.js" /* webpackChunkName: "component---src-pages-index-js" */)
}

