import { ModelView, NumberField } from '@xenopus/viewmodel';

export default class User extends ModelView {
    static _meta = {
        label: 'User',
        labelPlural: 'Users',
    };

    static age = new NumberField({
        name: 'age',
        label: 'Age',
        required: true,
        helpText: 'Users age in years',
    });
}
