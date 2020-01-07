# Documentation Site

* Some docs are generated from type definitions. Run `extract-docs.js` to generate these. See `Api.js` for example of where these are used.
* Override the automatic docs by defining a .mdx file in `data/` and set the `slug` frontmatter to match the generated slug. See `Form.mdx` for an example.
* For component docs use `react-view` where appropriate. See `Form.mdx` for an example.
* Live code editor without knobs is also available - use code blocks with a `live=true` metastring. See `FormItem.mdx` for an example.
* For the main 'Docs' section see `Docs.js`. Content should be added to `content/docs` - see examples there for structure.
