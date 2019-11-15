import { Model } from '@xenopus/core';

export default class User extends Model {
    static _meta = {
        label: 'User',
        labelPlural: 'Users',
    };
}
