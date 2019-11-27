import BooleanField from '@xenopus/viewmodel/fields/BooleanField';

/**
 * Field for Boolean type values with Null being a valid option. Count both undefined and null as null instead of False.
 *
 * Follows standard javascript Truthy and Falsy definition except undefined and null.
 *
 * See also: BooleanField.
 */
export default class NullableBooleanField extends BooleanField {
    parse(value: any): boolean {
        if (value === undefined || value === null) {
            return null;
        }
        return !!value;
    }
}
