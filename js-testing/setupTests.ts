import '@testing-library/jest-dom';
import diff from 'jest-diff';
import { GlobalWithFetchMock } from 'jest-fetch-mock';

const customGlobal: GlobalWithFetchMock = global as GlobalWithFetchMock;

customGlobal.fetch = require('jest-fetch-mock');
customGlobal.fetchMock = customGlobal.fetch;

expect.extend({
    toBeEqualToRecord(expected, received, msg) {
        if (Array.isArray(expected)) {
            const pass =
                Array.isArray(received) &&
                received.length === expected.length &&
                expected.every((item, i) => item.isEqual(received[i]));
            if (pass) {
                return {
                    message: (): string =>
                        `${this.utils.matcherHint('.not.toBe')}\n\n` +
                        `Expected value to not be (using isEqual):\n` +
                        `  ${this.utils.printExpected(expected.map(item => item.toJS()))}\n` +
                        `Received:\n` +
                        `  ${this.utils.printReceived(received.map(item => item.toJS()))}`,
                    pass: true,
                };
            }
            return {
                message: (): string => {
                    const a = expected.map(item => item.toJS());
                    const b = received.map(item => (item.toJS ? item.toJS() : item));
                    const diffString = diff(a, b, {
                        expand: this.expand,
                    });
                    return (
                        `${this.utils.matcherHint('.toBe')}\n\n` +
                        `Expected value to be (using isEqual):\n` +
                        ` ${this.utils.printExpected(a)}\n` +
                        `Received:\n` +
                        ` ${this.utils.printReceived(b)}` +
                        `${diffString ? `\n\nDifference:\n\n${diffString}` : ''}\n` +
                        `${msg ? `Custom:\n  ${msg}` : ''}`
                    );
                },
                pass: false,
            };
        }
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
