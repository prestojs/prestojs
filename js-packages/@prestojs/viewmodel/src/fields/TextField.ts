import CharField from './CharField';

/**
 * Field for text values. This is typically used for fields with arbitrary length
 * that are rendered as a `textbox`.
 *
 * This class accepts all the props of [CharField](doc:CharField).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   description: new TextField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * Optionally provide `maxLength` or any options from [Field](doc:Field):
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   description: new TextField({
 *     maxLength: 1000,
 *     helpText: 'Enter description in 1000 characters or less'
 *   }),
 * }, { pkFieldName: 'id' });
 * ```
 * </Usage>
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class TextField extends CharField {
    static fieldClassName = 'TextField';
}
