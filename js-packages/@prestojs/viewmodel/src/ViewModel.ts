import isEqual from 'lodash/isEqual';
import FieldBinder, { FieldsMapping } from './FieldBinder';
import NumberField from './fields/NumberField';
import { freezeObject, isDev } from './util';
import ViewModelCache from './ViewModelCache';
import Field from './fields/Field';

export type SinglePrimaryKey = string | number;
export type CompoundPrimaryKey = { [fieldName: string]: SinglePrimaryKey };
export type PrimaryKey = SinglePrimaryKey | CompoundPrimaryKey;

/**
 * Base ViewModel class for any model in the system. This should be extended and have relevant fields and meta data
 * set on it:
 *
 * ```js
 * class User extends ViewModel {
 *     // Optional; default cache is usually sufficient
 *     static cache = new MyCustomCache();
 *
 *     // Default pkFieldName is 'id'; if you have a different pk specify here
 *     // static pkFieldName = 'userId';
 *
 *     // Used to describe a single user
 *     static label = 'User';
 *     // User to describe an indeterminate number of users
 *     static labelPlural = 'Users';
 *
 *     static _fields = {
 *         userId: new IntegerField({ label: 'User ID' })
 *         firstName: new CharField({ label: 'First Name' }),
 *         // label is optional; will be generated as 'Last name'
 *         lastName: new CharField(),
 *     };
 * }
 * ```
 *
 * @extract-docs
 */
export default class ViewModel extends FieldBinder {
    static label: string;
    static labelPlural: string;

    private static __pkFieldNameMap: Map<typeof ViewModel, string | string[]> = new Map();

    // This gets triggered in test cases when extending a class... I don't think this is
    // standard behaviour and definitely doesn't occur in all the browsers + node I've tried.
    // Without this it triggers an error in test cases because only the getter is available.
    // Must be something to do with how code is being compiled.
    // eg.
    // class A extends ViewModel {
    //     // In test cases this triggers the setter
    //     // Everywhere else it just overrides the property
    //     static pkFieldName = 'id';
    // }
    public static set pkFieldName(pkFieldName: string | string[]) {
        Object.defineProperty(this, 'pkFieldName', { value: pkFieldName });
    }

    /**
     * Name of the primary key field for this this ViewModel (or fields for compound keys)
     *
     * If not specified a field will be created from `getImplicitPk`.
     */
    public static get pkFieldName(): string | string[] {
        // This is deferred to another function as we need to create pk fields either here
        // or in bindFields - whichever one is called first
        return this.getOrCreatePkField();
    }

    /**
     * Get or create primary key as required. Returns the primary key name(s).
     *
     * See createImplicitPkField for details on how `fields` is used
     */
    private static getOrCreatePkField(fields?: FieldsMapping): string | string[] {
        // If pkFieldName has been explicitly defined then we need to just return that
        const descriptor = Object.getOwnPropertyDescriptors(this).pkFieldName;
        if (descriptor && !descriptor.get) {
            return descriptor.value as string | string[];
        }

        // TODO: We could replace the getter here:
        //    Object.defineProperty(this, 'pkFieldName', { value: pkFieldName })
        // But then dynamic logic (eg. naming a field based on class name in
        // getImplicitPkField) will break, eg
        //
        // class User extends ViewModel {}
        // class AdminUser extends  B {}
        // Depending on order of access:
        // User.pkFieldName // = userId
        // AdminUser.pkFieldName // = userId
        //   vs
        // AdminUser.pkFieldName // = adminUserId
        // User.pkFieldName // = userId
        let pkFieldName = this.__pkFieldNameMap.get(this);
        if (!pkFieldName) {
            pkFieldName = this.createImplicitPkField(fields);
            this.__pkFieldNameMap.set(this, pkFieldName);
        }
        return pkFieldName;
    }

    /**
     * Create the implicit primary key field(s). If `fields` is provided then the new field(s) will be
     * added to this object otherwise `this._fields` will be replaced with a new object with the additional
     * fields added.
     *
     * The difference is to do with order of operations: if this.fields is accessed first then
     * fields will be passed in from bindFields otherwise if pkFieldName is accessed first we operate
     * directly on _fields.
     */
    protected static createImplicitPkField(fields?: FieldsMapping): string | string[] {
        const [pkFieldName, pkField] = this.getImplicitPkField();
        const extraFields = {};
        if (Array.isArray(pkFieldName) && Array.isArray(pkField)) {
            if (pkFieldName.length !== pkField.length) {
                throw new Error(
                    `When defining a compound key both the name and field definition must be an array of the same size. Received ${pkFieldName} and ${pkField}.`
                );
            }
            pkFieldName.forEach((fieldName, i) => {
                extraFields[fieldName] = pkField[i];
            });
        } else {
            if (Array.isArray(pkFieldName) || Array.isArray(pkField)) {
                throw new Error(
                    `When defining a compound key both the name and field definition must be an array. Received ${pkFieldName} and ${pkField}.`
                );
            }
            extraFields[pkFieldName] = pkField;
        }
        if (Object.keys(extraFields).length > 0) {
            if (!fields) {
                this._fields = { ...this._fields, ...extraFields };
            } else {
                Object.assign(fields, extraFields);
            }
        }
        return pkFieldName;
    }

