import Field from './Field';

/**
 * Field for Boolean type values. Null count as False for this field.
 *
 * Follows standard javascript Truthy and Falsy definition.
 *
 * See also: NullableBooleanField.
 */
export default class BooleanField extends Field<boolean> {
    parse(value: any): boolean {
        return !!value;
    }
}
