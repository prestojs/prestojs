import Field from './Field';

/**
 * NullBooleanField is now disencouraged in django and we'll do the same here - pass undefined or null to this returns null, otherwise True/False.
 */
export default class BooleanField extends Field<boolean> {
    parse(value: any): boolean {
        if (value === undefined || value === null) {
            return null;
        }
        return !!value;
    }
}
