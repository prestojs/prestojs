import FileField from './FileField';

/**
 * Image field.
 *
 * ImageField is an exact match of FileField, however the representation (format/widget) will be different.
 *
 * @extractdocs
 * @menugroup Fields
 */
export default class ImageField extends FileField {
    static fieldClassName = 'ImageField';
}
