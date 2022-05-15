This is a [Next.js](https://nextjs.org/) project 

## Getting Started

The dev server is started when you run `yarn dev` in the root of the project.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Writing documentation

- New pages can be created in \_pages as required
- Documentation is auto generated from components with a comment tag `@extract-docs`. This is extracted with the `scripts/extract-docs.ts` script.
  - The extract docs are served under `/docs`
    -   See `getStaticProps.js` for where this is processed
    - You can add specific overrides if necessary by creating a file with the name of the item being documented 
- Documentation can be written as a [mdx](https://mdxjs.com/) file
    -   See `MDXProvider` in `_app.tsx` for where this is controlled
- Other comment tags you can use
    -   `@type-name MyOverride` - this replaces the type name with `MyOverride`. Useful when the typescript name is not suitable to display.
    -   `@expand-properties` - This expands each property of a type into it's own parameter on a function parameter table. If text is provided then the original name is also kept with a description matching this text. See `Form` for an example of this in use.
    -   `@hide-properties` - Use this with `@expand-properties` to hide specific properties names. Separate each name with a space.
    -   `@menu-group` - This nests this item under this menu name. If not specified appears ungrouped under the package name.
    -   `@doc-class` - Specify what documentation component class to use. If not specified defaults based on type.
    -   `@forward-ref` - Indicate this function is used as a React.forwardRef. This allows doc site renderer to not document second `ref` parameter to the function as you don't pass it in yourself.
    -   `@return-type-name` - Override the inferred returned type and display this text instead. Useful when the inferred type is more confusing than helpful.
    
## Deployment

Deploys happen to vercel automatically on push.

