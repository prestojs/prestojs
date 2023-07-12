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
 * @extractdocs
 * @menugroup Fields
 */
export default class URLField extends CharField {
    static fieldClassName = 'URLField';
}
