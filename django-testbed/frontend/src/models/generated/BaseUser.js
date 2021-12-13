import { CharField, EmailField, NumberField, viewModelFactory } from '@prestojs/viewmodel';

export default class Base extends viewModelFactory(
    {
        id: new NumberField({
            label: 'Id',
        }),
        firstName: new CharField({
            label: 'First Name',
        }),
        lastName: new CharField({
            label: 'Last Name',
        }),
        email: new EmailField({
            label: 'Email',
        }),
    },
    { pkFieldName: 'id' }
) {
    static label = 'User';
    static labelPlural = 'Users';
}
