import Field, { FieldProps } from './Field';

/**
 * A container field for an array of values
 *
 * You must pass `childField` which is the underlying field for each value in the
 * list. `ListField` will call `format`, `parse`, and `normalize` on this field for
 * each value in the list.
 *
 * By default, `defaultValue` will be set to an empty array unless `blankAsNull` is
 * `true`, in which case it will be set to `null`. `normalize` and `parse` also behave
 * in the same way (a falsy value passed to these will either return an empty array
 * when `blankAsNull` is false or null when it is true).
 *
 * ## Usage
 *
 * ```js
 * import { CharField, IntegerField, ListField, viewModelFactory } from '@prestojs/viewmodel';
 *
 * class User extends viewModelFactory({
 *   id: new IntegerField(),
 *   name: new CharField(),
 *   groupIds: new ListField({ childField: new IntegerField() }),
 * }, { pkFieldName: 'id' }) {
 *
 * }
 * // The groupIds go through normal IntegerField parsing so are converted to numbers
 * const user = new User({ id: 1, name: 'John', groupIds: ["1", "2", "3"] });
 * console.log(user.groupIds)
 * // Output: [1, 2, 3]
 * ```
 *
 * @extractdocs
 * @menugroup Fields
 * @typeParam T The value of each element in the list
 * @typeParam ParsableType This the type the field knows how to parse into `ValueType` when constructing a `ViewModel`.
 */
export default class ListField<T, ParsableType = T> extends Field<T[], ParsableType[], T> {
    static fieldClassName = 'ListField';

    public childField: Field<T, ParsableType>;

    constructor({
        childField,
        blankAsNull,
        // Default to an empty array as the default value in fields. This allows
        // widgets to (by default) assume that the value will always be an array.
        // This is required with antd (it's an error not to do this - results in
        // a warning and the multiselect widget to be populated with an empty item)
        // If `blankAsNull` is set we instead default to `null` to bypass this.
        defaultValue = blankAsNull ? null : [],
        ...rest
    }: {
        /**
         * The underlying field used for each value in the list
         */
        childField: Field<T, ParsableType>;
    } & FieldProps<T[], T>) {
        super({ ...rest, blankAsNull, defaultValue });
        this.childField = childField;
        this.choices = childField.choices;
    }

    /**
     * Calls `childField.format` on each entry in the passed array
     */
    public format(value: T[]): any {
        if (!value) {
            return value;
        }
        return value.map(v => this.childField.format(v));
    }

    /**
     * Calls `childField.parse` on each entry in the passed array
     *
     * If `value` is falsy or an empty array and `blankAsNull` is true
     * it will return `null` or if `blankAsNull` is false then it
     * will return an empty array.
     */
    public parse(value: ParsableType[] | null): T[] | null {
        if (!value) {
            if (this.blankAsNull) {
                return null;
            }
            return [];
        }
        if (value.length === 0 && this.blankAsNull) {
            return null;
        }
        return value.map((v: ParsableType) => this.childField.parse(v)) as T[];
    }

    /**
     * Calls `childField.parse` on each entry in the passed array
     *
     * If `value` is falsy or an empty array and `blankAsNull` is true
     * it will return `null` or if `blankAsNull` is false then it
     * will return an empty array.
     */
    public normalize(value: any): T[] | null {
        if (!value) {
            if (this.blankAsNull) {
                return null;
            }
            return [];
        }
        if (!Array.isArray(value)) {
            throw new Error('List field must be passed an array of data');
        }
        if (value.length === 0 && this.blankAsNull) {
            return null;
        }

        return value.map(v => this.childField.normalize(v) as T);
    }

    public isEqual(value1: T[], value2: T[]): boolean {
        if (value1 === value2) {
            return true;
        }
        if (!value1 || !value2) {
            return value1 === value2;
        }
        if (value1?.length !== value2.length) {
            return false;
        }
        for (let i = 0; i < value1.length; i++) {
            if (!this.childField.isEqual(value1[i], value2[i])) {
                return false;
            }
        }
        return true;
    }
}
