import { RestAction } from '@xenopus/rest';
import { UrlPattern } from '@xenopus/routing';
import { CharField, EmailField, ViewModel, NumberField } from '@xenopus/viewmodel';

export default class User extends ViewModel {
    static label = 'User';
    static labelPlural = 'Users';

    static fields = {
        id: new NumberField({
            name: 'id',
            label: 'Id',
        }),
        // eslint-disable-next-line @typescript-eslint/camelcase
        first_name: new CharField({
            name: 'first_name',
            label: 'First Name',
        }),
        // eslint-disable-next-line @typescript-eslint/camelcase
        last_name: new CharField({
            name: 'last_name',
            label: 'Last Name',
        }),
        email: new EmailField({
            name: 'email',
            label: 'Email',
        }),
        age: new NumberField({
            name: 'age',
            label: 'Age',
            required: true,
            helpText: 'Users age in years',
        }),
    };
}

export const userDetail = new RestAction(new UrlPattern('/api/users/:id/'), {
    transformBody: data => {
        const user = new User(data);
        User.cache.add(user);
        return user;
    },
});

export const userList = new RestAction(new UrlPattern('/api/users/'), {
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
