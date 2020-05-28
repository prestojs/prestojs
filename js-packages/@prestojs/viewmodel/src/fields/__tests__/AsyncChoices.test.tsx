// import { act, render } from '@testing-library/react';
// import React, { useEffect, useState } from 'react';
// import { AsyncChoices, Choice, ChoicesGrouped, UseChoicesReturn } from '../AsyncChoices';
//
// type TestDataItem = { label: string; id: number };
// const testData: TestDataItem[] = Array.from({ length: 20 }, (_, i) => ({
//     label: `Item ${i}`,
//     id: i,
// }));
//
// class TestAsyncChoices2 implements AsyncChoices<TestDataItem> {
//     useChoices(): UseChoicesReturn {
//         const [page, setPage] = useState(1);
//         const [isLoading, setIsLoading] = useState(true);
//         const [resolvedChoices, setResolvedChoices] = useState<{ items: TestDataItem[] }>();
//         useEffect(() => {
//             const run = async (): Promise<void> => {
//                 setResolvedChoices(await this.list({ page }));
//                 setIsLoading(false);
//             };
//             run();
//         }, [page]);
//
//         return {
//             items: resolvedChoices ? this.getChoices(resolvedChoices.items) : null,
//             isLoading,
//             setPage,
//             page,
//         };
//     }
//
//     getChoices(items: TestDataItem[]): Choice[] | ChoicesGrouped[] {
//         return items.map(item => ({
//             label: this.getLabel(item),
//             value: this.getValue(item),
//         }));
//     }
//
//     list(params: Record<string, any>): Promise<{ items: TestDataItem[] } & Record<string, any>> {
//         const { page } = params;
//         return new Promise(resolve => {
//             resolve({
//                 items: testData.slice(5 * (page - 1), 5 * page),
//             });
//         });
//     }
//     async retrieve(id): Promise<TestDataItem> {
//         return new Promise((resolve, reject) => {
//             if (id < testData.length - 1) {
//                 resolve(testData[id]);
//             } else {
//                 reject();
//             }
//         });
//     }
//     getLabel(item: TestDataItem): string {
//         return item.label;
//     }
//     getValue(item: TestDataItem): string | number {
//         return item.id;
//     }
// }
//
// test('stuff 2', async () => {
//     const choices = new TestAsyncChoices2();
//     function TestComponent({ choices }): React.ReactElement | null {
//         const { items, setPage, page } = choices.useChoices();
//         if (items) {
//             return (
//                 <div>
//                     <ul data-testid="list">
//                         {items.map(({ label }) => (
//                             <li key={label}>{label}</li>
//                         ))}
//                     </ul>
//                     <button onClick={(): void => setPage(page + 1)}>Next</button>
//                 </div>
//             );
//         }
//
//         return null;
//     }
//     const { rerender, getByTestId, getByText } = render(<TestComponent choices={choices} />);
//     await act(async () => {
//         rerender(<TestComponent choices={choices} />);
//     });
//     expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
//         'Item 0',
//         'Item 1',
//         'Item 2',
//         'Item 3',
//         'Item 4',
//     ]);
//     getByText('Next').click();
//     await act(async () => {
//         rerender(<TestComponent choices={choices} />);
//     });
//     expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
//         'Item 5',
//         'Item 6',
//         'Item 7',
//         'Item 8',
//         'Item 9',
//     ]);
// });
