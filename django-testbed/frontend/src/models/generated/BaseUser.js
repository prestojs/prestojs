import { CharField, EmailField, ViewModel, NumberField } from '@xenopus/viewmodel';

export default class Base extends ViewModel {
    static label = 'User';
    static labelPlural = 'Users';

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
        email: new EmailField({
            label: 'Email',
        }),
    };
}
