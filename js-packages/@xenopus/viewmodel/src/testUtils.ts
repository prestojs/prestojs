import diff from 'jest-diff';
import ViewModel from '@xenopus/viewmodel/ViewModel';

/**
 * Matcher to check if two records are equal. One of the target or the passed
 * parameter can be a plain object in which case it will be converted to a
 * record.
 *
 * Usage:
 *
 * ```
 * expect(cache.get(2)).toBe(recordIsEqual({ id: 2, email: 'bob@b.com' }))
 * ```
 * @param matcher
 * @param isEqual
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const recordIsEqual = (matcher: ViewModel | {}, isEqual = true) => ({
    asymmetricMatch(actual: ViewModel | {}): boolean {
        if (!actual) {
            throw new Error(`Expected a record but received ${actual}`);
        }
        if (!(matcher instanceof ViewModel) && actual instanceof ViewModel) {
            matcher = new actual._model(matcher);
        }
        if (!(actual instanceof ViewModel) && matcher instanceof ViewModel) {
            actual = new matcher._model(actual);
        }
        if (matcher instanceof ViewModel && actual instanceof ViewModel) {
            if (isEqual) {
                // Not sure how to make it known that toBeEqualToRecord is available on expect now
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                expect(matcher).toBeEqualToRecord(actual);
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                expect(matcher).not.toBeEqualToRecord(actual);
            }
        } else {
            throw new Error('One of matcher or target must be an instance of a ViewModel');
        }
        return true;
    },
});

expect.extend({
    toBeEqualToRecord(expected, received, msg) {
        if (expected.isEqual(received)) {
            return {
                message: (): string =>
                    `${this.utils.matcherHint('.not.toBe')}\n\n` +
                    `Expected value to not be (using isEqual):\n` +
                    `  ${this.utils.printExpected(expected.toJS())}\n` +
                    `Received:\n` +
                    `  ${this.utils.printReceived(received.toJS())}`,
                pass: true,
            };
        } else {
            return {
                message: (): string => {
                    const diffString = diff(expected.toJS(), received.toJS(), {
                        expand: this.expand,
                    });
                    return (
                        `${this.utils.matcherHint('.toBe')}\n\n` +
                        `Expected value to be (using isEqual):\n` +
                        ` ${this.utils.printExpected(
                            expected._model.name
                        )} ${this.utils.printExpected(expected.toJS())}\n` +
                        `Received:\n` +
                        ` ${this.utils.printExpected(
                            received._model.name
                        )} ${this.utils.printReceived(received.toJS())}` +
                        `${diffString ? `\n\nDifference:\n\n${diffString}` : ''}\n` +
                        `${msg ? `Custom:\n  ${msg}` : ''}`
                    );
                },
                pass: false,
            };
        }
    },
});
