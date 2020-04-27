import isEqual from 'lodash/isEqual';
import startCase from 'lodash/startCase';

import Field from './fields/Field';
import NumberField from './fields/NumberField';
import { freezeObject, isDev } from './util';
import ViewModelCache from './ViewModelCache';

// Fields are defined as an object mapping field name to a field instance
export type FieldsMapping = { [fieldName: string]: Field<any> };
export type FieldsMappingOrNull = { [fieldName: string]: Field<any> | null };

// Extract mapping of field name to it's underlying data type
export type FieldDataMapping<T extends FieldsMapping> = {
    readonly [K in keyof T]: T[K]['__fieldValueType'];
};

// Extract mapping of field name to it's parsable data type. For most fields
// this is the same as the underlying type but could be something different, eg.
// parsing a string => number
export type FieldDataMappingRaw<T extends FieldsMapping> = {
    [K in keyof T]?: T[K]['__parsableValueType'];
};

export type SinglePrimaryKey = string | number;
export type CompoundPrimaryKey = { [fieldName: string]: SinglePrimaryKey };
export type PrimaryKey = SinglePrimaryKey | CompoundPrimaryKey;

/**
 * Creates a ViewModel class with the specified fields.
 *
 * ```js
 * const fields = {
 *     userId: new IntegerField({ label: 'User ID' })
 *     firstName: new CharField({ label: 'First Name' }),
 *     // label is optional; will be generated as 'Last name'
 *     lastName: new CharField(),
 * };
 * // Options are all optional and can be omitted entirely
 * const options = {
 *     // If not specified will create a default field called 'id'
 *     pkFieldName: 'userId',
 * };
 * class User extends ViewModel(fields, options) {
 *     // Optional; default cache is usually sufficient
 *     static cache = new MyCustomCache();
 *
 *     // Used to describe a single user
 *     static label = 'User';
 *     // User to describe an indeterminate number of users
 *     static labelPlural = 'Users';
 * }
 * ```
 */
export type ViewModelInterface<
    FieldMappingType extends FieldsMapping,
    InstanceFieldMappingType extends FieldMappingType,
    PkFieldType extends string | string[] = string | string[],
    PkType extends PrimaryKey = PrimaryKey
> = FieldDataMapping<FieldMappingType> & {
    __instanceFieldMappingType: InstanceFieldMappingType;
    /**
     * Get the actual ViewModel class for this instance
     */
    _model: ViewModelConstructor<FieldMappingType, PkFieldType, PkType>;
    /**
     * Return the data for this record as an object
     */
    toJS(): () => FieldDataMapping<FieldMappingType>;
    /**
     * Compares two records to see if they are equivalent.
     *
     * - If the ViewModel is different then the records are always considered different
     * - If the records were initialised with a different set of fields then they are
     *   considered different even if the common fields are the same and other fields are
     *   all null
     */
    isEqual(record: ViewModelInterface<FieldMappingType, InstanceFieldMappingType>): boolean;
    /**
     * Clone this record, optionally with only a subset of the fields
     */
    clone(
        fieldNames?: string[]
    ): ViewModelInterface<FieldMappingType, InstanceFieldMappingType, PkFieldType, PkType>;
    /**
     * Returns the primary key value(s) for this instance. This is a shortcut
     * for using the primary key field name(s) directly.
     */
    readonly _pk: PkType;

    /**
     * The assigned data for this record. You usually don't need to access this directly; values
     * for a field can be retrieved from the record directly using the field name
     */
    readonly _data: FieldDataMapping<InstanceFieldMappingType>;

    /**
     * List of field names with data available on this instance.
     *
     * @type-name string[]
     */
    readonly _assignedFields: (keyof InstanceFieldMappingType)[];
};

export interface ViewModelConstructor<
    FieldMappingType extends FieldsMapping,
    PkFieldType extends string | string[] = string | string[],
    PkType extends PrimaryKey = PrimaryKey
