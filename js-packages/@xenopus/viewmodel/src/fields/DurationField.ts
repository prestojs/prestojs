import CharField from './CharField';

/**
 * Duration Field - represents a duration with three components: day, hour, minute such as 2d0h5m.
 *
 * Make sure backend of your choice is capable of storing a duration in a similar manner.
 */
export default class DurationField extends CharField {}
