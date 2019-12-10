import { CharField, EmailField, ViewModel, NumberField } from '@xenopus/viewmodel';

export default class Base extends ViewModel {
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
    };
}
