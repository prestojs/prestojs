import Field from './Field';

/**
 * Field for Boolean type values with Null being a valid option. Count both undefined and null as null instead of False.
 *
 * Follows standard javascript Truthy and Falsy definition except undefined and null.
 *
 * See also: [BooleanField](doc:BooleanField).
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class NullableBooleanField extends Field<boolean> {
    parse(value: any): boolean | null {
        if (value === undefined || value === null) {
            return null;
        }
        return !!value;
    }
}
