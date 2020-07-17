import NullableBooleanField from './NullableBooleanField';

/**
 * Field for Boolean type values. Null count as False for this field.
 *
 * Follows standard javascript Truthy and Falsy definition.
 *
 * See also: [NullableBooleanField](doc:NullableBooleanField).
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class BooleanField extends NullableBooleanField {
    static fieldClassName = 'BooleanField';
    parse(value: any): boolean {
        return !!value;
    }
}
