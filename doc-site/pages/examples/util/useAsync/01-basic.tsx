/**
 * Basic
 *
 * The most basic usage is to just pass a function that returns a promise and then call `run` whenever
 * you want it to execute. Once the promise has resolved `result` will be contained the resolved value
 * or `error` the error if it rejected instead.
 *
 * Note that when you generate new numbers the old values are still shown but should be considered
 * stale. If you want to hide stale values then you can use the `isLoading` flag to remove them while
 * the new value is being retrieved.
 */
import { useAsync } from '@prestojs/util';
import React from 'react';

async function generateRandomNumber(): Promise<number[]> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() < 0.3) {
                reject(new Error('Failed to generate a number'));
            } else {
                resolve(Array.from({ length: 5 }, () => Math.random()));
            }
        }, 1500);
    });
}

export default function BasicExample() {
    const { result, error, isLoading, run, reset } = useAsync(generateRandomNumber);
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
