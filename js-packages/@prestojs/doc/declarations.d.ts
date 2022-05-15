// This is needed for css-modules so typescript build works
declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}
