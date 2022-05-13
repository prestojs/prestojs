# Could not find any other way to solve this. See - https://github.com/postcss/postcss/pull/1379. Only happens because
# of tailwindcss plugin - if that is removed or the @import's in globals.css then error goes away.
sed -i -- 's/this.nodes\[child\].parent = undefined;/(this.nodes[child] || {}).parent = undefined/' ../node_modules/postcss/lib/container.js
