import intersectionBy from 'lodash/intersectionBy';
import isEqual from 'lodash/isEqual';
import startCase from 'lodash/startCase';
import Field, { RecordBoundField } from './fields/Field';
import NumberField from './fields/NumberField';

import { BaseRelatedViewModelField } from './fields/RelatedViewModelField';
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
 * class User extends viewModelFactory(fields, options) {
 *     // Optional; default cache is usually sufficient
 *     static cache = new MyCustomCache();
 *
 *     // Used to describe a single user
 *     static label = 'User';
 *     // User to describe an indeterminate number of users
 *     static labelPlural = 'Users';
 * }
 * ```
 *
 * @type-name ViewModel
 */
export type ViewModelInterface<
    FieldMappingType extends FieldsMapping,
    // The field names that actually have data
    FieldNames extends keyof FieldMappingType,
    PkFieldType extends string | string[] = string | string[],
    PkType extends PrimaryKey = PrimaryKey
> = {
    readonly [K in FieldNames]: FieldMappingType[K]['__fieldValueType'];
} & {
    /** @private */
    __instanceFieldMappingType: {
        [k in FieldNames]: FieldMappingType[k];
    };
    /**
     * Get the actual ViewModel class for this instance
     */
    _model: ViewModelConstructor<FieldMappingType, PkFieldType, PkType>;
    /**
     * Return the data for this record as an object
     */
    toJS(): FieldDataMapping<FieldMappingType>;
    /**
     * Compares two records to see if they are equivalent.
     *
     * - If the ViewModel is different then the records are always considered different
     * - If the records were initialised with a different set of fields then they are
     *   considered different even if the common fields are the same and other fields are
     *   all null
     */
    isEqual(record: ViewModelInterface<any, any> | null): boolean;

    /**
     * Clone this record, optionally with only a subset of the fields
     */
    clone<CloneFieldNames extends keyof FieldMappingType>(
        fieldNames?: readonly CloneFieldNames[]
    ): ViewModelInterface<FieldMappingType, CloneFieldNames, PkFieldType, PkType>;
    clone(fieldNames?: FieldPath[]): ViewModelInterface<FieldMappingType, any, PkFieldType, PkType>;

    /**
     * Access record bound fields. A record bound field is a normal field with it's `value` property
     * set to the corresponding value for that field on the record. This is useful as a shortcut
     * to get both the field and it's value.
     *
     * ```js
     * class User extends viewModelFactory({ username: CharField() }) {}
     *
     * const admin = new User({ id: 1, username: 'admin' });
     *
     * // true
     * admin._f.username instanceof CharField();
     * admin._f.username.value === 'admin'
     * ```
     *
     * @type-name Object
     */
    readonly _f: {
        readonly [K in FieldNames]: RecordBoundField<
            FieldMappingType[K]['__fieldValueType'],
            FieldMappingType[K]['__parsableValueType']
        >;
    };

    /**
     * Returns the primary key value(s) for this instance. This is to conform to the
     * [Identifiable](doc:Identifiable) interface.
     */
    readonly _key: PkType;

    /**
     * The assigned data for this record. You usually don't need to access this directly; values
     * for a field can be retrieved from the record directly using the field name
     *
     * @type-name Object
     */
    readonly _data: {
        [k in FieldNames]: FieldMappingType[k]['__fieldValueType'];
    };

    /**
     * List of field names with data available on this instance.
     *
     * @type-name string[]
     */
    readonly _assignedFields: FieldNames[];
};

/**
 * @type-name ViewModel Class
 */
export interface ViewModelConstructor<
    FieldMappingType extends FieldsMapping,
    PkFieldType extends string | string[] = string | string[],
    PkType extends PrimaryKey = PrimaryKey
> {
    /** @private */
    __pkFieldType: PkFieldType;
    /** @private */
    __pkType: PkType;
    new <FieldNames extends keyof FieldMappingType>(
        data: { [K in FieldNames]: FieldMappingType[K]['__parsableValueType'] }
    ): ViewModelInterface<FieldMappingType, FieldNames, PkFieldType, PkType>;

    // This is necessary for when the base class is extended so that it still conforms to
    // ViewModelConstructor - without this there will be no matching type (for some reason?)
    // due to `IncomingData`. It's important to fix this otherwise anywhere that accepts
    // ViewModelConstructor will fail to accept anything that extends a class created with
    // viewModelFactory by default.
    //
    // I don't fully understand why. This means that for a class
    // that extends the base class you won't get proper types for partial records. For example:
    // const A = viewModelFactory({
    //     name: new Field<string>(),
    //     age: new Field<number>(),
    // });
    //
    // const a1 = new A({ name: 'test' });
    // // Error: Property 'age' does not exist on type ...
    // a1.age;
    // class B extends A {}
    // const a2 = new B({ name: 'test' });
    // // No error, all known fields are valid:
    // a2.age
    //
    // You can fix it with:
    // const C: ViewModelConstructor<any> = B;
    // const a3 = new C({ name: 'test' });
    // Error: Property 'age' does not exist on type ...
    // a3.age
    new (data: FieldDataMappingRaw<FieldMappingType>): ViewModelInterface<
        FieldMappingType,
        keyof FieldMappingType,
        PkFieldType,
        PkType
    >;

    /**
     * The bound fields for this ViewModel. These will match the `fields` passed in to `ViewModel` with the
     * following differences:
     * - If a primary key is created for you this will exist here
     * - All fields are bound to the created class. This means you can access the `ViewModel` class from the field on
     *   the `model` property, eg. `User.fields.email.model === User` will be true.
     * - All fields have the `name` property set to match the key in `fields`
     * - All fields have `label` filled out if not explicitly set (eg. if name was `emailAddress` label will be created
     *   as `Email Address`)
     *
     * See also [getField](doc:viewModelFactory#method-getField) for getting a nested field using array notation.
     */
    readonly fields: FieldMappingType;

    /**
     * The singular label for this ViewModel. This should be set by extending the created class.
     *
     * ```js
     * class User extends viewModelFactory(fields) {
     *     static label = 'User';
     * }
     * ```
     */
    readonly label: string;

    /**
     * The label used to describe an indeterminate number of this ViewModel. This should be set by extending the created class.
     *
     * ```js
     * class User extends viewModelFactory(fields) {
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

    /**
     * Shortcut to get the names of all fields excluding primary keys.
     *
     * If you want all fields including primary key do:
     *
     * ```js
     * model.fieldNames.concat(model.pkFieldNames);
     * ```
     */
    readonly fieldNames: string[];

    /**
     * Get a field from this model or a related model
     *
     * Accepts either a string for a field on this record or array notation for traversing [RelatedViewModelField](doc:RelatedViewModelField)
     * fields:
     *
     * ```jsx
     * Subscription.getField(['user', 'group', 'owner'])
     * ```
     * @param fieldName Either a string or an array of strings where the last element is the final field name to return
     * and each other element is a [RelatedViewModelField](doc:RelatedViewModelField) on a ViewModel.
     */
    getField(fieldName: FieldPath): Field<any>;

    /**
     * The cache instance for this ViewModel. A default instance of [ViewModelCache](doc:ViewModelCache)
     * is created when first accessed or you can explicitly assign a cache:
     *
     * ```js
     * class User extends viewModelFactory(fields) {
     *     static cache = new MyCustomCache(User);
     * }
     * ```
     */
    cache: ViewModelCache<this>;

    /**
     * Create a new class that extends this class with the additional specified fields. To remove a
     * field that exists on the base class set it's value to null.
     *
     * ```js
     * class Base extends viewModelFactory({
     *   id: new NumberField({
     *     label: 'Id',
     *   }),
     *   firstName: new CharField({
     *     label: 'First Name',
     *   }),
     *   lastName: new CharField({
     *     label: 'Last Name',
     *   }),
     *   email: new EmailField({
     *     label: 'Email',
     *   }),
     * }) {
     *   static label = 'User';
     *   static labelPlural = 'Users';
     * }
     *
     * class User extends BaseUser.augment({
     *   region: new IntegerField({
     *     label: 'region',
     *     required: true,
     *     helpText: 'Region Coding of the user',
     *     choices: [
     *       [1, 'Oceania'],
     *       [2, 'Asia'],
     *       [3, 'Africa'],
     *       [4, 'America'],
     *       [5, 'Europe'],
     *       [6, 'Antarctica'],
     *       [7, 'Atlantis'],
     *     ],
     *   }),
     *   photo: new ImageField({
     *     helpText: 'Will be cropped to 400x400',
     *   }),
     * }) {
     * }
     *
     * // true
     * User instanceof BaseUser
     * // true
     * User.label === 'User'
     *
     * // ['firstName, 'lastName', 'email', 'region', 'photo]
     * User.fieldNames
     * ```
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

/**
 * @expand-properties
 */
interface ViewModelOptions<T extends FieldsMapping> {
    /**
     * Optional base class to extend. When calling `augment` this is set the augmented class.
     *
     * @type-name Class
     */
    baseClass?: ViewModelConstructor<T>;
    /**
     * Primary key name(s) to use. There should be field(s) with the corresponding name in the
     * provided `fields`.
     *
     * Only `pkFieldName` or `getImplicitPkField` should be provided. If neither are provided then
     * a field called `id` will be used and created if not provided in `fields`.
     *
     * @type-name string|string[]
     */
    pkFieldName?: null | undefined | string | string[];
    /**
     * A function to generate field(s) to use for the primary key. It is passed the model class and
     * the fields on the model. It should return an array of size 2 - first element should be the
     * field name and the second an instance of `Field`.
     *
     * @type-name Function
     */
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
        acc[fieldName].model = bindTo;
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

// TODO: Refactor so we use a real base class and can use instanceof directly instead, see https://github.com/prestojs/prestojs/issues/41
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

export type FieldPath = string | string[];

/**
 * Flatten a nested path to a single level with dot notation
 *
 * eg.
 * ```
 * flattenFieldPath([
 *   'id',
 *   ['user', ['group', 'id']],
 *   ['user', 'groupId'],
 *   ['user', 'id'],
 *   'userId'
 * ])
 * // ['id', 'user.group.id', 'user.groupId', 'user.id', 'userId']
 * ```
 */
export function flattenFieldPath(fieldPath: FieldPath[] | FieldPath, separator = '.'): string[] {
    if (typeof fieldPath === 'string') {
        return [fieldPath];
    }
    const flattenedPath: string[] = [];
    for (const path of fieldPath) {
        if (typeof path === 'string') {
            flattenedPath.push(path);
        } else {
            flattenedPath.push(path.join(separator));
        }
    }
    return flattenedPath;
}

/**
 * Get assigned field paths for the record.
 *
 * See test cases for example of what this looks like
 */
export function getAssignedFieldsDeep(record: ViewModelInterface<any, any>): FieldPath[] {
    const fieldNames: FieldPath[] = [];
    for (const fieldName of record._assignedFields as string[]) {
        const data = record[fieldName];
        const field = record._model.fields[fieldName];
        if (field instanceof BaseRelatedViewModelField && data) {
            if (field.many) {
                if (data.length === 0) {
                    fieldNames.push([fieldName]);
                } else {
                    // If we have many records we can only take the common set of fields
                    // Failing to do this will cause various issues with caching.
                    const paths = intersectionBy(...data.map(getAssignedFieldsDeep), p =>
                        flattenFieldPath(p).join('|')
                    );
                    for (const path of paths) {
                        fieldNames.push([fieldName, ...(Array.isArray(path) ? path : [path])]);
                    }
                }
            } else {
                for (const path of getAssignedFieldsDeep(data)) {
                    fieldNames.push([fieldName, ...(Array.isArray(path) ? path : [path])]);
                }
            }
        } else {
            fieldNames.push(fieldName);
        }
    }
    return fieldNames;
}

/**
 * For the given field `fieldName` on View Model `model` expand any RelatedViewModelField's to
 * it's set of fields.
 *
 * eg. If `User` had a `RelatedViewModelField` on `group` to a model with a 'name' and 'ownerId' field then:
 *
 * ```js
 * expandField(User, 'group')
 * // [ ['group', 'name'], ['group', 'ownerId' ]
 * ```
 *
 * For non relation fields the passed fieldName is returned as an array:
 *
 * ```
 * expandField(User, 'name')
 * // ['name']
 * ```
 *
 * @param model
 * @param fieldName
 */
function expandField(model: ViewModelConstructor<any>, fieldName: string): FieldPath[] {
    const field = model.fields[fieldName];
    if (field instanceof BaseRelatedViewModelField) {
        return field.to.fieldNames
            .filter(
                subFieldName =>
                    !(field.to.fields[subFieldName] instanceof BaseRelatedViewModelField)
            )
            .map(subFieldName => [fieldName, subFieldName]);
    }
    return [fieldName];
}

/**
 * Thrown when attempting to access a field that does not exist on a ViewModel
 */
export class InvalidFieldError extends Error {}

/**
 * For the given field paths expand any relation fields to include the nested non-relation fields
 *
 * ```
 * [['user', 'group']]
 * ```
 *
 * becomes
 *
 * ```
 * [
 *   ['user', 'group', 'name'],
 *   ['user', 'group', 'ownerId'],
 * ]
 * ```
 *
 * Where 'user' is a foreign key to a model that has a foreign key on field 'group' with two fields.
 *
 * We exclude [RelatedViewModelField](doc:RelatedViewModelField)'s to avoid circular dependencies. In the
 * example above this means the `owner` field is excluded but the source field `ownerId` is still included.
 *
 * @param model
 * @param paths
 */
export function expandRelationFieldPaths(
    model: ViewModelConstructor<any>,
    paths: FieldPath[]
): FieldPath[] {
    const expanded: FieldPath[] = [];
    const fieldsAdded = new Set<string>();
    for (const path of paths) {
        if (typeof path === 'string') {
            const field = model.fields[path];
            if (field instanceof BaseRelatedViewModelField) {
                fieldsAdded.add(field.sourceFieldName);
                expanded.push(field.sourceFieldName);
            }
            for (const p of expandField(model, path)) {
                const dottedP = Array.isArray(p) ? p.join('.') : p;
                if (!fieldsAdded.has(dottedP)) {
                    expanded.push(p);
                    fieldsAdded.add(dottedP);
                }
            }
        } else {
            let currentModel = model;
            let dottedPath = '';
            for (let i = 0; i < path.length; i++) {
                const fieldName = path[i];
                if (!dottedPath) {
                    dottedPath = fieldName;
                } else {
                    dottedPath = `${dottedPath}.${fieldName}`;
                }
                const field = currentModel.fields[fieldName];
                if (!field) {
                    throw new InvalidFieldError(
                        `Invalid field ${fieldName} on model ${currentModel}`
                    );
                }
                const isRelation = field instanceof BaseRelatedViewModelField;
                const isLast = i === path.length - 1;
                if (!isLast && !isRelation) {
                    throw new Error(
                        `Nested paths are only valid for classes that extend BaseRelatedViewModelField. '${fieldName}' is a ${field}.`
                    );
                }
                if (isRelation) {
                    const sourcePath =
                        i === 0
                            ? field.sourceFieldName
                            : [...path.slice(0, i), field.sourceFieldName];
                    const sourceDottedPath = Array.isArray(sourcePath)
                        ? sourcePath.join('.')
                        : sourcePath;
                    if (!fieldsAdded.has(sourceDottedPath)) {
                        fieldsAdded.add(sourceDottedPath);
                        expanded.push(sourcePath);
                    }
                    if (isLast) {
                        for (const p of expandField(currentModel, fieldName).map(subPath => [
                            ...path.slice(0, i),
                            ...subPath,
                        ])) {
                            const dottedP = p.join('.');
                            if (!fieldsAdded.has(dottedP)) {
                                expanded.push(p);
                                fieldsAdded.add(dottedP);
                            }
                        }
                    }
                    currentModel = field.to;
                } else if (isLast && !fieldsAdded.has(dottedPath)) {
                    fieldsAdded.add(dottedPath);
                    expanded.push(path);
                }
            }
        }
    }
    return expanded;
}

/**
 * Thrown when cloning a record and requested fields cannot be found
 *
 * Gives details on missing fields and will indicate if related records are missing entirely vs
 * just some fields
 */
export class MissingFieldsError extends Error {
    missingFieldNames: string[];
    missingRelations: [string, string[]][];
    assignedFields: string[];
    constructor(
        record: ViewModelInterface<any, any>,
        assignedFields: string[],
        requestedFieldNames: FieldPath[],
        missingFieldNames: string[],
        missingRelations: [string, string[]][]
    ) {
        assignedFields = [...assignedFields];
        assignedFields.sort();
        missingFieldNames.sort();
        let err = `Can't clone ${record._model.name} with fields ${flattenFieldPath(
            requestedFieldNames
        ).join(', ')} as only these fields are set: ${assignedFields.join(
            ', '
        )}.\n Missing fields: ${missingFieldNames.join(', ')}`;
        if (missingRelations.length > 0) {
            err +=
                '\nThe following relations had no data so the associated fields could not be retrieved:\n';
            err += missingRelations.map(
                ([relationName, relationFieldNames]) =>
                    ` The relation '${relationName}' for fields '${relationFieldNames.join(', ')}'`
            );
        }
        super(err);
        this.missingFieldNames = missingFieldNames;
        this.missingRelations = missingRelations;
        this.assignedFields = assignedFields;
    }
}

// Using very strongly typed overloads instead a single type with optional properties so we can more accurately type
// the primary key and fields (specifically for default case we can add the implicit 'id' field that will be created)
export default function viewModelFactory<T extends FieldsMapping>(
    fields: T,
    options: ViewModelOptionsPkFieldNameSingle<T>
): ViewModelConstructor<T, string, SinglePrimaryKey>;
export default function viewModelFactory<T extends FieldsMapping>(
    fields: T,
    options: ViewModelOptionsPkFieldNameCompound<T>
): ViewModelConstructor<T, string[], CompoundPrimaryKey>;
export default function viewModelFactory<T extends FieldsMapping>(
    fields: T,
    options: ViewModelOptionsGetImplicitPkFieldSingle<T>
): ViewModelConstructor<T, string, SinglePrimaryKey>;
export default function viewModelFactory<T extends FieldsMapping>(
    fields: T,
    options: ViewModelOptionsGetImplicitPkFieldCompound<T>
): ViewModelConstructor<T, string[], CompoundPrimaryKey>;
export default function viewModelFactory<T extends FieldsMapping>(
    fields: T,
    options?: ViewModelOptions<T>
): ViewModelConstructor<{ id: NumberField } & T, 'id', string | number>;
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
 *     // Only one of pkFieldName or getImplicitPkField can be defined.
 *     // If neither are provided a default field called 'id' will be created.
 *     pkFieldName: 'userId',
 *     // Multiple names can be specified for compound keys
 *     pkFieldName: ['organisationId', 'departmentId']
 *     // You can also specify a function to create the primary key
 *     getImplicitPkField(model, fields) {
 *          if ('EntityId' in fields) {
 *              return ['EntityId', fields.EntityId];
 *          }
 *          // Generate a name base on model, eg. `userId`
 *          const name = model.name[0].toLowerCase() + model.name.slice(1);
 *          return [`${name}Id`, new NumberField()];
 *      },
 *      // Optionally can specify a baseClass for this model. When using `augment`
 *      // this is automatically set to the class being augmented.
 *      baseClass: BaseViewModel,
 * };
 * class User extends viewModelFactory(fields, options) {
 *     // Optional; default cache is usually sufficient
 *     static cache = new MyCustomCache();
 *
 *     // Used to describe a single user
 *     static label = 'User';
 *     // User to describe an indeterminate number of users
 *     static labelPlural = 'Users';
 * }
 * ```
 *
 * @param fields A map of field name to an instance of `Field`
 */
export default function viewModelFactory<T extends FieldsMapping>(
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
    function _Base<IncomingData extends FieldDataMappingRaw<FinalFields>>(
        data: IncomingData
    ): {
        [k in Extract<keyof IncomingData, keyof FinalFields>]: FinalFields[k]['__fieldValueType'];
    } {
        if (!data) {
            throw new Error('data must be specified');
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

        const assignedData: Record<string, any> = {};
        const assignedFields: string[] = [];
        const fields = this._model.fields;
        for (const [key, value] of Object.entries(data)) {
            const field = fields[key];
            if (field) {
                assignedData[key] = field.normalize(value);
                if (field instanceof BaseRelatedViewModelField) {
                    // TODO: Make doing this part of interface rather than special case?
                    const pkOrPks = field.many
                        ? assignedData[key]?.map(r => r._key)
                        : assignedData[key]?._key;
                    const hasValue = Array.isArray(pkOrPks)
                        ? pkOrPks.length > 0 && data[field.sourceFieldName]?.length > 0
                        : pkOrPks != null && data[field.sourceFieldName];
                    if (hasValue && !isEqual(data[field.sourceFieldName], pkOrPks)) {
                        const { name, sourceFieldName } = field;
                        const pk = Array.isArray(pkOrPks) ? pkOrPks.join(', ') : pkOrPks;
                        console.warn(
                            `Related field ${name} was created from nested object that had a different id to the source field name ${sourceFieldName}: ${data[sourceFieldName]} !== ${pk}. ${pk} has been used for both.`
                        );
                    }
                    // Key could be set but the value is null. In that case we want the sourceFieldName to be set to
                    // null as well.
                    if (key in assignedData) {
                        assignedData[field.sourceFieldName] = pkOrPks ?? null;
                        if (!data[field.sourceFieldName]) {
                            assignedFields.push(field.sourceFieldName);
                        }
                    }
                }
                assignedFields.push(key);
            } else {
                // TODO: Should extra keys in data be a warning or ignored?
                console.warn(
                    `Received value for key ${key}. No such field exists on ${this._model.name}`
                );
            }
        }
        // Sort fields so consistent order; primarily as it makes testing easier
        assignedFields.sort();
        this._assignedFields = assignedFields;
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
        _key: {
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
            value(record: ViewModelInterface<FieldsMapping, any> | null): boolean {
                if (!record) {
                    return false;
                }
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
            value<CloneFieldNames extends keyof FinalFields>(
                fieldNames?: CloneFieldNames[] | FieldPath[]
            ): ViewModelInterface<FinalFields, CloneFieldNames, PkFieldType, PkValueType> {
                if (!fieldNames) {
                    fieldNames = this._assignedFields;
                }
                const missingFieldNames: string[] = [];
                const nestedToClone: Record<string, FieldPath[]> = {};
                const nonRelatedFieldNames: string[] = [];
                for (const pathElement of fieldNames as FieldPath[]) {
                    if (typeof pathElement === 'string') {
                        if (!this._assignedFields.includes(pathElement)) {
                            missingFieldNames.push(pathElement);
                        } else {
                            nonRelatedFieldNames.push(pathElement);
                        }
                    } else {
                        const [name, ...p] = pathElement;
                        if (!nestedToClone[name]) {
                            nestedToClone[name] = [];
                        }
                        if (p.length > 1) {
                            // Nested fields - need to pass the whole array
                            // eg. [user, group, id]
                            nestedToClone[name].push(p);
                        } else {
                            // A specific field on this record
                            // eg. [user, name]
                            nestedToClone[name].push(p[0]);
                        }
                    }
                }
                const data: Record<string, any> = {};
                const missingRelations: [string, string[]][] = [];
                const assignedFields: string[] = [...this._assignedFields];
                for (const [name, nestedFieldNames] of Object.entries(nestedToClone)) {
                    if (!this._assignedFields.includes(name)) {
                        missingFieldNames.push(name);
                        missingRelations.push([name, flattenFieldPath(nestedFieldNames)]);
                    } else {
                        try {
                            if (Array.isArray(this[name])) {
                                data[name] = this[name].map(r => r.clone(nestedFieldNames));
                            } else {
                                data[name] = this[name].clone(nestedFieldNames);
                            }
                        } catch (err) {
                            if (err instanceof MissingFieldsError) {
                                assignedFields.push(
                                    ...err.assignedFields.map(fieldName => `${name}.${fieldName}`)
                                );
                                missingFieldNames.push(
                                    ...err.missingFieldNames.map(
                                        fieldName => `${name}.${fieldName}`
                                    )
                                );
                                missingRelations.push(
                                    ...(err.missingRelations.map(
                                        ([relationName, relationFieldNames]) => [
                                            `${name}.${relationName}`,
                                            relationFieldNames,
                                        ]
                                    ) as [string, string[]][])
                                );
                            } else {
                                throw err;
                            }
                        }
                    }
                }
                if (fieldNames && missingFieldNames.length > 0) {
                    throw new MissingFieldsError(
                        this,
                        assignedFields,
                        fieldNames as FieldPath[],
                        missingFieldNames,
                        missingRelations
                    );
                }

                for (const fieldName of nonRelatedFieldNames) {
                    // TODO: Unclear to me if this needs to call a method on the Field on not. Revisit this.
                    data[fieldName as string] = this[fieldName];
                }

                // Always clone primary keys
                const pkFieldNames = this._model.pkFieldNames;
                pkFieldNames.forEach(name => (data[name] = this[name]));

                return new this._model(data);
            },
        },
        _f: {
            /**
             * Get fields bound to this record instance. Each field behaves the same as accessing it via ViewModel.fields but
             * has a `value` property that contains the value for that field on this record.
             *
             * This is useful when you need to know both the field on the ViewModel and the value on a record (eg. when formatting
             * a value from a record
             *
             * ```js
             * const user = new User({ name: 'Jon Snow' });
             * user.name
             * // Jon Snow
             * user._f.name
             * // CharField({ name: 'name', label: 'Label' });
             * user._f.name.value
             * // Jon Snow
             * ```
             */

            get<IncomingData extends FieldDataMappingRaw<FinalFields>>(): {
                readonly [K in Extract<keyof IncomingData, keyof FinalFields>]: RecordBoundField<
                    FinalFields[K]['__fieldValueType'],
                    FinalFields[K]['__parsableValueType']
                >;
            } {
                if (!this.__recordBoundFields) {
                    const { fields } = this._model;
                    const { _data } = this;
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    const record = this;
                    this.__recordBoundFields = this._assignedFields.reduce((acc, fieldName) => {
                        acc[fieldName] = new Proxy(fields[fieldName], {
                            get(target, prop): any {
                                if (prop === 'value') {
                                    return _data[fieldName];
                                }
                                if (prop === 'isBound') {
                                    return true;
                                }
                                if (prop === 'boundRecord') {
                                    return record;
                                }
                                return target[prop];
                            },
                        });
                        return acc;
                    }, {});
                }
                return this.__recordBoundFields;
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
     * a copy for A & B that are bound to the correct model class).
     *
     * Binding just means the `name` of a field has been set and the `model` link is set to the owning
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
                        if (!modelClass.prototype.hasOwnProperty(fieldName)) {
                            extraFields[fieldName] = pkField[i];
                        }
                    });
                } else {
                    if (Array.isArray(pkFieldName) || Array.isArray(pkField)) {
                        throw new Error(
                            `When defining a compound key both the name and field definition must be an array. Received ${pkFieldName} and ${pkField}.`
                        );
                    }
                    if (!modelClass.prototype.hasOwnProperty(pkFieldName)) {
                        extraFields[pkFieldName] = pkField;
                    }
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
            Object.values(f[0]).forEach(field => field.contributeToClass(modelClass));
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
                ViewModelCache<ViewModelConstructor<FinalFields, PkFieldType, PkValueType>>
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
        fieldNames: {
            get(): string[] {
                const pkFieldNames = this.pkFieldNames;
                return Object.keys(this.fields).filter(name => !pkFieldNames.includes(name));
            },
        },
        getField: {
            value(fieldName: FieldPath): Field<any> {
                const [first, ...parts] = Array.isArray(fieldName) ? fieldName : [fieldName];
                const firstField = this.fields[first];
                if (!firstField) {
                    throw new InvalidFieldError(
                        `Unknown field '${first}' on ViewModel '${this.name}'`
                    );
                }
                // Second condition redundant but makes typescript happy
                if (parts.length === 0 || !Array.isArray(fieldName)) {
                    return firstField;
                }
                if (!(firstField instanceof BaseRelatedViewModelField)) {
                    throw new Error(
                        `Field '${first}' does not extend BaseRelatedViewModelField. When using array notation every element except the last must be a field that extends BaseRelatedViewModelField. Received: ${fieldName.join(
                            ', '
                        )}`
                    );
                }
                const last = parts.pop() as string;
                let lastModel = firstField.to;
                for (let i = 0; i < parts.length; i++) {
                    const field = lastModel.fields[parts[i]];
                    if (!field) {
                        throw new InvalidFieldError(
                            `Unknown field '${parts[i]}' (from [${fieldName.join(
                                ', '
                            )}]) on ViewModel '${lastModel.name}'`
                        );
                    }
                    if (!(field instanceof BaseRelatedViewModelField)) {
                        throw new Error(
                            `Field '${parts[i]}' (from [${fieldName.join(', ')}]) on ViewModel '${
                                lastModel.name
                            }' is not a field that extends BaseRelatedViewModelField`
                        );
                    }
                    lastModel = lastModel.fields[parts[i]].to;
                }
                if (!lastModel.fields[last]) {
                    throw new InvalidFieldError(
                        `Unknown field '${last}' (from [${fieldName.join(', ')}]) on ViewModel '${
                            lastModel.name
                        }'`
                    );
                }
                return lastModel.fields[last];
            },
        },
        fields: {
            get(): FinalFields {
                return _bindFields(this)[0];
            },
        },
        cache: {
            get(): ViewModelCache<ViewModelConstructor<FinalFields, PkFieldType, PkValueType>> {
                // This is a getter so we can instantiate cache on each ViewModel independently without
                // having to have the descendant create the cache
                let cache = this.__cache.get(this);
                if (!cache) {
                    cache = new ViewModelCache(this);
                    this.__cache.set(this, cache);
                }
                return cache;
            },
            set(
                value: ViewModelCache<ViewModelConstructor<FinalFields, PkFieldType, PkValueType>>
            ): void {
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
        return viewModelFactory(f as T & P, {
            ...(options as ViewModelOptions<T & P>),
            ...newOptions,
            baseClass: this,
        });
    }

    _Base.augment = augment;
    return (_Base as Function) as ViewModelConstructor<FinalFields, PkFieldType, PkValueType>;
}

