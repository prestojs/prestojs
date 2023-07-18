import Field from './Field';

/**
 * Field for time values.
 *
 * This field expects the value to be a `string`, so if you're using a `Date` or other custom object to represent a
 * time you'll need to transform it to a string first.
 *
 * This class accepts all the props of [Field](doc:Field).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   startTime: new TimeField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   startTime: new TimeField({
 *     label: 'Event start time',
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 * </Usage>
 *
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class TimeField extends Field<string> {
    static fieldClassName = 'TimeField';
}
