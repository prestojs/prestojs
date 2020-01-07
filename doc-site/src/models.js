import { CharField, EmailField, ViewModel, NumberField } from '@prestojs/viewmodel';

export class User extends ViewModel {
    static label = 'User';
    static labelPlural = 'Users';

    static _fields = {
        id: new NumberField(),
        firstName: new CharField(),
        lastName: new CharField(),
        email: new EmailField(),
    };
}
