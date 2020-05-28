import { AsyncChoices } from '@prestojs/viewmodel';
import { render } from '@testing-library/react';
import React from 'react';
import SelectAsyncChoiceWidget from '../widgets/SelectAsyncChoiceWidget';

function delay<T>(fn): Promise<T> {
    return new Promise((resolve, reject) => setTimeout(() => resolve(fn(reject))));
}

type TestDataItem = { name: string; _pk: number };
const testData: TestDataItem[] = Array.from({ length: 20 }, (_, i) => ({
    name: `Item ${i}`,
    _pk: i,
}));

function resolveSingle(id: number): Promise<TestDataItem> {
    if (Array.isArray(id)) {
        return delay(() => id.map(i => testData[i]));
    }
    return delay(reject => {
        if (!testData[id]) {
            return reject('Not found');
        }
        return testData[id];
    });
}

function resolveMulti(ids: number[]): Promise<TestDataItem[]> {
    return delay(() => ids.map(i => testData[i]));
}

test('hello there old chap', () => {
    const onChange = jest.fn();
    const input = {
        name: 'test',
        onChange,
        onBlur: jest.fn(),
        onFocus: jest.fn(),
    };
    const asyncChoices = new AsyncChoices({
        multiple: false,
        list(params, deps: any): Promise<TestDataItem[]> {
            return resolveMulti([0, 1, 2, 3, 4]);
        },
        retrieve(value: number, deps: any): Promise<TestDataItem> {
            return resolveSingle(value);
        },
        getLabel(item: TestDataItem): React.ReactNode {
            return item.name;
        },
        getValue(item: TestDataItem): number {
            return item._pk;
        },
    });
    const { rerender, container, getByText, getByLabelText } = render(
        <SelectAsyncChoiceWidget asyncChoices={asyncChoices} input={input} />
    );
    expect(container.querySelectorAll('.ant-radio-group').length).toBe(0);
    expect(container.querySelectorAll('.ant-select').length).toBe(1);
});
