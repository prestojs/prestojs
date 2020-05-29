import Field from './Field';

/*
 * Date Field.
 *
 * The basic javascript Date type is consumed and spitted out by this field. All third party libraries, such as Moment, should be compatible
 * as regardless of how they implement, the underlying base instance will always be Date.
 *
 * Invalid dates are treated as Null. Does not truncate "time" part for a datetime passed in - if necessary, truncate in UI components.
 *
 * TODO: Format for Date Field should spit out ISO8601 date string by default.
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class DateField extends Field<Date, string | Date> {
    parse(value: any): Date | null {
        if (Number.isNaN(Date.parse(value))) {
            return null;
        }
        return new Date(value);
    }

    normalize(value: string | Date): Date | null {
        if (value instanceof Date) {
            return value;
        }
        if (Number.isNaN(Date.parse(value))) {
            return null;
        }
        return new Date(value);
    }
}
