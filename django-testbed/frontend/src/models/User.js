import { Endpoint } from '@xenopus/rest';
import { UrlPattern } from '@xenopus/routing';
import { NumberField } from '@xenopus/viewmodel';

import BaseUser from './generated/BaseUser';

export default class User extends BaseUser {
    static fields = {
        ...BaseUser.fields,
        age: new NumberField({
            name: 'age',
            label: 'Age',
            required: true,
            helpText: 'Users age in years',
        }),
    };
}

export const userDetail = new Endpoint(new UrlPattern('/api/users/:id/'), {
    transformBody: data => {
        const user = new User(data);
        User.cache.add(user);
        return user;
    },
});

export const userList = new Endpoint(new UrlPattern('/api/users/'), {
    transformBody: data => {
        if (Array.isArray(data)) {
            const users = data.map(datum => new User(datum));
            User.cache.addList(users);
            return users;
        }
        const user = new User(data);
        User.cache.add(user);
        return user;
    },
});

window.User = User;
