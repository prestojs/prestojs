import Field from './Field';

/**
 * We dont use moment, but instead check to see if the type's Date - regardless of datetime lib used, all underlying instances will be Date.
 */
export default class DateTimeField extends Field<Date> {
    parse(value: any): Date {
        if (!value) {
            return null;
        }
        return new Date(value);
    }
}
