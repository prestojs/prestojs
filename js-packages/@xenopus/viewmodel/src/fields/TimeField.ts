import Field from './Field';

/**
 * Is a string because native js Date is not suitable for this.
 */
export default class TimeField extends Field<string> {}
