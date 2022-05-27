import NullableBooleanField from './NullableBooleanField';

/**
 * Field for Boolean type values. Value can either be `true` or `false` - if
 * you need an indeterminate state use [NullableBooleanField](doc:NullableBooleanField)
 *
 * This class accepts all the props of [Field](doc:Field).
 *
 * ## Usage
 *
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   isActive: new BooleanField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   isActive: new CharField({
 *     helpText: 'Is this user active?',
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 *
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class BooleanField extends NullableBooleanField {
    static fieldClassName = 'BooleanField';

    /**
     * Treats any falsy value as `false`, everything else `true`
     * @param value The value to parse
     */
    parse(value: any): boolean {
        return !!value;
    }
}
