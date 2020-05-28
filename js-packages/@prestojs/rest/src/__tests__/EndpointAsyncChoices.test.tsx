import { UrlPattern } from '@prestojs/routing';
import { AsyncChoices } from '@prestojs/viewmodel';
import { act, render, waitFor } from '@testing-library/react';
import { FetchMock } from 'jest-fetch-mock';
import qs from 'qs';
import React from 'react';
import Endpoint from '../Endpoint';
import EndpointAsyncChoices from '../EndpointAsyncChoices';
import PaginatedEndpoint from '../PaginatedEndpoint';

const fetchMock = fetch as FetchMock;

type TestDataItem = { name: string; pk: number };
const testData: TestDataItem[] = Array.from({ length: 20 }, (_, i) => ({
    name: `Item ${i}`,
    pk: i,
}));

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function mockedPaginatedResponse(request: Request) {
    const query = qs.parse(request.url.split('?')[1] || '');
    const pageSize = Number(query.pageSize || 5);
    let page = Number(query.page || 1);
    if (query.last) {
        page = 4;
    }
    let body;
    if (query.id) {
        body = {
            results: [testData[Number(query.id)]],
            count: 1,
        };
    } else {
        body = {
            results: testData.slice(pageSize * (page - 1), pageSize * page),
            count: testData.length,
        };
    }
    return Promise.resolve({
        body: JSON.stringify(body),
        init: {
            headers: {
                'Content-Type': 'application/json',
            },
        },
    });
}

function TestComponent({
    choices,
    value = null,
    accumulatePages = true,
    disabled = false,
    query = {},
}: {
    choices: AsyncChoices<any>;
    value?: string | number | null;
    accumulatePages?: boolean;
    disabled?: boolean;
    query?: Record<string, any>;
}): React.ReactElement | null {
    const { currentValue, error, isLoading, items, paginator } = choices.useChoices({
        currentValue: value,
        accumulatePages,
        disabled,
        query,
    });
    if (error) {
        return <div data-testid="error">{error.content.message}</div>;
    }
    if (!isLoading) {
        return (
            <div>
                {currentValue && <div data-testid="currentValue">{currentValue.label}</div>}
                <ul data-testid="list">
                    {items.map(({ label }) => (
                        <li key={label}>{label}</li>
                    ))}
                </ul>
                <button onClick={(): void => paginator.next()}>Next</button>
            </div>
        );
    }

    return <div data-testid="loading">Loading</div>;
}

test('should return unpaginated data', async () => {
    fetchMock.mockResponse(JSON.stringify(testData.slice(0, 5)), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const endpoint = new Endpoint(new UrlPattern('/whatever/'));

    const choices = new EndpointAsyncChoices<TestDataItem>(endpoint, {
        getLabel(item: TestDataItem): React.ReactNode {
            return item.name;
        },
        getValue(item: TestDataItem): number {
            return item.pk;
        },
    });

    const { getByTestId } = render(<TestComponent choices={choices} accumulatePages={false} />);
    expect(getByTestId('loading')).toHaveTextContent('Loading');
    await waitFor(() =>
        expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
            'Item 0',
            'Item 1',
            'Item 2',
            'Item 3',
            'Item 4',
        ])
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('should handle paginated data', async () => {
    fetchMock.mockResponse(mockedPaginatedResponse);
    const endpoint = new PaginatedEndpoint(new UrlPattern('/whatever/'));
    const choices = new EndpointAsyncChoices<TestDataItem>(endpoint, {
        getLabel(item: TestDataItem): React.ReactNode {
            return item.name;
        },
        getValue(item: TestDataItem): number {
            return item.pk;
        },
    });

    const { getByTestId, getByText } = render(
        <TestComponent choices={choices} accumulatePages={false} />
    );
    await waitFor(() => {
        expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
            'Item 0',
            'Item 1',
            'Item 2',
            'Item 3',
            'Item 4',
        ]);
    });

    getByText('Next').click();
    await waitFor(() => expect(getByTestId('loading')).toHaveTextContent('Loading'));
    await waitFor(() => {
        expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
            'Item 5',
            'Item 6',
            'Item 7',
            'Item 8',
            'Item 9',
        ]);
    });
    getByText('Next').click();
    await waitFor(() => expect(getByTestId('loading')).toHaveTextContent('Loading'));
    await waitFor(() => {
        expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
            'Item 10',
            'Item 11',
            'Item 12',
            'Item 13',
            'Item 14',
        ]);
    });
});

