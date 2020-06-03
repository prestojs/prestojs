/* eslint-disable no-use-before-define,@typescript-eslint/no-use-before-define */
import { Endpoint, PaginatedEndpoint } from '@prestojs/rest';
import {
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
    if (Array.isArray(data)) {
        const users = data.map(datum => new User(datum));
        User.cache.addList(users);
        return users;
    }
    const user = new User(data);
    User.cache.add(user);
    return user;
}

export default class User extends BaseUser.augment({
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
    static endpoints = {
        retrieve: new Endpoint(namedUrls.get('users-detail'), {
            transformResponseBody: transformAndCacheUser,
        }),
        update: new Endpoint(namedUrls.get('users-detail'), {
            transformResponseBody: transformAndCacheUser,
            method: 'patch',
        }),
        list: new PaginatedEndpoint(namedUrls.get('users-list'), {
            transformResponseBody: transformAndCacheUser,
        }),
        create: new Endpoint(namedUrls.get('users-list'), {
            transformResponseBody: transformAndCacheUser,
            method: 'post',
        }),
    };
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
