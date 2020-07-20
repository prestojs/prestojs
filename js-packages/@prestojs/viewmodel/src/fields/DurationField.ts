import CharField from './CharField';

/**
 * Duration Field - represents a duration with two components: hour, minute such as 10h5m.
 *
 * Duration longer than 23h59m is not currently supported.
 *
 * Backend of choice need to be capable of storing a duration in a similar manner.
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class DurationField extends CharField {
    static fieldClassName = 'DurationField';
}