test('should support accumulatePages', async () => {
    fetchMock.mockResponse(mockedPaginatedResponse);
    const endpoint = new PaginatedEndpoint(new UrlPattern('/whatever/'));
    const choices = new EndpointAsyncChoices<TestDataItem>(endpoint, {
        getLabel(item: TestDataItem): React.ReactNode {
            return item.name;
        },
        getValue(item: TestDataItem): number {
            return item.pk;
        },
    });

    const { rerender, getByTestId, getByText } = render(<TestComponent choices={choices} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => {
        expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
            'Item 0',
            'Item 1',
            'Item 2',
            'Item 3',
            'Item 4',
        ]);
    });
    getByText('Next').click();
    await waitFor(() => {
        expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
            'Item 0',
            'Item 1',
            'Item 2',
            'Item 3',
            'Item 4',
            'Item 5',
            'Item 6',
            'Item 7',
            'Item 8',
            'Item 9',
        ]);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    getByText('Next').click();
    await waitFor(() => expect(getByTestId('loading')).toHaveTextContent('Loading'));
    await waitFor(() => {
        expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
            'Item 0',
            'Item 1',
            'Item 2',
            'Item 3',
            'Item 4',
            'Item 5',
            'Item 6',
            'Item 7',
            'Item 8',
            'Item 9',
            'Item 10',
            'Item 11',
            'Item 12',
            'Item 13',
            'Item 14',
        ]);
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // Toggling disabled on then off should retain options and not trigger any fetches
    rerender(<TestComponent choices={choices} disabled />);
    rerender(<TestComponent choices={choices} />);
    expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
        'Item 0',
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
        'Item 5',
        'Item 6',
        'Item 7',
        'Item 8',
        'Item 9',
        'Item 10',
        'Item 11',
        'Item 12',
        'Item 13',
        'Item 14',
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
});

test('should support disabled flag', async () => {
    fetchMock.mockResponse(mockedPaginatedResponse);
    const endpoint = new PaginatedEndpoint(new UrlPattern('/whatever/'));
    const choices = new EndpointAsyncChoices<TestDataItem>(endpoint, {
        getLabel(item: TestDataItem): React.ReactNode {
            return item.name;
        },
        getValue(item: TestDataItem): number {
            return item.pk;
        },
    });

    const { rerender, getByTestId, getByText } = render(
        <TestComponent choices={choices} disabled />
    );
    await waitFor(() => {
        expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([]);
    });
    rerender(<TestComponent choices={choices} disabled={false} />);
    await waitFor(() => {
        expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
            'Item 0',
            'Item 1',
            'Item 2',
            'Item 3',
            'Item 4',
        ]);
    });
    rerender(<TestComponent choices={choices} disabled />);
    expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
        'Item 0',
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
    ]);
    rerender(<TestComponent choices={choices} disabled query={{ last: 1 }} />);
    // Changing query shouldn't have changed anything yet
    expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
        'Item 0',
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
    ]);
    // Toggling disabled off now should result in query
    await act(async () => {
        rerender(<TestComponent choices={choices} query={{ last: 1 }} />);
    });
    expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
        'Item 15',
        'Item 16',
        'Item 17',
        'Item 18',
        'Item 19',
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('should handle errors', async () => {
    fetchMock.mockResponseOnce((request: Request) => {
        return Promise.resolve({
            body: JSON.stringify({
                message: 'Internal error',
            }),
            init: {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
    });
    const endpoint = new PaginatedEndpoint(new UrlPattern('/whatever/'));
    const choices = new EndpointAsyncChoices<TestDataItem>(endpoint, {
        getLabel(item: TestDataItem): React.ReactNode {
            return item.name;
        },
        getValue(item: TestDataItem): number {
            return item.pk;
        },
    });

    const { rerender, getByTestId } = render(<TestComponent choices={choices} />);
    await waitFor(() => {
        expect(getByTestId('error')).toHaveTextContent('Internal error');
    });
    fetchMock.mockResponse(mockedPaginatedResponse);
    await act(async () => {
        rerender(<TestComponent choices={choices} query={{ a: '1' }} />);
    });
    expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
        'Item 0',
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
    ]);
});

test('should support currentValue', async () => {
    fetchMock.mockResponse(mockedPaginatedResponse);
    const endpoint = new PaginatedEndpoint(new UrlPattern('/whatever/'));
    const choices = new EndpointAsyncChoices<TestDataItem>(endpoint, {
        getLabel(item: TestDataItem): React.ReactNode {
            return item.name;
        },
        getValue(item: TestDataItem): number {
            return item.pk;
        },
    });

    const { rerender, getByTestId } = render(<TestComponent choices={choices} value={6} />);
    await waitFor(() => {
        expect(getByTestId('currentValue')).toHaveTextContent('Item 6');
    });
    expect([...getByTestId('list').children].map(li => li.innerHTML)).toEqual([
        'Item 0',
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
    ]);
    // 1 call for the list and one for the current value
    expect(fetchMock).toHaveBeenCalledTimes(2);
    rerender(<TestComponent choices={choices} value={1} />);
    await waitFor(() => {
        expect(getByTestId('currentValue')).toHaveTextContent('Item 1');
    });
    // No calls to fetch should occur as value is already known
    expect(fetchMock).toHaveBeenCalledTimes(2);
});
