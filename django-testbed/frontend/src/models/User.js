/* eslint-disable no-use-before-define,@typescript-eslint/no-use-before-define */
import { Endpoint } from '@prestojs/rest';
import {
    IntegerField,
    ImageField,
    NullableBooleanField,
    FilterSet,
    CharField,
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

export default class User extends BaseUser {
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
        list: new Endpoint(namedUrls.get('users-list'), {
            transformResponseBody: transformAndCacheUser,
        }),
        create: new Endpoint(namedUrls.get('users-list'), {
            transformResponseBody: transformAndCacheUser,
            method: 'post',
        }),
    };

    static _fields = {
        ...BaseUser._fields,
        age: new IntegerField({
            label: 'Age',
            required: true,
            helpText: 'Users age in years',
            choices: [
                [1, 'One'],
                [2, 'OneOne'],
                [3, 'OneOneOne'],
                [4, 'OneOneOneOne'],
            ],
        }),
        photo: new ImageField({
            label: 'Photo',
            helpText: 'foooo towwww',
        }),
        adult: new NullableBooleanField({
            label: 'Adult',
        }),
    };
}

window.User = User;

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
