import Field from './Field';

/**
 * DateTime Field.
 *
 * The basic javascript Date type is consumed and spitted out by this field. All third party libraries, such as Moment, should be compatible
 * as regardless of how they implement, the underlying base instance will always be Date.
 *
 * Invalid datetimes are treated as Null.
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class DateTimeField extends Field<Date, string | Date> {
    static fieldClassName = 'DateTimeField';
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
