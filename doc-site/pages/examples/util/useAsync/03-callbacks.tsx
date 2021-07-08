/**
 * onSuccess / onError
 *
 * The `onSuccess` and `onError` callbacks are useful if you want to do something one the promise resolves. You can
 * achieve this by waiting on the result of the function yourself:
 *
 * ```js
 * useAsync(async () => {
 *    try {
 *       await doSomethingAsync();
 *       alert('Success')
 *    } catch (e) {
 *       alert('Error')
 *    }
 * });
 * ```
 *
 * ... but this is cumbersome, especially if you are using `useAsync.SHALLOW` or `useAsync.DEEP`. In those cases
 * `onSuccess` and `onError` are more convenient.
 */
import { useAsync } from '@prestojs/util';
import React from 'react';

async function generateRandomNumber(): Promise<number[]> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() < 0.5) {
                reject(new Error('Failed to generate a number'));
            } else {
                resolve(Array.from({ length: 5 }, () => Math.random()));
            }
        }, 1000);
    });
}

export default function CallbacksExample() {
    const { result, error, isLoading, run, reset } = useAsync(generateRandomNumber, {
        onSuccess(result) {
            alert(`Generated numbers: ${result.join(', ')}`);
        },
        onError(error) {
            alert(`Error: ${error.message}`);
        },
    });
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            {!error && (
                <div className="p-5 bg-gray-100 rounded">
                    <h4>Generated Numbers</h4>
                    {result ? (
                        <ul>
                            {result.map((num, i) => (
                                <li key={i}>{num}</li>
                            ))}
                        </ul>
                    ) : (
                        '-'
                    )}
                </div>
            )}
            {error && <div className="bg-red-100 text-red-800 p-5 rounded">{error.message}</div>}
            <div className="flex justify-between">
                <button className="btn-blue" disabled={isLoading} onClick={() => run()}>
                    {isLoading ? 'Loading...' : 'Generate'}
                </button>
                <button className="btn-blue" disabled={isLoading} onClick={() => reset()}>
                    Clear
                </button>
            </div>
        </div>
    );
}
