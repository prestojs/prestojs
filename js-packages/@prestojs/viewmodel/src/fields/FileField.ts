import Field from './Field';

/**
 * Field for file values.
 *
 * This field expects the value to be either [File](https://developer.mozilla.org/en-US/docs/Web/API/File), or a `string`.
 * When dealing with an upload in a form generally the value will be [File](https://developer.mozilla.org/en-US/docs/Web/API/File),
 * but when dealing with a record returned from a backend the value will be a `string` representing the URL of the file.
 *
 * This class accepts all the props of [Field](doc:Field).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   document: new FileField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   document: new FileField({
 *     label: 'Signed Document',
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 * </Usage>
 *
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class FileField extends Field<File | string> {
    static fieldClassName = 'FileField';
}
