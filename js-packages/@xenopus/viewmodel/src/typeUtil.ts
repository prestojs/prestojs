/**
 * Utility to type a generic class type, eg.
 *
 * NOTE: If not dealing with generics just use `typeof <class>` instead
 *
 * ```js
 * class Base<T> {
 *   value?: T;
 * }
 * class Concrete<T> extends Base<T> {}
 * function factory<T>(a: Class<Base<T>>): Base<T> {
 *   return new a();
 * }
 * factory(Concrete);
 * ```
 */
export interface Class<T> extends Function {
    new(...args: any[]): T;
}
