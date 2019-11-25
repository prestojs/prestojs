import diff from 'jest-diff';

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

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R, T> {
            toBeEqualToRecord(received: any, msg?: string): R;
        }
    }
}
