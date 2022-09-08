/**
 * Simple automatic usage
 *
 * Demo's basic usage of `trigger="SHALLOW"`. Unlike the previous example this will
 * call the function as soon as the component renders.
 *
 * This code generates a random number after a delay. If value is < 0.2 the Promise
 * will reject with an error.
 */
import { useAsync } from '@prestojs/util';
import { Button } from 'antd';
import 'antd/dist/antd.min.css';

const generateRandomNumber = (delay: number) =>
    new Promise<number>((resolve, reject) =>
        setTimeout(() => {
            const value = Math.random();
            if (value < 0.2) {
                reject(new Error('Out of range'));
            } else {
                resolve(value);
            }
        }, delay)
    );

export default function BasicExample() {
    const { isLoading, result, run, error, reset } = useAsync(generateRandomNumber, {
        args: [1000],
        trigger: 'SHALLOW',
    });
    return (
        <div>
            <Button loading={isLoading} onClick={() => run()}>
                Generate Number
            </Button>
            <Button disabled={isLoading} onClick={() => reset()}>
                Reset
            </Button>
            {result != null ? <div>Result: {result}</div> : null}
            {error && <div className="bg-red-100 p-1 mt-2">{error.message}</div>}
        </div>
    );
}
