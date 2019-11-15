import Field from './fields/Field';

type FieldsMapping = { [key: string]: Field<any> };

export default class Model {
    public static _meta = {
        label: 'NOT SET',
        labelPlural: 'NOT SET',
    };

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
