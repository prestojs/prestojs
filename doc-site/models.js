import {
    BooleanField,
    CharField,
    EmailField,
    NumberField,
    viewModelFactory,
} from '@prestojs/viewmodel';

export class User extends viewModelFactory(
    {
        id: new NumberField(),
        firstName: new CharField(),
        lastName: new CharField(),
        email: new EmailField(),
        isActive: new BooleanField({ label: 'Active?' }),
        contactType: new CharField({
            defaultValue: 'lead',
            choices: [
                ['lead', 'Lead'],
                ['contact', 'Contact'],
            ],
        }),
    },
    { pkFieldName: 'id' }
) {
    static label = 'User';
    static labelPlural = 'Users';
}
