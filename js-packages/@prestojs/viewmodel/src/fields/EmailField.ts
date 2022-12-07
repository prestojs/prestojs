import CharField from './CharField';

/**
 * A field representing an email.
 *
 * This class accepts the same props as [CharField](doc:CharField). The only difference is in
 * the default widget used (see [EmailWidget](doc:EmailWidget) & [getWidgetForField](doc:getWidgetForField)).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   emailAddress: new EmailField(),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * </Usage>
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class EmailField extends CharField {
    static fieldClassName = 'EmailField';
}
