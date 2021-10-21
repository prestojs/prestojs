import { UrlPattern } from '@prestojs/routing';
import { PageNumberPaginator } from '@prestojs/util';
import {
    CharField,
    IntegerField,
    ListField,
    ManyRelatedViewModelField,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { renderHook } from '@testing-library/react-hooks';
import { FetchMock } from 'jest-fetch-mock';
import qs from 'query-string';
import { useState } from 'react';
import { act } from 'react-test-renderer';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { recordEqualTo } from '../../../../../js-testing/matchers';
import Endpoint from '../Endpoint';
import paginationMiddleware from '../paginationMiddleware';
import viewModelCachingMiddleware from '../viewModelCachingMiddleware';

const fetchMock = fetch as FetchMock;

beforeEach(() => {
    fetchMock.resetMocks();
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createData() {
    const User = viewModelFactory({
        firstName: new CharField(),
        lastName: new CharField(),
    });

    const Food = viewModelFactory({
        name: new CharField(),
    });

    const users = [
        {
            id: 1,
            firstName: 'Bilbo',
            lastName: 'Baggins',
        },
        {
            id: 2,
            firstName: 'Frodo',
            lastName: 'Baggins',
        },
        {
            id: 3,
            firstName: 'Gandalf',
            lastName: '',
        },
    ];

    const foodItems = [
        {
            id: 1,
            name: 'Bagel',
        },
        {
            id: 2,
            name: 'Sausage',
        },
        {
            id: 3,
            name: 'Cheese',
        },
    ];

    const bilbo = new User(users[0]);
    const frodo = new User(users[1]);
    const gandalf = new User(users[2]);
    const bagel = new Food(foodItems[0]);
    const sausage = new Food(foodItems[1]);
    const cheese = new Food(foodItems[2]);

    return { User, users, Food, foodItems, bilbo, frodo, gandalf, bagel, sausage, cheese };
}

function mockJsonResponse(data): void {
    fetchMock.mockResponseOnce(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

test('should support single ViewModel as mapping for standard single/list responses', async () => {
    const { User, users, bilbo, frodo, gandalf } = createData();
    const endpoint = new Endpoint(new UrlPattern('/user/'), {
        middleware: [viewModelCachingMiddleware(User)],
    });
    mockJsonResponse(users[0]);
    expect((await endpoint.execute()).result).toBeEqualToRecord(bilbo);
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);

    mockJsonResponse(users.slice(0, 3));
    expect((await endpoint.execute()).result).toBeEqualToRecord(
        users.slice(0, 3).map(u => new User(u))
    );
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);
    expect(User.cache.get(2, ['firstName', 'lastName'])).toBeEqualToRecord(frodo);
    expect(User.cache.get(3, ['firstName', 'lastName'])).toBeEqualToRecord(gandalf);
});

test('should support object mapping', async () => {
    const {
        User,
        Food,
        users,
        foodItems,
        sausage,
        cheese,
        bagel,
        bilbo,
        frodo,
        gandalf,
    } = createData();
    const endpoint = new Endpoint(new UrlPattern('/combined/'), {
        middleware: [
            viewModelCachingMiddleware({
                user: User,
                food: Food,
            }),
        ],
    });
    mockJsonResponse({ user: users[0] });
    expect((await endpoint.execute()).result).toEqual({ user: recordEqualTo(bilbo) });
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);

    mockJsonResponse({ user: users[1], food: foodItems[0] });
    expect((await endpoint.execute()).result).toEqual({
        user: recordEqualTo(frodo),
        food: recordEqualTo(bagel),
    });
    expect(User.cache.get(2, ['firstName', 'lastName'])).toBeEqualToRecord(frodo);
    expect(Food.cache.get(1, ['name'])).toBeEqualToRecord(bagel);

    mockJsonResponse({ user: users.slice(0, 3), food: foodItems.slice(0, 3) });
    expect((await endpoint.execute()).result).toEqual({
        user: [bilbo, frodo, gandalf],
        food: [bagel, sausage, cheese],
    });
});

test('should support nested object mapping', async () => {
    const { User, Food, users, foodItems, sausage, bagel, bilbo } = createData();
    const endpoint = new Endpoint(new UrlPattern('/combined/'), {
        middleware: [
            viewModelCachingMiddleware({
                'records.user': User,
                'records.food': Food,
            }),
        ],
    });
    mockJsonResponse({ records: { user: users[0], food: foodItems.slice(0, 2) } });
    expect((await endpoint.execute()).result).toEqual({
        records: {
            user: recordEqualTo(bilbo),
            food: [bagel, sausage],
        },
    });
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);

    expect(Food.cache.get(1, ['name'])).toBeEqualToRecord(bagel);
    expect(Food.cache.get(2, ['name'])).toBeEqualToRecord(sausage);
});

test('extra keys should be retained', async () => {
    const { User, Food, users, foodItems, sausage, bagel, bilbo } = createData();
    const endpoint = new Endpoint(new UrlPattern('/combined/'), {
        middleware: [
            viewModelCachingMiddleware({
                'records.user': User,
                'records.food': Food,
            }),
        ],
    });
    mockJsonResponse({
        records: { user: users[0], food: foodItems.slice(0, 2), numbers: [1, 2, 3] },
        other: true,
    });
    expect((await endpoint.execute()).result).toEqual({
        records: {
            user: recordEqualTo(bilbo),
            food: [bagel, sausage],
            numbers: [1, 2, 3],
        },
        other: true,
    });
});

test('should support defining mapping as a function/promise', async () => {
    const { User, Food, users, foodItems, sausage, bagel, bilbo } = createData();
    const endpoint = new Endpoint(new UrlPattern('/combined/'), {
        middleware: [
            viewModelCachingMiddleware(() =>
                Promise.resolve({
                    'records.user': User,
                    'records.food': Food,
                })
            ),
        ],
    });
    mockJsonResponse({ records: { user: users[0], food: foodItems.slice(0, 2) } });
    expect((await endpoint.execute()).result).toEqual({
        records: {
            user: recordEqualTo(bilbo),
            food: [bagel, sausage],
        },
    });
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);

    expect(Food.cache.get(1, ['name'])).toBeEqualToRecord(bagel);
    expect(Food.cache.get(2, ['name'])).toBeEqualToRecord(sausage);
});

