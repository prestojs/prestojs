import Field from './Field';

/**
 * A datetime is stored as javascript [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 * object.
 *
 * This field supports either a [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 * or a string that will be parsed with [Date.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse).
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