    /**
     * When a primary key hasn't been explicitly defined on a ViewModel this method is
     * called to generate the default.
     *
     * This can inspect the class or other fields to generate this.
     *
     * ```js
     * static getImplicitPkField() {
     *     // Generate a name based on model class name
     *     // eg. `User` => `userId`, `AdminUser` => `adminUserId`
     *     const name = this.name[0].toLowerCase() + this.name.slice(1);
     *     return [`${name}Id`, new NumberField()];
     * }
     * ```
     *
     * You can also return an existing field to use that:
     *
     * ```js
     * static getImplicitPkField() {
     *     // If a ViewModel has an EntityId field use that, otherwise fallback to default
     *     if ('EntityId' in this.unboundFields) {
     *         return ['EntityId', this.unboundFields.EntityId];
     *     }
     *     return ['id', new NumberField()];
     * }
     * ```
     *
     * Compound keys are also supported:
     *
     * ```js
     * static getImplicitPkField() {
     *      return [
     *          ['model', 'uuid'],
     *          [new CharField(), new NumberField()],
     *      ];
     * }
     * ```
     */
    public static getImplicitPkField(): [string, Field<any>] | [string[], Field<any>[]] {
        // If id is defined as a field use that definition
        if ('id' in this.unboundFields) {
            return ['id', this.unboundFields.id];
        }
        return ['id', new NumberField()];
    }

    protected static bindFields(fields: FieldsMapping, bindTo: typeof FieldBinder): FieldsMapping {
        let pkFieldNames = this.getOrCreatePkField(fields);
        if (!Array.isArray(pkFieldNames)) {
            pkFieldNames = [pkFieldNames];
        }
        const missingFields = pkFieldNames.filter(fieldName => !fields[fieldName]);
        if (missingFields.length > 0) {
            throw new Error(
                `${this.name} has 'pkFieldName' set to '${pkFieldNames.join(
                    ', '
                )}' but the field(s) '${missingFields.join(', ')}' does not exist in ${
                    this.name
                }._fields. Either add the missing field(s) or update 'pkFieldName' to reflect the actual primary key field.`
            );
        }
        return super.bindFields(fields, bindTo);
    }

    private static __cache: Map<typeof ViewModel, ViewModelCache<ViewModel>> = new Map();
    public static get cache(): ViewModelCache<ViewModel> {
        // This is a getter so we can instantiate cache on each ViewModel independently without
        // having to have the descendant create the cache
        let cache = this.__cache.get(this);
        if (!cache) {
            cache = new ViewModelCache(this);
            this.__cache.set(this, cache);
        }
        return cache;
    }

    public static set cache(value: ViewModelCache<ViewModel>) {
        if (!(value instanceof ViewModelCache)) {
            throw new Error(`cache class must extend ViewModelCache. See ${this.name}.cache`);
        }
        this.__cache.set(this, value);
    }

    /**
     * Shortcut to get pkFieldName as an array always, even for non-compound keys
     */
    public static get pkFieldNames(): string[] {
        const pkFieldNames = this.pkFieldName;
        if (!Array.isArray(pkFieldNames)) {
            return [pkFieldNames];
        }
        return pkFieldNames;
    }

    // TODO: What's a better way to type the actual fields? Can't use [fieldName: string]: Field<any> here because
    // then all the other properties have to match that type (eg. _model below will have an error as no assignable to
    // Field<any>
    [fieldName: string]: any;

    public get _model(): typeof ViewModel {
        return Object.getPrototypeOf(this).constructor;
    }

