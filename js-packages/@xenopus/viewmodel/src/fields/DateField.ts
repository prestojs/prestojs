import Field from './Field';

/**
 * We dont use moment, but instead check to see if the type's Date - regardless of datetime lib used, all underlying instances will be Date.
 * Formatter should spit out an ISO8601 std date string.
 */
export default class DateField extends Field<Date> {
    parse(value: any): Date {
        if (!value) {
            return null;
        }
        return new Date(value);
    }
}
