import Field from './Field';

/*
 * DateTime Field.
 *
 * The basic javascript Date type is consumed and spitted out by this field. All third party libraries, such as Moment, should be compatible
 * as regardless of how they implement, the underlying base instance will always be Date.
 *
 * Invalid datetimes are treated as Null.
 */
export default class DateTimeField extends Field<Date> {
    parse(value: any): Date {
        if (Number.isNaN(Date.parse(value))) {
            return null;
        }
        return new Date(value);
    }
}
