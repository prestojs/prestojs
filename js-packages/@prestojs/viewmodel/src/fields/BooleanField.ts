import Field from './Field';

/**
 * Field for Boolean type values. Value can either be `true` or `false` - if
 * you need an indeterminate state set the `blank` option to true.
 *
 * This class accepts all the props of [Field](doc:Field).
 *
 * <Usage>
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
 *   isActive: new BooleanField({
 *     helpText: 'Is this user active?',
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 * </Usage>
 *
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class BooleanField extends Field<boolean> {
    static fieldClassName = 'BooleanField';

    /**
     * If `blank` is `true` then `null` or `undefined` will be parsed to `null`.
     *
     * Otherwise, any falsy value will be converted to `false`, any truthy value `true`.
     *
     * @param value The value to parse
     */
    parse(value: any): boolean | null {
        if (this.blank && (value === undefined || value === null)) {
            return null;
        }
        return !!value;
    }
}
