import Field from './Field';

/**
 * Field for representing a date and time.
 *
 * A date is stored as javascript [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 * object. As a `Date` always has a time component the only difference between `DateTimeField` and [DateField](doc:DateField)
 * is how it's handled by formatters or widgets. For example [DateFormatter](doc:DateFormatter) will display the date and
 * time component for `DateTimeField` but only the date component for `DateField`.
 *
 * This field supports either a [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 * or a string that will be parsed into a `Date` with [Date.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   activatedAt: new BooleanField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   activatedAt: new BooleanField({
 *     helpText: 'Date and time user activated their account',
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 * </Usage>
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class DateTimeField extends Field<Date, string | Date> {
    static fieldClassName = 'DateTimeField';
    parse(value: any): Date | null {
        if (Number.isNaN(Date.parse(value))) {
            return null;
        }
        return new Date(value);
    }
    isEqual(a?: Date, b?: Date): boolean {
        if (a === b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return a.getTime() === b.getTime();
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
