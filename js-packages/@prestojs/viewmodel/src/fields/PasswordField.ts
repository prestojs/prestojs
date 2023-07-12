import CharField from './CharField';

/**
 * A field representing a password.
 *
 * This class accepts the same props as [CharField](doc:CharField). The only difference is in
 * the default widget used (see [PasswordWidget](doc:PasswordWidget) & [getWidgetForField](doc:getWidgetForField)).
 *
 * <Usage>
 * Use with [viewModelFactory](doc:viewModelFactory).
 *
 * ```js
 * viewModelFactory({
 *   id: new Field(),
 *   passwordField: new PasswordField({ writeOnly: true }),
 * }, { pkFieldName: 'id' });
 * ```
 *
 * </Usage>
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class PasswordField extends CharField {
    static fieldClassName = 'PasswordField';
}
