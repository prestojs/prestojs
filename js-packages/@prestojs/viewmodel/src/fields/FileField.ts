import Field from './Field';

/**
 * Base class for File fields
 *
 * Used by ImageField.
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class FileField extends Field<File> {
    static fieldClassName = 'FileField';
}