> {
    new <IncomingFieldsType extends FieldMappingType = FieldMappingType>(
        data: FieldDataMappingRaw<IncomingFieldsType>
    ): ViewModelInterface<FieldMappingType, IncomingFieldsType, PkFieldType, PkType>;

    /**
     * The bound fields for this ViewModel. These will match the `fields` passed in to `ViewModel` with the
     * following differences:
     * - If a primary key is created for you this will exist here
     * - All fields are bound to the created class. This means you can access the `ViewModel` class from the field on
     *   the `parent` property, eg. `User.fields.email.parent === User` will be true.
     * - All fields have the `name` property set to match the key in `fields`
     * - All fields have `label` filled out if not explicitly set (eg. if name was `emailAddress` label will be created
     *   as `Email Address`)
     */
    readonly fields: FieldMappingType;

    /**
     * The singular label for this ViewModel. This should be set by extending the created class.
     *
     * ```js
     * class User extends ViewModel(fields) {
     *     static label = 'User';
     * }
     * ```
     */
    readonly label: string;

    /**
     * The label used to describe an indeterminate number of this ViewModel. This should be set by extending the created class.
     *
     * ```js
     * class User extends ViewModel(fields) {
     *     static labelPlural = 'Users';
     * }
     * ```
     */
    readonly labelPlural: string;

    /**
     * Name of the primary key field for this this ViewModel (or fields for compound keys)
     *
     * If `options.pkFieldName` is not specified a field will be created from `options.getImplicitPk`
     * if provided otherwise a default field with name 'id' will be created.
     */
    readonly pkFieldName: PkFieldType;

    /**
     * Shortcut to get pkFieldName as an array always, even for non-compound keys
     */
    readonly pkFieldNames: string[];

    readonly cache: ViewModelCache<
        ViewModelInterface<FieldMappingType, FieldMappingType, PkFieldType, PkType>
    >;

    /**
     * Create a new class that extends this class with the additional specified fields. To remove a
     * field that exists on the base class set it's value to null.
     *
     * @param newFields Map of field name to a `Field` instance (to add the field) or `null` (to remove the field)
     * @param newOptions Provide optional overrides for the options that the original class was created with
     * @return A new ViewModel class with fields modified according to `newFields`.
     */
    augment<P extends FieldsMappingOrNull>(
        newFields: P,
        newOptions?: ViewModelOptions<FieldMappingType & P>
    ): ViewModelConstructor<FieldMappingType & P, PkFieldType, PkType>;
}

type GetImplicitPkFieldCompound<T extends FieldsMapping> = (
    model: ViewModelConstructor<T>,
    fields: T
) => [string[], Field<any>[]];

type GetImplicitPkFieldSingle<T extends FieldsMapping> = (
    model: ViewModelConstructor<T>,
    fields: T
) => [string, Field<any>];

type GetImplicitPkField<T extends FieldsMapping> =
    | GetImplicitPkFieldCompound<T>
    | GetImplicitPkFieldSingle<T>;

interface ViewModelOptions<T extends FieldsMapping> {
    baseClass?: ViewModelConstructor<FieldsMapping>;
    pkFieldName?: null | undefined | string | string[];
    getImplicitPkField?: null | undefined | GetImplicitPkField<T>;
}

interface ViewModelOptionsPkFieldNameSingle<T extends FieldsMapping> extends ViewModelOptions<T> {
    pkFieldName: string;
}
interface ViewModelOptionsPkFieldNameCompound<T extends FieldsMapping> extends ViewModelOptions<T> {
    pkFieldName: string[];
}

interface ViewModelOptionsGetImplicitPkFieldSingle<T extends FieldsMapping>
    extends ViewModelOptions<T> {
    getImplicitPkField: GetImplicitPkFieldSingle<T>;
}

interface ViewModelOptionsGetImplicitPkFieldCompound<T extends FieldsMapping>
    extends ViewModelOptions<T> {
    getImplicitPkField: GetImplicitPkFieldCompound<T>;
}

/**
 * Defines a getter on `base` for `name` that throws `errorMessage`. If this property isn't
 * overridden then when it's accessed the error will be thrown (eg. for static properties
 * like `label` & `labelPlural`.
 */
function defineRequiredGetter(base: {}, name: string, errorMessage: string): void {
    Object.defineProperty(base, name, {
        configurable: true,
        get(): string {
            throw new Error(errorMessage);
        },
        // Setter only appears to be required in node when running tests - in all browser engines
        // I've tried defining the static property on the class overrides the property and does not
        // call the setter but this probably also depends on the build setup.
        set(label): void {
            Object.defineProperty(base, name, {
                configurable: true,
                writable: true,
                value: label,
            });
        },
    });
}

/**
 * Generate a label for a field based on its name
 */
function getImplicitFieldLabel(name: string): string {
    // Inner startCase splits into words and lowercases it:
    // EMAIL_ADDRESS => email address
    // Outer one converts first letter of each word:
    // email address => Email Address
    return startCase(startCase(name).toLowerCase());
}

/**
 * Add getters for fields along with some traps for bad usage
 * - If attempts to set a field throw an error in dev or log warning otherwise
 * - If attempts to get a field that does exist but wasn't passed in `data` then
 *   throw an error in dev or log a warning otherwise.
 */
