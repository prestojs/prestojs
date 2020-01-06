import NullableBooleanField from './NullableBooleanField';

/**
 * Field for Boolean type values. Null count as False for this field.
 *
 * Follows standard javascript Truthy and Falsy definition.
 *
 * See also: NullableBooleanField.
 *
 * @extract-docs
 */
export default class BooleanField extends NullableBooleanField {
    parse(value: any): boolean {
        return !!value;
    }
}
