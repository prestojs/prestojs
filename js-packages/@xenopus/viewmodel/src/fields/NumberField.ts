import Field from './Field';

/**
 * Base class for numeric fields
 *
 * Other numeric fields (IntegerField, DecimalField, FloatField...) will extend this.
 *
 */
export default class NumberField<T = string | number> extends Field<string | number> {}
