import { CharField, EmailField, ViewModel, NumberField } from '@prestojs/viewmodel';

export default class Base extends ViewModel({
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
}) {
    static label = 'User';
    static labelPlural = 'Users';
}
