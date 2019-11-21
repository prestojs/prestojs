import { ModelView } from '@xenopus/viewmodel';

export default class User extends ModelView {
    static _meta = {
        label: 'User',
        labelPlural: 'Users',
    };
}
