import NullableBooleanField from './NullableBooleanField';

/**
 * Field for Boolean type values. Value can either be `true` or `false` - if
 * you need an indeterminate state use [NullableBooleanField](doc:NullableBooleanField)
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
