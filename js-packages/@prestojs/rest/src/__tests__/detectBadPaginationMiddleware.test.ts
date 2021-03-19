import { UrlPattern } from '@prestojs/routing';
import {
    CursorPaginator,
    InferredPaginator,
    LimitOffsetPaginator,
    PageNumberPaginator,
    PaginatorInterface,
    PaginatorInterfaceClass,
} from '@prestojs/util';
import { CharField, viewModelFactory } from '@prestojs/viewmodel';
import { renderHook } from '@testing-library/react-hooks';
import { FetchMock } from 'jest-fetch-mock';
import qs from 'query-string';
import { useState } from 'react';
import { act } from 'react-test-renderer';
import detectBadPaginationMiddleware from '../detectBadPaginationMiddleware';
import Endpoint from '../Endpoint';
import paginationMiddleware from '../paginationMiddleware';
import viewModelCachingMiddleware from '../viewModelCachingMiddleware';

const fetchMock = fetch as FetchMock;

const User = viewModelFactory({
    name: new CharField(),
});
const users = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `User ${i + 1}` }));

test.each`
    paginatorClass
    ${InferredPaginator}
    ${PageNumberPaginator}
    ${LimitOffsetPaginator}
    ${CursorPaginator}
`(
    'should detect if missing paginationMiddleware ($paginatorClass.name)',
    async ({ paginatorClass }) => {
        // We use viewModelCachingMiddleware here as it will break if it tries to run on paginated data that hasn't
        // gone through paginationMiddleware
        let endpoint = new Endpoint(new UrlPattern('/user/'), {
            middleware: [viewModelCachingMiddleware(User), detectBadPaginationMiddleware()],
        });

        function useTestHook(
            paginatorClass: PaginatorInterfaceClass,
            initialState = {}
        ): PaginatorInterface {
            return new paginatorClass(useState(initialState), useState());
        }
        fetchMock.mockResponseOnce(JSON.stringify(users), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        await act(async () => {
            const { result } = await endpoint.execute();
            expect(result).toEqual(users.map(data => new User(data)));
        });

        fetchMock.mockResponse(request => {
            const query = qs.parse(request.url.split('?')[1] || '');
            let data;
            let pageSize = 5;
            if (paginatorClass === PageNumberPaginator || paginatorClass === InferredPaginator) {
                let start = 0;
                let end = pageSize;
                if (query.page) {
                    start = (Number(query.page) - 1) * pageSize;
                    end = start + pageSize;
                }
                data = {
                    results: users.slice(start, end),
                    count: users.length,
                };
            } else if (paginatorClass === LimitOffsetPaginator) {
                let start = 0;
                let end = pageSize;
                if (query.offset) {
                    start = Number(query.offset);
                    end = start + pageSize;
                }
                data = {
                    results: users.slice(start, end),
                    next: `?limit=${pageSize}`,
                    total: users.length,
                };
            } else if (paginatorClass === CursorPaginator) {
                let start = 0;
                let end = pageSize;
                if (query.cursor) {
                    start = Number(query.cursor);
                    end = start + pageSize;
                }
                data = {
                    results: users.slice(start, end),
                    next: `?cursor=${Number(query.cursor || 0) + pageSize}`,
                };
            }
            return Promise.resolve({
                body: JSON.stringify(data),
                init: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            });
        });
        await act(async () => {
            const mockError = jest.spyOn(global.console, 'error');
            mockError.mockImplementation(() => undefined);
            await expect(() => endpoint.execute()).rejects.toThrowError();
            expect(mockError).toHaveBeenCalledWith(
                expect.stringContaining("looks paginated but 'paginationMiddleware' is not present")
            );
            mockError.mockClear();
        });

        endpoint = new Endpoint(new UrlPattern('/user/'), {
            middleware: [
                viewModelCachingMiddleware(User),
                paginationMiddleware(),
                detectBadPaginationMiddleware(),
            ],
        });

        await act(async () => {
            const mockError = jest.spyOn(global.console, 'error');
            mockError.mockImplementation(() => undefined);
            await expect(() => endpoint.execute()).rejects.toThrowError();
            expect(mockError).toHaveBeenCalledWith(
                expect.stringContaining("looks paginated and 'paginationMiddleware' is present")
            );
            mockError.mockClear();
        });

        let { result: hookResult } = renderHook(() => useTestHook(paginatorClass));

        await act(async () => {
            let r = await endpoint.execute({ paginator: hookResult.current });
            expect(hookResult.current).toBeInstanceOf(paginatorClass);
            expect(r.result).toEqual(users.slice(0, 5).map(d => new User(d)));
            hookResult.current.next();
            r = await endpoint.execute({ paginator: hookResult.current });
            expect(r.result).toEqual(users.slice(5, 10).map(d => new User(d)));
        });

        // Order shouldn't matter
        endpoint = new Endpoint(new UrlPattern('/user/'), {
            middleware: [detectBadPaginationMiddleware(), viewModelCachingMiddleware(User)],
        });

        await act(async () => {
            const mockError = jest.spyOn(global.console, 'error');
            mockError.mockImplementation(() => undefined);

            await expect(() =>
                endpoint.execute({ paginator: hookResult.current })
            ).rejects.toThrowError();
            expect(mockError).toHaveBeenCalledWith(
                expect.stringContaining("looks paginated but 'paginationMiddleware' is not present")
            );
            mockError.mockClear();
        });
    }
);
