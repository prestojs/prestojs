import {
    CharField,
    EmailField,
    viewModelFactory,
    NumberField,
    BooleanField,
} from '@prestojs/viewmodel';

export class User extends viewModelFactory({
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
}) {
    static label = 'User';
    static labelPlural = 'Users';
}