test('should support deletes', async () => {
    const { User, users, bilbo } = createData();
    User.cache.add(users);
    expect(User.cache.get(1, '*')).toEqual(bilbo);
    const endpoint = new Endpoint(new UrlPattern('/user/:id'), {
        middleware: [viewModelCachingMiddleware(User)],
        method: 'DELETE',
    });
    fetchMock.mockResponse('', {
        status: 204,
    });
    await endpoint.execute({ urlArgs: { id: 1 } });
    expect(User.cache.get(1, '*')).toBe(null);

    expect(() => {
        new Endpoint(new UrlPattern('/user/:userId'), {
            middleware: [viewModelCachingMiddleware(User)],
            method: 'DELETE',
        });
    }).toThrowError(/UrlPattern includes an 'id' parameter/);
});

test('should support deleteViewModel option and delete/update with one call', async () => {
    const { User, users, bilbo, Food, sausage } = createData();
    User.cache.add(users);
    Food.cache.add(sausage);
    expect(User.cache.get(1, '*')).toEqual(bilbo);
    const endpoint = new Endpoint(new UrlPattern('/user/:id'), {
        middleware: [viewModelCachingMiddleware({ food: Food }, { deleteViewModel: User })],
        method: 'DELETE',
    });
    mockJsonResponse({ food: { id: sausage.id, name: 'banana' } });
    await endpoint.execute({ urlArgs: { id: 1 } });
    expect(User.cache.get(1, '*')).toBe(null);
    const newSausage = Food.cache.get(sausage.id, '*');
    expect(newSausage?.id).toEqual(sausage.id);
    expect(newSausage?.name).toEqual('banana');
});