function buildFieldGetterSetter(fieldName: string): { set(value: any): any; get: () => any } {
    return {
        set(): void {
            const msg = `${fieldName} is read only`;
            if (isDev()) {
                throw new Error(msg);
            } else {
                console.warn(msg);
            }
        },
        get(): any {
            if (!this._assignedFields.includes(fieldName)) {
                const msg = `'${fieldName}' accessed on ${
                    this._model.name
                } but was not instantiated with it. Available fields are: ${this._assignedFields.join(
                    ', '
                )}`;
                if (isDev()) {
                    throw new Error(msg);
                } else {
                    console.warn(msg);
                }
            } else {
                return this._data[fieldName];
            }
        },
    };
}

function bindFields<T extends FieldsMapping>(fields: T, bindTo: ViewModelConstructor<T>): T {
    const newFields = Object.entries(fields).reduce((acc, [fieldName, field]) => {
        acc[fieldName] = field.clone();
        acc[fieldName].parent = bindTo;
        acc[fieldName].name = fieldName;
        if (acc[fieldName].label === undefined) {
            acc[fieldName].label = getImplicitFieldLabel(fieldName);
        }
        return acc;
    }, {});
    return freezeObject(newFields) as T;
}

function defaultGetImplicitPkField<T extends FieldsMapping>(
    model: ViewModelConstructor<T>,
    fields: T
): ['id', NumberField] {
    return ['id', fields.id || new NumberField()];
}

const IS_VIEW_MODEL = Symbol.for('@prestojs/IS_VIEW_MODEL');

export function isViewModelInstance(view: any): view is ViewModelInterface<any, any> {
    return !!(view && view.constructor && view.constructor[IS_VIEW_MODEL]);
}

export function isViewModelClass(view: any): view is ViewModelConstructor<any> {
    return !!(view && view[IS_VIEW_MODEL]);
}

const reservedFieldNames = ['toJS', 'clone', 'isEqual'];