    /**
     * Shortcut to get the primary key for this record
     */
    public get _pk(): PrimaryKey {
        const { pkFieldName } = this._model;
        if (Array.isArray(pkFieldName)) {
            return pkFieldName.reduce((acc, fieldName) => {
                acc[fieldName] = this[fieldName];
                return acc;
            }, {});
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
    public _data: { [fieldName: string]: any };

    constructor(data: {}) {
        super();
        // Catch any improperly defined classes at this point. eg. if a class is defined as
        // class A extends ViewModel {
        //    static fields = {
        // }
        // This will be caught here (it should be '_fields' not 'fields').
        // The check on `this._model.fields` exists so it triggers the getter on it and catches
        // the unlikely case of the property being deleted altogether rather than st replaced.
        // Error here is: TS2345: Argument of type 'typeof ViewModel' is not assignable to parameter of type 'typeof FieldBinder'.
        // Not sure what to do about that ¯\_(ツ)_/¯
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        if (!this._model.fields || !this._model.__boundFields.has(this._model)) {
            throw new Error(
                `Class ${this._model.name} has not been defined correctly. Make sure field definitions are set on the '_fields' property and not 'fields'.`
            );
        }
        const pkFieldNames = this._model.pkFieldNames;
        const missing = pkFieldNames.filter(name => !(name in data));
        const empty = pkFieldNames.filter(name => name in data && data[name] == null);
        const errors: string[] = [];
        if (empty.length > 0) {
            errors.push(
                `Primary key(s) '${empty.join("', '")}' was provided but was null or undefined`
            );
        }
        if (missing.length > 0) {
            errors.push(
                `Missing value(s) for primary key(s) '${missing.join(
                    "', '"
                )}'. If this was constructed from data returned from an endpoint ensure it is setup to return these field(s).`
            );
        }

        if (errors.length) {
            throw new Error(`(${this._model.name}): ${errors.join(', ')}`);
        }

        // TODO: Should partial fields be identified by absence of key?
        const assignedFields: string[] = [];
        const fields = this._model.fields;
        const assignedData = {};
        for (const key of Object.keys(data)) {
            const value = data[key];
            const field = fields[key];
            // TODO: What about supporting things like:
            // group = new ForeignKey(...)
            // which results in the id being set on `groupId` instead? we'd have to handle this
            // differently to support that.
            if (field) {
                assignedData[key] = field.normalize(value);
                assignedFields.push(key);
            } else {
                // TODO: Should extra keys in data be a warning or ignored?
                console.warn(
                    `Received value for key ${key}. No such field exists on ${this.constructor.name}`
                );
            }
        }

        this._data = freezeObject(assignedData);
        this._assignedFields = assignedFields;
        this._assignedFields.sort();

        for (const fieldName of Object.keys(fields)) {
            const definition: { set(value: any): any; get: () => any } = {
                set(): void {
                    const msg = `${fieldName} is read only`;
                    if (isDev()) {
                        throw new Error(msg);
                    } else {
                        console.warn(msg);
                    }
                },
                get(): any {
                    return assignedData[fieldName];
                },
            };
            if (!this._assignedFields.includes(fieldName)) {
                definition.get = (): void => {
                    const msg = `${fieldName} accessed but not fetched. Available fields are: ${this._assignedFields.join(
                        ', '
                    )}`;
                    if (isDev()) {
                        throw new Error(msg);
                    } else {
                        console.warn(msg);
                    }
                };
            }
            Object.defineProperty(this, fieldName, definition);
        }
    }

    /**
     * Return data as object to pass as initial values to a form
     */
    serializeToForm(): {} {
        throw new Error('Not implemented. Pending changes to support data on ViewModel.');
    }

    public static toString(): string {
        return this.name;
    }

    public toString(): string {
        return `${this._model.name}(${JSON.stringify(this.toJS(), null, 2)})`;
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

    /**
     * Compares two records to see if they are equivalent.
     *
     * - If the ViewModel is different then the records are always considered different
     * - If the records were initialised with a different set of fields then they are
     *   considered different even if the common fields are the same and other fields are
     *   all null
     */
    public isEqual(record: ViewModel): boolean {
        if (record._model !== this._model) {
            return false;
        }
        if (!isEqual(record._assignedFields, this._assignedFields)) {
            return false;
        }
        for (const fieldName of this._assignedFields) {
            const field = this._model.fields[fieldName];
            if (!field.isEqual(this[fieldName], record[fieldName])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Clone this record, optionally with only a subset of the fields
     */
    public clone(fieldNames?: string[]): this {
        const missingFieldNames = fieldNames
            ? fieldNames.filter(fieldName => !this._assignedFields.includes(fieldName))
            : [];
        if (fieldNames && missingFieldNames.length > 0) {
            throw new Error(
                `Can't clone ${this._model.name} with fields ${fieldNames.join(
                    ', '
                )} as only these fields are set: ${this._assignedFields.join(
                    ', '
                )}. Missing fields: ${missingFieldNames.join(', ')}`
            );
        }
        if (!fieldNames) {
            fieldNames = this._assignedFields;
        }

        const data = {};
        for (const fieldName of fieldNames) {
            // TODO: Unclear to me if this needs to call a method on the Field on not. Revisit this.
            data[fieldName] = this[fieldName];
        }

        // Always clone primary keys
        const pkFieldNames = this._model.pkFieldNames;
        pkFieldNames.forEach(name => (data[name] = this[name]));

        // I don't know how to type this, error is:
        // TS2322: Type 'ViewModel' is not assignable to type 'this'.
        // 'ViewModel' is assignable to the constraint of type 'this', but 'this' could be instantiated with a different subtype of constraint 'ViewModel'.
        // I could type return as `ViewModel` but then usages of it will be wrong (eg. clone() will be from a more general ViewModel to a specific implementation)
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        return new this._model(data);
    }
}
