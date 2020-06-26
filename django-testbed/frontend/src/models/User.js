/* eslint-disable no-use-before-define,@typescript-eslint/no-use-before-define */
import { Endpoint, PaginatedEndpoint } from '@prestojs/rest';
import { usePaginator } from '@prestojs/util';
import {
    AsyncChoices,
    CharField,
    FilterSet,
    ImageField,
    IntegerField,
    NullableBooleanField,
    NumberField,
    useViewModelCache,
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
const asyncChoicesOptions = {
    useRetrieveProps(args) {
        return {
            ...args,
            // Make everything in cache available so we can avoid new lookups if not required
            existingValues: User.cache.getAll(['first_name', 'last_name', 'email', 'region']),
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
            if (Array.isArray(item)) {
                console.log(cache.getList(item));
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
                    existingValues: User.cache.getAll([
                        'first_name',
                        'last_name',
                        'email',
                        'region',
                    ]),
                };
            },
            async retrieve(value, deps) {
                return (await endpoints.list.execute({ query: { ids: value }, ...deps })).result;
            },
        }),
    }),
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

    getLabel() {
        return `${this.first_name} ${this.last_name} (${this.email})`;
    }
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
