import { ViewModel, NumberField } from '@xenopus/viewmodel';

export default class User extends ViewModel {
    static label = 'User';
    static labelPlural = 'Users';

    static fields = {
        age: new NumberField({
            name: 'age',
            label: 'Age',
            required: true,
            helpText: 'Users age in years',
        }),
    };
}
