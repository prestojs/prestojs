import Field from './Field';

/**
 * Time Field.
 *
 * String based: Native javascript Date does not have a nice way to describe a time-only object. Make sure any third party library of your choice like MomentJS handles this correctly.
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class TimeField extends Field<string> {}
