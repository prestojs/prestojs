/**
 * MIT License
 *
 *  Copyright (c) 2019 Alexander Reardon
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */
// This code is taken from https://github.com/alexreardon/use-memo-one but modified
// to allow custom comparison operator
import { useEffect, useRef, useState } from 'react';
import { isEqual } from './comparison';

type Cache<T> = {
    inputs?: any[];
    result: T;
};

export type ComparisonFn = (newInputs: any[], lastInputs: any[]) => boolean;

/**
 * Based on https://github.com/alexreardon/use-memo-one but supports custom
 * comparison operator.
 *
 * @param getResult Function that returns value to memoize
 * @param inputs Dependency array. When values in this change getResult is called again
 * @param compare Custom comparision operator. Defaults to shallow strict equality.
 * @returns {T}
 */
export default function useMemoOne<T>(
    // getResult changes on every call,
    getResult: () => T,
    // the inputs array changes on every call
    inputs?: any[],
    // Comparison function to use when determining whether inputs have changed
    compare: ComparisonFn = isEqual
): T {
    // using useState to generate initial value as it is lazy
    const initial: Cache<T> = useState(() => ({
        inputs,
        result: getResult(),
    }))[0];

    const committed = useRef<Cache<T>>(initial);

    // persist any uncommitted changes after they have been committed
    const isInputMatch = Boolean(
        inputs && committed.current.inputs && compare(inputs, committed.current.inputs)
    );

    // create a new cache if required
    const cache: Cache<T> = isInputMatch
        ? committed.current
        : {
              inputs,
              result: getResult(),
          };

    // commit the cache
    useEffect(() => {
        committed.current = cache;
    }, [cache]);

    return cache.result;
}
