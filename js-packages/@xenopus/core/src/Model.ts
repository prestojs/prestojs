import Field from './fields/Field';

type FieldsMapping = { [key: string]: Field<any> };

/**
 * Base Model class for any model in the system. This should be extended and have relevant fields and _meta
 * set on it:
 *
 * ```js
 * class User extends Model {
 *     static _meta {
 *         label: 'User',
 *         labelPlural: 'Users',
 *     };
 *
 *     static firstName = new CharField({...});
 *     static lastName = new CharField({...});
 * }
 * ```
 */
export default class Model {
    public static _meta = {
        label: 'NOT SET',
        labelPlural: 'NOT SET',
    };

    public get _meta() {
        return Object.getPrototypeOf(this).constructor._meta;
    }

    /**
     * Get the defined fields for this model. Any property not starting with an underscore
     * and that is an instance of Field is considered a field.
     */
    get _fields(): FieldsMapping {
        return Object.getPrototypeOf(this).constructor._fields;
    }

    static get _fields(): FieldsMapping {
        const proto = Object.getPrototypeOf(this);
        const propertyNames = Object.getOwnPropertyNames(this).concat(
            Object.getOwnPropertyNames(proto)
        );
        return propertyNames
            .filter(name => !name.startsWith('_') && this[name] instanceof Field)
            .reduce((acc, name) => {
                acc[name] = this[name];
                return acc;
            }, {});
    }
}
