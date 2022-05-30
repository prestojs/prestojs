import React from 'react';
import AsyncChoices, { ChoicesGrouped } from '../AsyncChoices';

type TestDataItem = { label: string; id: number };
const testData: TestDataItem[] = Array.from({ length: 20 }, (_, i) => ({
    label: `Item ${i}`,
    id: i,
}));
const getLabel = (item): string => item.label;
const getValue = (item): number => item.id;
const list = (): Promise<TestDataItem[]> => Promise.resolve(testData);
const retrieve = (i: number): Promise<TestDataItem> => Promise.resolve(testData[i]);
const baseOptions = {
    multiple: false,
    list,
    retrieve,
    getLabel,
    getValue,
};

class Record {
    item: TestDataItem;
    constructor(item: TestDataItem) {
        this.item = item;
    }
    get _key(): string {
        return `I${this.item.id}`;
    }
    getLabel(): string {
        return this.item.label.toUpperCase();
    }
}

test('should support basic flat choices', async () => {
    const asyncChoices = new AsyncChoices(baseOptions);
    const r = await asyncChoices.list({});
    const choices = asyncChoices.getChoices(r);
    expect(choices).toEqual(testData.map(({ label, id }) => ({ value: id, label })));
});

test('should support getMissingLabel', async () => {
    let asyncChoices = new AsyncChoices(baseOptions);
    // Default implementation
    expect(asyncChoices.getMissingLabel(5)).toBe('5');
    asyncChoices = new AsyncChoices({
        ...baseOptions,
        getMissingLabel(): string {
            return '?';
        },
    });
    expect(asyncChoices.getMissingLabel(5)).toBe('?');
});

test('should support grouped choices', async () => {
    const asyncChoices = new AsyncChoices({
        ...baseOptions,
        getChoices(items: TestDataItem[]): ChoicesGrouped<number>[] {
            const groups: ChoicesGrouped<any>[] = [
                ['Items 0 - 5', []],
                ['Items 5+', []],
            ];
            for (const item of items) {
                if (item.id < 5) {
                    groups[0][1].push({
                        value: this.getValue(item),
                        label: this.getLabel(item),
                    });
                } else {
                    groups[1][1].push({
                        value: this.getValue(item),
                        label: this.getLabel(item),
                    });
                }
            }
            return groups;
        },
    });
    const r = await asyncChoices.list({});
    const choices = asyncChoices.getChoices(r);
    const labeledItems = testData.map(({ label, id }) => ({ value: id, label }));
    expect(choices).toEqual([
        ['Items 0 - 5', labeledItems.slice(0, 5)],
        ['Items 5+', labeledItems.slice(5)],
    ]);
});

test('should support Labeled and Identifiable', async () => {
    const newTestData = testData.map(item => new Record(item));
    const list = jest.fn(() => Promise.resolve(newTestData));
    const retrieve = jest.fn(i => Promise.resolve(newTestData[i]));
    const asyncChoices = new AsyncChoices({
        multiple: false,
        list,
        retrieve,
    });
    const r = await asyncChoices.list({});
    const choices = asyncChoices.getChoices(r);
    expect(choices).toEqual(
        testData.map(({ label, id }) => ({ value: `I${id}`, label: label.toUpperCase() }))
    );
});

test('use*Deps should return args if not specified', () => {
    const asyncChoices = new AsyncChoices(baseOptions);

    const listArgs = { query: { test: 'ok' } };
    expect(asyncChoices.useListProps(listArgs)).toBe(listArgs);

    const retrieveArgs = { id: 1 };
    expect(asyncChoices.useRetrieveProps(retrieveArgs)).toBe(retrieveArgs);
});
