import Field from './Field';

/**
 * Base class for string fields
 *
 * Other char fields (EmailField, URLField...) will extend this.
 */
export default class CharField extends Field<string> {}
