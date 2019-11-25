import DecimalField from './DecimalField';

/**
 * Currency field - do we want to store additional info like rangefield eg. currency type?
 */
export default class CurrencyField extends DecimalField<string> {}
