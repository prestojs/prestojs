import { ViewModelInterface } from '@prestojs/viewmodel/ViewModelFactory';
import { isViewModelInstance } from '@prestojs/viewmodel';
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
export const recordEqualTo = (matcher: ViewModelInterface<any, any> | {}, isEqual = true) => ({
    asymmetricMatch(actual: ViewModelInterface<any, any> | {}): boolean {
        if (!actual) {
            throw new Error(`Expected a record but received ${actual}`);
        }
        // instanceof was giving me issues... I think it was using different instances in tests
        // for ViewModel used in test module vs viewmodel here
        if (!isViewModelInstance(matcher) && isViewModelInstance(actual)) {
            matcher = new actual._model(matcher);
        }
        if (!isViewModelInstance(actual) && isViewModelInstance(matcher)) {
            actual = new matcher._model(actual);
        }
        if (isViewModelInstance(matcher) && isViewModelInstance(actual)) {
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
