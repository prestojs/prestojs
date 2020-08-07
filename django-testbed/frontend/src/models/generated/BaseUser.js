import { CharField, EmailField, NumberField, viewModelFactory } from '@prestojs/viewmodel';

export default class Base extends viewModelFactory({
    id: new NumberField({
        label: 'Id',
    }),
    // eslint-disable-next-line @typescript-eslint/camelcase
    firstName: new CharField({
        label: 'First Name',
    }),
    // eslint-disable-next-line @typescript-eslint/camelcase
    lastName: new CharField({
        label: 'Last Name',
    }),
    email: new EmailField({
        label: 'Email',
    }),
}) {
    static label = 'User';
    static labelPlural = 'Users';
}