test('should support custom getDeleteId', async () => {
    const { User, users, bilbo } = createData();
    User.cache.add(users);
    expect(User.cache.get(1, '*')).toEqual(bilbo);
    function getDeleteId(context): string {
        return context.executeOptions.urlArgs?.userId;
    }
    getDeleteId.validateEndpoint = (endpoint): void => {
        if (!endpoint.urlPattern.requiredArgNames.includes('userId')) {
            throw new Error('Endpoint pattern wrong');
        }
    };
    const endpoint = new Endpoint(new UrlPattern('/user/:userId'), {
        middleware: [
            viewModelCachingMiddleware(User, {
                getDeleteId,
            }),
        ],
        method: 'DELETE',
    });
    fetchMock.mockResponse('', {
        status: 204,
    });
    await endpoint.execute({ urlArgs: { userId: 1 } });
    expect(User.cache.get(1, '*')).toBe(null);

    expect(() => {
        new Endpoint(new UrlPattern('/user/:id'), {
            middleware: [
                viewModelCachingMiddleware(User, {
                    getDeleteId,
                }),
            ],
            method: 'DELETE',
        });
    }).toThrowError(new Error('Endpoint pattern wrong'));
});

test('should error if included in wrong order with paginationMiddleware', async () => {
    const { User } = createData();
    expect(
        () =>
            new Endpoint(new UrlPattern('/user/'), {
                middleware: [paginationMiddleware(), viewModelCachingMiddleware(User)],
            })
    ).toThrowError("'paginationMiddleware' must come after 'viewModelCachingMiddleware'");

    // This should work
    new Endpoint(new UrlPattern('/user/'), {
        middleware: [viewModelCachingMiddleware(User), paginationMiddleware()],
    });
});

test('object notation should work with pagination', async () => {
    const { User, Food, users, foodItems } = createData();
    const endpoint = new Endpoint(new UrlPattern('/combined/'), {
        middleware: [
            viewModelCachingMiddleware({
                'records.user': User,
                'records.food': Food,
            }),
            paginationMiddleware(undefined, { resultPath: 'records.user' }),
        ],
    });
    fetchMock.mockResponse(request => {
        const query = qs.parse(request.url.split('?')[1] || '');
        let { page = 1, pageSize = 2 } = query;
        page = Number(page);
        pageSize = Number(pageSize);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return Promise.resolve({
            body: JSON.stringify({
                records: {
                    user: {
                        count: users.length,
                        results: users.slice(start, end),
                    },
                    food: foodItems[0],
                },
                extraDetails: [1, 2, 3],
            }),
            init: {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        });
    });
    function useTestHook(initialState = {}): PageNumberPaginator {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return new PageNumberPaginator(useState(initialState), useState());
    }
    const {
        result: { current: paginator },
    } = renderHook(() => useTestHook());
    await act(async () => {
        const endpointReturn = await endpoint.execute({ paginator });
        expect(endpointReturn.result).toEqual({
            records: {
                user: users.slice(0, 2).map(d => recordEqualTo(d)),
                food: recordEqualTo(foodItems[0]),
            },
            extraDetails: [1, 2, 3],
        });
    });
    expect(paginator.internalState.total).toBe(3);
    expect(paginator.currentState.pageSize).toBe(2);

    await act(async () => {
        paginator.next();
        const endpointReturn = await endpoint.execute({ paginator });
        expect(endpointReturn.result).toEqual({
            records: {
                user: users.slice(2, 4).map(d => recordEqualTo(d)),
                food: recordEqualTo(foodItems[0]),
            },
            extraDetails: [1, 2, 3],
        });
    });
});

test('should fire single listeners on delete', async () => {
    const { User, bilbo, frodo } = createData();
    class Test2 extends viewModelFactory({
        records: new ManyRelatedViewModelField({
            to: User,
            sourceFieldName: 'recordIds',
        }),
        recordIds: new ListField({
            childField: new IntegerField(),
        }),
    }) {}

    const record1 = new Test2({
        id: 5,
        records: [bilbo, frodo],
    });
    Test2.cache.add(record1);

    const listener = jest.fn();
    Test2.cache.addListener(5, ['id', 'recordIds', 'records'], listener);

    const endpoint = new Endpoint(new UrlPattern('/user/:id/'), {
        method: 'DELETE',
        middleware: [
            viewModelCachingMiddleware(
                {
                    record: Test2,
                },
                { deleteViewModel: User }
            ),
        ],
    });

    mockJsonResponse({ record: { id: 5, recordIds: [frodo.id] } });
    await endpoint.execute({ urlArgs: { id: bilbo.id } });
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
        null,
        recordEqualTo({ id: 5, recordIds: [frodo.id], records: [frodo] })
    );
});