/**
 * Type to describe values of an instance of ViewModel
 *
 * Usage:
 *
 * ```ts
 * const Person = viewModelFactory({
 *   name: new Field<string>(),
 *   age: new Field<number>(),
 * });
 * type PersonValues = ViewModelValues<typeof Person>;
 * ```
 */
export type ViewModelValues<
    T extends ViewModelConstructor<any>,
    FieldNames extends keyof T['fields'] = keyof T['fields'],
    OptionalFieldNames extends keyof T['fields'] = keyof T['fields']
> = {
    [K in Extract<keyof T['fields'], FieldNames>]: T['fields'][K]['__fieldValueType'];
} &
    {
        [K in Extract<keyof T['fields'], OptionalFieldNames>]?: T['fields'][K]['__fieldValueType'];
    };

/**
 * Type to describe a ViewModel instance with only some of the fields set
 *
 * Usage:
 *
 * ```ts
 * const Person = viewModelFactory({
 *   name: new Field<string>(),
 *   age: new Field<number>(),
 * });
 * type AgeOnly = PartialViewModel<typeof Person, 'age'>;
 * ```
 */
export type PartialViewModel<
    T extends ViewModelConstructor<any>,
    FieldNames extends keyof T['fields']
> = InstanceType<T> &
    ViewModelInterface<T['fields'], FieldNames, T['__pkFieldType'], T['__pkType']>;
