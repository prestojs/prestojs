import CharField from './CharField';

/**
 * A field representing a URL.
 *
 * This class accepts the same props as [CharField](doc:CharField).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   url: new URLField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * </Usage>
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class URLField extends CharField {
    static fieldClassName = 'URLField';
}
