import Field from './Field';

/**
 * Base class for File fields
 *
 * Used by ImageField.
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class FileField extends Field<File> {
    static fieldClassName = 'FileField';
}
