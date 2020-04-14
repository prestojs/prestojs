import Field from './fields/Field';
import ViewModel from './ViewModel';
import ViewModelCache from './ViewModelCache';

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
    new (...args: any[]): T;
}

/**
 * Specific version of `Class` for `ViewModel`. Allows you to use static properties
 * on ViewModel which doesn't work with just `Class`
 *
 * Originally this extended ViewModel which seemed to work in some cases but broke in
 * others (incompatibility between ViewModelClass and typeof ViewModel in some cases).
 * Unclear why. Adding properties directly here though works... expand as required
 */
export interface ViewModelClass<T extends ViewModel<any>> extends Function {
    new (...args: any[]): T;

    pkFieldNames: string[];
    pkFieldName: string | string[];
    cache: ViewModelCache<T>;
}

export type FieldDataMapping<O extends { [_: string]: Field<any> }> = {
    [K in keyof O]: O[K]['_type'];
};
