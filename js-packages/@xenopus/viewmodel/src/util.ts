/**
 * Utility to type a class of specified type, eg.
 *
 * ```js
 * class Base {}
 * class Concrete extends Base {}
 * function factory(a: Class<Base>): Base {
 *     return new a();
 * }
 *
 * factory(Concrete);
 * ```
 */
export interface Class<T> extends Function {
    new (...args: any[]): T;
}
