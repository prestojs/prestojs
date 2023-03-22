import Field from './Field';

export type JSON<T> = string & { ' __JSON': T };

/**
 * Field for JSON values.
 *
 * The `parse` implementation will parse strings with ``JSON.parse``. If it's not a valid JSON string then the unparsed
 * string will be returned.
 *
 * `normalize` will do the same, except it will throw in the case of an invalid JSON string. As such once a record is
 * constructed the value is guaranteed to be the normalized value.
 *
 * `format` will format the value as a nicely indented JSON string.
 *
 * This class accepts all the props of [Field](doc:Field).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   data: new JsonField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   data: new JsonField({
 *     helpText: 'Paste JSON data here',
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 * </Usage>
 *
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class JsonField<T> extends Field<T, JSON<T> | T> {
    static fieldClassName = 'JsonField';
    normalize(value: JSON<T> | T): T | null {
        if (null == value) {
            return value;
        }
        if (typeof value == 'string') {
            return JSON.parse(value as string) as T;
        }
        return value;
    }
    parse(value: JSON<T> | T): T | null {
        try {
            return this.normalize(value);
        } catch (e) {
            return value as any;
        }
    }
    public format(value: T): any {
        return JSON.stringify(value, null, 2);
    }
}
