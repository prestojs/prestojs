import { Model } from '@xenopus/viewmodel';

export default class User extends Model {
    static _meta = {
        label: 'User',
        labelPlural: 'Users',
    };
}
