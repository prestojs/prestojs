import Field from './Field';

/**
 * Field for Date type values.
 *
 * A date is stored as javascript [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 * object. As a `Date` always has a time component the only difference between `DateField` and [DateTimeField](doc:DateTimeField)
 * is how it's handled by formatters or widgets. For example [DateFormatter](doc:DateFormatter) will only
 * display the date component and ignore the time component.
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
 *   activatedOn: new BooleanField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   activatedOn: new BooleanField({
 *     helpText: 'Date user activated their account',
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 * </Usage>
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class DateField extends Field<Date, string | Date> {
    static fieldClassName = 'DateField';
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
        return (
            // We only compare date components as there's technically no time component for DateField
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
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
