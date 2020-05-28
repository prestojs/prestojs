/* eslint-disable no-use-before-define,@typescript-eslint/no-use-before-define */
import { Endpoint, PaginatedEndpoint, usePaginator } from '@prestojs/rest';
import {
    AsyncChoices,
    CharField,
    FilterSet,
    ImageField,
    IntegerField,
    NullableBooleanField,
    NumberField,
} from '@prestojs/viewmodel';

import namedUrls from '../namedUrls';

import BaseUser from './generated/BaseUser';

function transformAndCacheUser(data) {
    if (data.results && data.count != null) {
        throw new Error(
            'Response is paginated but paginator was not defined. Do you need to use PaginatedEndpoint instead?'
        );
    }
    if (Array.isArray(data)) {
        const users = data.map(datum => new User(datum));
        User.cache.addList(users);
        return users;
    }
    const user = new User(data);
    User.cache.add(user);
    return user;
}

const endpoints = {
    retrieve: new Endpoint(namedUrls.get('users-detail'), {
        transformResponseBody: transformAndCacheUser,
    }),
    update: new Endpoint(namedUrls.get('users-detail'), {
        transformResponseBody: transformAndCacheUser,
        method: 'patch',
    }),
    list: new PaginatedEndpoint(namedUrls.get('users-list'), {
        transformResponseBody: transformAndCacheUser,
        resolveUrl(urlPattern, urlArgs, query) {
            return urlPattern.resolve(urlArgs, {
                // default to pageNumber pagination if not specified
                query: { ...query, paginationType: query.paginationType || 'pageNumber' },
            });
        },
    }),
    create: new Endpoint(namedUrls.get('users-list'), {
        transformResponseBody: transformAndCacheUser,
        method: 'post',
    }),
};
console.log(AsyncChoices);
export default class User extends BaseUser.augment({
    referredBy: new IntegerField({
        asyncChoices: new AsyncChoices({
            useListDeps() {
                const paginator = usePaginator(endpoints.list);
                return { paginator };
            },
            async list(params, deps) {
                return (await endpoints.list.execute({ ...params, ...deps })).result;
            },
            async retrieve(value, deps) {
                return (await endpoints.retrieve.execute({ urlArgs: { id: value }, ...deps }))
                    .result;
            },
            getLabel(item) {
                return `${item.first_name} ${item.last_name} (${item.email})`;
            },
            getValue(item) {
                return item._pk;
            },
        }),
    }),
    referredByGrouped: new IntegerField({
        asyncChoices: new AsyncChoices({
            useListDeps() {
                const paginator = usePaginator(endpoints.list);
                return { paginator };
            },
            async list(params, deps) {
                return (await endpoints.list.execute({ ...params, ...deps })).result;
            },
            async retrieve(value, deps) {
                return (await endpoints.retrieve.execute({ urlArgs: { id: value }, ...deps }))
                    .result;
            },
            getLabel(item) {
                return `${item.first_name} ${item.last_name} (${item.email})`;
            },
            getValue(item) {
                return item._pk;
            },
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
            multiple: true,
            useListDeps() {
                const paginator = usePaginator(endpoints.list);
                return { paginator };
            },
            async list(params, deps) {
                return (await endpoints.list.execute({ ...params, ...deps })).result;
            },
            useRetrieveDeps() {
                const paginator = usePaginator(endpoints.list);
                return { paginator };
            },
            async retrieve(value, deps) {
                return (await endpoints.list.execute({ query: { ids: value }, ...deps })).result;
            },
            getLabel(item) {
                return `${item.first_name} ${item.last_name} (${item.email})`;
            },
            getValue(item) {
                return item._pk;
            },
        }),
    }),
    // referredBy: new IntegerField({
    //     asyncChoices: new EndpointAsyncChoices(
    //         new PaginatedEndpoint(namedUrls.get('users-list'), {
    //             transformResponseBody: transformAndCacheUser,
    //             resolveUrl(urlPattern, urlArgs, query) {
    //                 return urlPattern.resolve(urlArgs, {
    //                     query: { ...query, paginationType: 'pageNumber' },
    //                 });
    //             },
    //         }),
    //         {
    //             getLabel(item) {
    //                 return `${item.first_name} ${item.last_name} (${item.email})`;
    //             },
    //             getValue(item) {
    //                 return item._pk;
    //             },
    //         }
    //     ),
    // }),
    // referredByGrouped: new IntegerField({
    //     asyncChoices: new EndpointAsyncChoices(
    //         new PaginatedEndpoint(namedUrls.get('users-list'), {
    //             transformResponseBody: transformAndCacheUser,
    //             resolveUrl(urlPattern, urlArgs, query) {
    //                 return urlPattern.resolve(urlArgs, {
    //                     query: { ...query, paginationType: 'pageNumber' },
    //                 });
    //             },
    //         }),
    //         {
    //             getChoices(items) {
    //                 const groups = {};
    //                 for (const item of items) {
    //                     const label = this.getLabel(item);
    //                     const value = this.getValue(item);
    //                     const l = label[0].toLowerCase();
    //                     groups[l] = groups[l] || [l.toUpperCase(), []];
    //                     groups[l][1].push({ label, value });
    //                 }
    //                 return Object.values(groups);
    //             },
    //             getLabel(item) {
    //                 return `${item.first_name} ${item.last_name} (${item.email})`;
    //             },
    //             getValue(item) {
    //                 return item._pk;
    //             },
    //         }
    //     ),
    // }),
    region: new IntegerField({
        label: 'region',
        required: true,
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
}

window.User = User;
window.BaseUser = BaseUser;

export class UserFilterSet extends FilterSet {
    static _model = User;

    static _fields = {
        id: new NumberField({
            label: 'Id',
        }),
        // eslint-disable-next-line @typescript-eslint/camelcase
        first_name: new CharField({
            label: 'First Name',
        }),
        // eslint-disable-next-line @typescript-eslint/camelcase
        last_name: new CharField({
            label: 'Last Name',
        }),
    };
}