function checkReservedFieldNames(fields): void {
    reservedFieldNames.forEach(fieldName => {
        if (fields[fieldName]) {
            throw new Error(`${fieldName} is reserved and cannot be used as a field name`);
        }
    });
}
// Using very strongly typed overloads instead a single type with optional properties so we can more accurately type
// the primary key and fields (specifically for default case we can add the implicit 'id' field that will be created)
export default function ViewModelFactory<T extends FieldsMapping>(
    fields: T,
    options: ViewModelOptionsPkFieldNameSingle<T>
): ViewModelConstructor<T, string, SinglePrimaryKey>;
export default function ViewModelFactory<T extends FieldsMapping>(
    fields: T,
    options: ViewModelOptionsPkFieldNameCompound<T>
): ViewModelConstructor<T, string[], CompoundPrimaryKey>;
export default function ViewModelFactory<T extends FieldsMapping>(
    fields: T,
    options: ViewModelOptionsGetImplicitPkFieldSingle<T>
): ViewModelConstructor<T, string, SinglePrimaryKey>;
export default function ViewModelFactory<T extends FieldsMapping>(
    fields: T,
    options: ViewModelOptionsGetImplicitPkFieldCompound<T>
): ViewModelConstructor<T, string[], CompoundPrimaryKey>;
export default function ViewModelFactory<T extends FieldsMapping>(
    fields: T,
    options?: ViewModelOptions<T>
): ViewModelConstructor<{ id: NumberField } & T, 'id', string | number>;
export default function ViewModelFactory<T extends FieldsMapping>(
    fields: T,
    options: ViewModelOptions<T> = {}
): ViewModelConstructor<any, any> {
    if (options.pkFieldName && options.getImplicitPkField) {
        throw new Error("Only one of 'pkFieldName' and 'getImplicitPkField' should be provided");
    }
    checkReservedFieldNames(fields);
    // If pkFieldName isn't specified it will be created automatically as 'id'
    // Otherwise the field name will be included in `fields` and we don't need to modify the type.
    // getImplicitPkField will create a new field if specified but we can't type it so we ignore it
    // (nested ternary is unavoidable to use the typescripts `extends` behaviour)
    type FinalFields = typeof options.pkFieldName extends string | string[]
        ? T
        : typeof options.getImplicitPkField extends Function
        ? T
        : { id: NumberField } & T;
    type PkFieldType = typeof options.pkFieldName extends string
        ? string
        : typeof options.pkFieldName extends string[]
        ? string[]
        : typeof options.getImplicitPkField extends GetImplicitPkFieldCompound<T>
        ? string[]
        : typeof options.getImplicitPkField extends GetImplicitPkFieldSingle<T>
        ? string
        : 'id';

    type PkValueType = typeof options.pkFieldName extends string
        ? SinglePrimaryKey
        : typeof options.pkFieldName extends string[]
        ? CompoundPrimaryKey
        : typeof options.getImplicitPkField extends GetImplicitPkFieldCompound<T>
        ? CompoundPrimaryKey
        : typeof options.getImplicitPkField extends GetImplicitPkFieldSingle<T>
        ? SinglePrimaryKey
        : SinglePrimaryKey;

    // This is the constructor function for the created class. We aren't using an ES6 class
    // here as I couldn't get types to work nicely (possibly ignorance on my behalf - can look
    // to refactor down the track)
    function _Base<T extends FinalFields = FinalFields>(
        data: FieldDataMappingRaw<T>
    ): FieldDataMapping<T> {
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
            errors.push(`Missing value(s) for primary key(s) '${missing.join("', '")}'`);
        }

        if (errors.length) {
            throw new Error(errors.join(', '));
        }

        const assignedData: Record<string, any> = {};
        const assignedFields: string[] = [];
        const fields = this._model.fields;
        for (const [key, value] of Object.entries(data)) {
            const field = fields[key];
            if (field) {
                assignedData[key] = field.normalize(value);
                assignedFields.push(key);
            } else {
                // TODO: Should extra keys in data be a warning or ignored?
                console.warn(
                    `Received value for key ${key}. No such field exists on ${this._model.name}`
                );
            }
        }

        this._assignedFields = assignedFields;
        this._assignedFields.sort();
        this._data = freezeObject(assignedData);

        return this;
    }

    if (options.baseClass) {
        // TODO: Not entirely sure what's correct here. setPrototypeOf made it such that static properties
        // from base class were also available. Object.create made instanceof work properly.
        Object.setPrototypeOf(_Base, options.baseClass);
        _Base.prototype = Object.create(options.baseClass.prototype);
    }

    _Base[IS_VIEW_MODEL] = true;

    // Extend prototype to include required static properties/methods
    const properties = {
        _model: {
            get(): typeof _Base {
                return Object.getPrototypeOf(this).constructor;
            },
        },
        _pk: {
            get(): PrimaryKey {
                const { pkFieldName } = this._model;
                if (Array.isArray(pkFieldName)) {
                    return pkFieldName.reduce((acc, fieldName) => {
                        acc[fieldName] = this[fieldName];
                        return acc;
                    }, {});
                }
                return this[pkFieldName];
            },
        },
        toJS: {
            value(): FieldDataMapping<FinalFields> {
                const data = {};
                for (const [fieldName, value] of Object.entries(this._data)) {
                    data[fieldName] = this._model.fields[fieldName].toJS(value);
                }
                return data as FieldDataMapping<FinalFields>;
            },
        },
        isEqual: {
            value(
                record: ViewModelInterface<FieldsMapping, { [fieldName: string]: any }>
            ): boolean {
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
            },
        },
        clone: {
            value(
                fieldNames?: string[]
            ): ViewModelInterface<FinalFields, FinalFields, PkFieldType, PkValueType> {
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
                    fieldNames = this._assignedFields as string[];
                }

                const data = {};
                for (const fieldName of fieldNames) {
                    // TODO: Unclear to me if this needs to call a method on the Field on not. Revisit this.
                    data[fieldName] = this[fieldName];
                }

                // Always clone primary keys
                const pkFieldNames = this._model.pkFieldNames;
                pkFieldNames.forEach(name => (data[name] = this[name]));

                return new this._model(data);
            },
        },
    };
    // Build getter/setter for all known fields. Note that we need to do this in _bindFields below as well in the
    // case that primary key fields are created.
    Object.keys(fields).forEach(fieldName => {
        properties[fieldName] = buildFieldGetterSetter(fieldName);
    });
    Object.defineProperties(_Base.prototype, properties);

    // Store bound fields and primary key name for all models in the hierarchy
    const boundFields: Map<
        ViewModelConstructor<FinalFields>,
        [FinalFields, string | string[]]
    > = new Map();

    /**
     * Helper to bind fields to the specific ViewModel class. This happens once per class and happens
     * for every class in a hierarchy (eg. if B extends A they may have the same fields but there is
     * a copy for A & B that are bound to the correct parent class).
     *
     * Binding just means the `name` of a field has been set and the `parent` link is set to the owning
     * class.
     *
     * The return value is a 2-tuple of the field mapping object and the primary key name(s).
     */
    function _bindFields(modelClass: ViewModelConstructor<T>): [FinalFields, string | string[]] {
        let f = boundFields.get(modelClass as ViewModelConstructor<FinalFields>);
        if (!f) {
            const toBind = { ...fields };
            let { getImplicitPkField } = options;
            let finalPkFieldName;

            // If a primary key wasn't explicitly provided we need to create one
            if (!options.pkFieldName || getImplicitPkField) {
                if (!getImplicitPkField) {
                    getImplicitPkField = defaultGetImplicitPkField;
                }
                const [pkFieldName, pkField] = getImplicitPkField(modelClass, fields);
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
                    Object.keys(extraFields).map(fieldName => {
                        Object.defineProperty(
                            modelClass.prototype,
                            fieldName,
                            buildFieldGetterSetter(fieldName)
                        );
                    });
                    checkReservedFieldNames(extraFields);
                    Object.assign(toBind, extraFields);
                }
                finalPkFieldName = pkFieldName;
            } else {
                finalPkFieldName = options.pkFieldName;
            }
            const pkFieldNames = Array.isArray(finalPkFieldName)
                ? finalPkFieldName
                : [finalPkFieldName];
            const missingFields = pkFieldNames.filter(fieldName => !toBind[fieldName]);
            if (missingFields.length > 0) {
                throw new Error(
                    `${modelClass.name} has 'pkFieldName' set to '${pkFieldNames.join(
                        ', '
                    )}' but the field(s) '${missingFields.join(
                        ', '
                    )}' does not exist in 'fields'. Either add the missing field(s) or update 'pkFieldName' to reflect the actual primary key field.`
                );
            }
            f = [
                bindFields<FinalFields>(
                    toBind as FinalFields,
                    modelClass as ViewModelConstructor<FinalFields>
                ),
                finalPkFieldName,
            ];
            boundFields.set(modelClass as ViewModelConstructor<FinalFields>, f);
        }
        return f;
    }

    if (!options.baseClass) {
        defineRequiredGetter(
            _Base,
            'label',
            "You must define a static property 'label' on your class"
        );
        defineRequiredGetter(
            _Base,
            'labelPlural',
            "You must define a static property 'labelPlural' on your class"
        );
    }

    Object.defineProperties(_Base, {
        __cache: {
            value: new Map<
                ViewModelConstructor<FinalFields>,
                ViewModelCache<ViewModelInterface<FinalFields, FinalFields>>
            >(),
        },
        pkFieldNames: {
            /**
             * Shortcut to get pkFieldName as an array always, even for non-compound keys
             */
            get(): string[] {
                const pkFieldNames = this.pkFieldName;
                if (!Array.isArray(pkFieldNames)) {
                    return [pkFieldNames];
                }
                return pkFieldNames;
            },
        },
        pkFieldName: {
            get(): string | string[] {
                // We need to ensure fields are bound in case getImplicitPkField creates
                // a dynamic field name
                return _bindFields(this)[1];
            },
        },
        fields: {
            get(): FinalFields {
                return _bindFields(this)[0];
            },
        },
        cache: {
            get(): ViewModelCache<ViewModelInterface<FinalFields, FinalFields>> {
                // This is a getter so we can instantiate cache on each ViewModel independently without
                // having to have the descendant create the cache
                let cache = this.__cache.get(this);
                if (!cache) {
                    cache = new ViewModelCache(this);
                    this.__cache.set(this, cache);
                }
                return cache;
            },
            set(value: ViewModelCache<ViewModelInterface<FinalFields, FinalFields>>): void {
                if (!(value instanceof ViewModelCache)) {
                    throw new Error(
                        `cache class must extend ViewModelCache. See ${this.name}.cache`
                    );
                }
                this.__cache.set(this, value);
            },
        },
        toString: {
            value(): string {
                return this.name;
            },
        },
    });

    // I can't work out proper explicit type, wasn't what I expected (ViewModelConstructor<O & P>) but it
    // infers it fine.
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function augment<P extends FieldsMappingOrNull>(
        newFields: P,
        newOptions: ViewModelOptions<T & P> = {}
    ) {
        const f: FieldsMapping = {
            ...fields,
        };
        for (const [fieldName, field] of Object.entries(newFields)) {
            if (field) {
                f[fieldName] = field;
            } else {
                delete f[fieldName];
            }
        }
        return ViewModelFactory(f as T & P, {
            ...(options as ViewModelOptions<T & P>),
            ...newOptions,
            baseClass: this,
        });
    }

    _Base.augment = augment;
    return (_Base as Function) as ViewModelConstructor<FinalFields, PkFieldType, PkValueType>;
}
