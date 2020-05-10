import { useLayoutEffect, useRef } from 'react';
import { isEqual as defaultIsEqual } from './comparison';

/**
 * @expand-properties
 */
export type ChangeObserverOptions<T> = {
    /**
     * Function to determine equality between items. If not provided the default will do shallow
     * equality checks with specific support for an `isEqual` function on objects (eg. if an object
     * implements `isEqual` it will be called instead of doing any other comparisons. This is
     * supported by [ViewModel](doc:viewModelFactory).
     */
    isEqual?: (a: T, b: T) => boolean;
    /**
     * If true then no changes will be detected. When this changes from true to false the
     * callback won't be called until the next change in value. This is useful for disabling
     * the callback when no value is yet available eg. when waiting for first response from an
     * API.
     */
    disabled?: boolean;
};

const NOT_SET = Symbol.for('useChangeObserver/NOT_SET');

/**
 * Call a function whenever a value changes.
 *
 * This works by monitoring a value passed in and tracking it's last value. Whenever
 * the value changes the provided callback will be called with the last and current
 * value.
 *
 * ```jsx
 * export default function Example() {
 *   const [count, setCount] = useState(0);
 *   useChangeObserver(count, () => {
 *     console.log(`Changed from ${prev} to ${next}.`));
 *   }
 *   return <>
 *     Count: {count}
 *     <button onClick={() => setCount(c => c+1)}>+1</button>
 *   </>;
 * }
 * ```
 *
 * @param value The value to monitor for changes. This can be any type but for complex
 * types you will need to provide your own `isEqual` function. For simple shallow
 * comparisons the default function will suffice (eg. it will compare each element in
 * an array or each value on an object 1 level deep).
 * @param onChange The function to call when `value` changes. This is passed the previous
 * value and the current value.
 *
 * @return Has no return value
 *
 * @extract-docs
 */
export default function useChangeObserver<T>(
    value: T,
    onChange: (lastValue: T, nextValue: T) => void,
    options?: ChangeObserverOptions<T>
): void {
    // TODO: How to indicate do nothing? sohuld be able to use this on changing from false => true etc
    const { isEqual = defaultIsEqual, disabled = false } = options || {};
    const lastValue = useRef<T | typeof NOT_SET>(NOT_SET);
    const lastOnChange = useRef<(lastValue: T, nextValue: T) => void>();
    const lastIsEqual = useRef<(a: T, b: T) => boolean>();
    useLayoutEffect(() => {
        // This happens in an effect so works with concurrent mode
        // We store these on a ref so that the effect below doesn't need
        // to have these as a dependency. This makes for nicer DX in
        // that you can pass an inline arrow function without it causing
        // effect to rerun. It does mean if either of these change it
        // won't trigger a new comparison
        // TODO: Review this decision - is it good?
        lastOnChange.current = onChange;
        lastIsEqual.current = isEqual;
    });
    // This effect handles calling action again if an update, delete or addition happens to
    // the model we are dealing with.
    useLayoutEffect(() => {
        if (disabled) {
            lastValue.current = NOT_SET;
            return;
        }
        if (lastValue.current === NOT_SET) {
            lastValue.current = value;
            return;
        }
        // lastOnChange.current should always be truthy at this point but
        // could technically be changed outside this effect so check is here
        // to appease typescript
        if (
            lastIsEqual.current &&
            lastOnChange.current &&
            !lastIsEqual.current(lastValue.current, value)
        ) {
            lastOnChange.current(lastValue.current, value);
        }

        lastValue.current = value;
    }, [disabled, value]);
}
