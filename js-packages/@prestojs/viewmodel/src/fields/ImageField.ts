import FileField from './FileField';

/**
 * Field for image file values.
 *
 * This field works the same as [FileField](doc:FileField) but may have different widgets or formatters more appropriate
 * for images (see examples below).
 *
 * This field expects the value to be either [File](https://developer.mozilla.org/en-US/docs/Web/API/File), or a `string`.
 * When dealing with an upload in a form generally the value will be [File](https://developer.mozilla.org/en-US/docs/Web/API/File),
 * but when dealing with a record returned from a backend the value will be a `string` representing the URL of the file.
 *
 * This class accepts all the props of [FileField](doc:FileField).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   profileImage: new ImageField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide any options from [FileField](doc:FileField):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   profileImage: new FileField({
 *     helpText: 'Profile image will be displayed publicly',
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 * </Usage>
 *
 *
 * @extractdocs
 * @menugroup Fields
 */

export default class ImageField extends FileField {
    static fieldClassName = 'ImageField';
}
