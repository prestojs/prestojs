import Field from './Field';

/**
 * Base class for File fields
 *
 * Image field will be an extension of filefield with different formatter.
 *
 */
export default class FileField<File> extends Field<File> {}
