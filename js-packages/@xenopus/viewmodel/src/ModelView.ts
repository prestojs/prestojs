import Field from './fields/Field';

type FieldsMapping = { [key: string]: Field<any> };

export type PrimaryKey = string | number;
export type CompoundPrimaryKey = PrimaryKey[];

/**
 * Base ViewModel class for any model in the system. This should be extended and have relevant fields and meta data
 * set on it:
 *
 * ```js
 * class User extends ViewModel {
 *     static label = 'User';
 *     static labelPlural = 'Users';
 *
 *     static fields = {
 *         firstName: new CharField({...}),
 *         lastName: new CharField({...}),
 *     };
 * }
 * ```
 */
export default class ModelView {
    // Name of the primary key field for this this ViewModel (or fields for compound keys)
    static pkFieldName: string | string[] = 'id';
    static label: string;
    static labelPlural: string;
    static fields: FieldsMapping = {};

    // TODO: What's a better way to type the actual fields? Can't use [fieldName: string]: Field<any> here because
    // then all the other properties have to match that type (eg. _model below will have an error as no assignable to
    // Field<any>
    [fieldName: string]: any;

    public get _model(): typeof ModelView {
        return Object.getPrototypeOf(this).constructor;
    }

    /**
     * Shortcut to get the primary key for this record
     */
    public get _pk(): PrimaryKey | CompoundPrimaryKey {
        const { name, fields, pkFieldName } = this._model;
        if (Array.isArray(pkFieldName)) {
            const missingFields = pkFieldName.filter(fieldName => !fields[fieldName]);
            if (missingFields.length > 0) {
                const fieldDesc = `field${missingFields.length > 1 ? 's' : ''}`;
                throw new Error(
                    `${name} has 'pkFieldName' set to '${pkFieldName.join(
                        ', '
                    )}' but the ${fieldDesc} '${missingFields.join(
                        ', '
                    )}' does not exist in ${name}.fields. Either add the missing ${fieldDesc} or update 'pkFieldName' to reflect the actual primary key field.`
                );
            }
            return pkFieldName.map(fieldName => this[fieldName]);
        }
        if (!fields[pkFieldName]) {
            throw new Error(
                `${name} has 'pkFieldName' set to '${pkFieldName}' but no such field exists in ${name}.fields. Either add the missing field or update 'pkFieldName' to reflect the actual primary key field.`
            );
        }
        return this[pkFieldName];
    }

    // For a particular instance of a model only partial data may have been received. This
    // tracks the fields that were set.
    public _assignedFields: string[];

    /**
     * Get the data for each field on this record. This won't transform any special field
     * representations - for that use toJS(). This is a shortcut to manually iterating of the
     * fields to get the data out of the record.
     *
     * In general use toJS() instead.
     */
    public get _data(): {} {
        return this._assignedFields.reduce((acc, fieldName) => {
            acc[fieldName] = this[fieldName];
            return acc;
        }, {});
    }

    constructor(data: {}) {
        // TODO: Should partial fields be identified by absence of key?
        const assignedFields = [];
        const fields = this._model.fields;
        for (const key of Object.keys(data)) {
            const value = data[key];
            const field = fields[key];
            // TODO: What about supporting things like:
            // group = new ForeignKey(...)
            // which results in the id being set on `groupId` instead? we'd have to handle this
            // differently to support that.
            if (field) {
                this[key] = field.normalize(value);
                assignedFields.push(key);
            } else {
                // TODO: Should extra keys in data be a warning or ignored?
                console.warn(
                    `Received value for key ${key}. No such field exists on ${this.constructor.name}`
                );
            }
        }
        this._assignedFields = assignedFields;
        this._assignedFields.sort();
    }

    /**
     * Return data as object to pass as initial values to a form
     */
    serializeToForm(): {} {
        throw new Error('Not implemented. Pending changes to support data on ModelView.');
    }

    static toString(): string {
        return this.name;
    }

    /**
     * Return the data for this record as an object
     */
    public toJS(): {} {
        const data = {};
        for (const [fieldName, value] of Object.entries(this._data)) {
            data[fieldName] = this._model.fields[fieldName].toJS(value);
        }
        return data;
    }
}
