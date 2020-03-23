import { ViewModel } from '@prestojs/viewmodel';
import './setupTests';

/**
 * Matcher to check if two records are equal. One of the target or the passed
 * parameter can be a plain object in which case it will be converted to a
 * record.
 *
 * Usage:
 *
 * ```
 * expect(cache.get(2)).toBe(recordEqualTo({ id: 2, email: 'bob@b.com' }))
 * ```
 * @param matcher
 * @param isEqual
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const recordEqualTo = (matcher: ViewModel | {}, isEqual = true) => ({
    asymmetricMatch(actual: ViewModel | {}): boolean {
        if (!actual) {
            throw new Error(`Expected a record but received ${actual}`);
        }
        // instanceof was giving me issues... I think it was using different instances in tests
        // for ViewModel used in test module vs viewmodel here
        function isViewModel(a: ViewModel | Object): a is ViewModel {
            return (a as ViewModel)._model !== undefined;
        }
        if (!isViewModel(matcher) && isViewModel(actual)) {
            matcher = new actual._model(matcher);
        }
        if (!isViewModel(actual) && isViewModel(matcher)) {
            actual = new matcher._model(actual);
        }
        if (isViewModel(matcher) && isViewModel(actual)) {
            if (isEqual) {
                expect(matcher).toBeEqualToRecord(actual);
            } else {
                expect(matcher).not.toBeEqualToRecord(actual);
            }
        } else {
            throw new Error('One of matcher or target must be an instance of a ViewModel');
        }
        return true;
    },
});
