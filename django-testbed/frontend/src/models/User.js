/* eslint-disable no-use-before-define,@typescript-eslint/no-use-before-define */
import { Endpoint, paginationMiddleware, viewModelCachingMiddleware } from '@prestojs/rest';
import { usePaginator } from '@prestojs/util';
import {
    AsyncChoices,
    ImageField,
    IntegerField,
    NullableBooleanField,
    useViewModelCache,
} from '@prestojs/viewmodel';

import namedUrls from '../namedUrls';

import BaseUser from './generated/BaseUser';

const middleware = [viewModelCachingMiddleware(() => User)];

const endpoints = {
    retrieve: new Endpoint(namedUrls.get('users-detail'), { middleware }),
    update: new Endpoint(namedUrls.get('users-detail'), {
        middleware,
        method: 'patch',
    }),
    list: new Endpoint(namedUrls.get('users-list'), {
        middleware: [...middleware, paginationMiddleware()],
        resolveUrl(urlPattern, urlArgs, query) {
            return urlPattern.resolve(urlArgs, {
                // default to pageNumber pagination if not specified
                query: { ...query, paginationType: query.paginationType || 'pageNumber' },
            });
        },
    }),
    create: new Endpoint(namedUrls.get('users-list'), {
        method: 'post',
        middleware,
    }),
    delete: new Endpoint(namedUrls.get('users-detail'), {
        method: 'DELETE',
        middleware,
    }),
};
const asyncChoicesOptions = {
    useRetrieveProps(args) {
        return {
            ...args,
            // Make everything in cache available so we can avoid new lookups if not required
            existingValues: User.cache.getAll(['firstName', 'lastName', 'email', 'region']),
        };
    },
    useListProps() {
        const paginator = usePaginator(endpoints.list);
        return { paginator };
    },
    async list(params, deps) {
        return (await endpoints.list.execute({ ...params, ...deps })).result;
    },
    async retrieve(value, deps) {
        return (await endpoints.retrieve.execute({ urlArgs: { id: value }, ...deps })).result;
    },
    useResolveItems(item) {
        return useViewModelCache(User, cache => {
            if (!item) {
                return item;
            }

            return Array.isArray(item) ? cache.getList(item) : cache.get(item) || item;
        });
    },
};
export default class User extends BaseUser.augment({
    referredBy: new IntegerField({
        asyncChoices: new AsyncChoices(asyncChoicesOptions),
    }),
    referredByGrouped: new IntegerField({
        asyncChoices: new AsyncChoices({
            ...asyncChoicesOptions,
            getChoices(items) {
                const groups = {};
                for (const item of items) {
                    const label = this.getLabel(item);
                    const value = this.getValue(item);
                    const l = label[0].toLowerCase();
                    groups[l] = groups[l] || [l.toUpperCase(), []];
                    groups[l][1].push({ label, value });
                }
                return Object.values(groups);
            },
        }),
    }),
    friends: new IntegerField({
        asyncChoices: new AsyncChoices({
            ...asyncChoicesOptions,
            multiple: true,
            useRetrieveProps(props) {
                const paginator = usePaginator(endpoints.list);

                return {
                    ...props,
                    paginator,
                    existingValues: User.cache.getAll(['firstName', 'lastName', 'email', 'region']),
                };
            },
            async retrieve(value, deps) {
                return (await endpoints.list.execute({ query: { ids: value }, ...deps })).result;
            },
        }),
    }),
    region: new IntegerField({
        label: 'region',
        blank: false,
        helpText: 'Region Coding of the user',
        choices: [
            [1, 'Oceania'],
            [2, 'Asia'],
            [3, 'Africa'],
            [4, 'America'],
            [5, 'Europe'],
            [6, 'Antarctica'],
            [7, 'Atlantis'],
        ],
    }),
    photo: new ImageField({
        label: 'Photo',
        helpText: 'foooo towwww',
    }),
    adult: new NullableBooleanField({
        label: 'Adult',
    }),
}) {
    // TODO: Not sure if we want this to be the convention. Maybe best to just
    // export as mapping of endpoints somewhere?
    static endpoints = endpoints;

    getLabel() {
        return `${this.firstName} ${this.lastName} (${this.email})`;
    }
}
