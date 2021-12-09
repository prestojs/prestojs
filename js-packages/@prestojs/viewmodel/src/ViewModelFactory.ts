import { isEqual } from '@prestojs/util';
import intersectionBy from 'lodash/intersectionBy';
import startCase from 'lodash/startCase';
import Field, { RecordBoundField } from './fields/Field';
import { BaseRelatedViewModelField, RelatedViewModelField } from './fields/RelatedViewModelField';
import { freezeObject, isDev } from './util';
import ViewModelCache from './ViewModelCache';

export type SinglePrimaryKey = string | number;
export type CompoundPrimaryKey = { [fieldName: string]: SinglePrimaryKey };
export type PrimaryKey = SinglePrimaryKey | CompoundPrimaryKey;

export type FieldsMapping = { [fieldName: string]: Field<any> };

export type FieldsMappingOrNull<T extends FieldsMapping> =
    | Record<string, Field<any>>
    | {
          [K in keyof T]?: null | undefined | Field<any>;
      };

type ExtractRelatedFields<T extends ViewModelConstructor<any, any>> = {
    [P in keyof T['fields'] as T['fields'][P] extends RelatedViewModelField<any>
        ? P
        : never]: T['fields'][P] extends RelatedViewModelField<infer X> ? X : never;
};

type ValueOf<T> = T[keyof T];

type FieldPathInner<
    FieldNames extends string[],
    T extends ViewModelConstructor<any, any>,
    R extends ExtractRelatedFields<T> = ExtractRelatedFields<T>
> =
    | [...FieldNames, keyof T['fields']]
    | [
          ...FieldNames,
          ...ValueOf<{
              [K in Extract<keyof R, string>]: ValueOf<{
                  [J in Extract<keyof R[K]['fields'], string>]:
                      | [K, J]
                      | (R[K]['fields'][J] extends RelatedViewModelField<infer X>
                            ? FieldPathInner<[K, J], X>
                            : never);
              }>;
          }>
      ];

export type FieldPath<
    T extends ViewModelConstructor<any, any>,
    R extends ExtractRelatedFields<T> = ExtractRelatedFields<T>
> =
    | Extract<keyof T['fields'], string>
    | ValueOf<{
          [K in Extract<keyof R, string>]: ValueOf<{
              [J in Extract<keyof R[K]['fields'], string>]:
                  | [K, J]
                  | (R[K]['fields'][J] extends RelatedViewModelField<infer X>
                        ? FieldPathInner<[K, J], X>
                        : never);
          }>;
      }>;

export type FieldDataMapping<FieldMappingType extends FieldsMapping> = {
    readonly [K in keyof FieldMappingType]: FieldMappingType[K]['__fieldValueType'];
};

export type FieldDataMappingRaw<T extends FieldsMapping> = {
    [K in keyof T]?: T[K]['__parsableValueType'];
};

export type ExtractFieldNames<FieldMappingType extends FieldsMapping> = Extract<
    keyof FieldMappingType,
    string
>;

type ExtractPkFieldTypes<FieldMappingType extends FieldsMapping> =
    | ExtractFieldNames<FieldMappingType>
    | ExtractFieldNames<FieldMappingType>[];

type ViewModelPkFieldType<FieldMappingType extends FieldsMapping> =
    | Extract<keyof FieldMappingType, string>
    | Extract<keyof FieldMappingType, string>[];

// https://github.com/microsoft/TypeScript/issues/13298#issuecomment-724542300
type UnionToTuple<T> = (
    (T extends any ? (t: T) => T : never) extends infer U
        ? (U extends any ? (u: U) => any : never) extends (v: infer V) => any
            ? V
            : never
        : never
) extends (_: any) => infer W
    ? [...UnionToTuple<Exclude<T, W>>, W]
    : [];

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
export function flattenFieldPath<
    T extends ViewModelConstructor<any, any>,
    R extends ExtractRelatedFields<T> = ExtractRelatedFields<T>
>(fieldPath: FieldPath<T, R>[] | FieldPath<T, R>, separator = '.'): string[] {
    if (!Array.isArray(fieldPath)) {
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
 * @expand-properties
 */
interface ViewModelOptions<
    T extends FieldsMapping,
    PkFieldNameT extends ExtractFieldNames<T> | ExtractFieldNames<T>[]
> {
    /**
     * Optional base class to extend. When calling `augment` this is set the augmented class.
     *
     * @type-name Class
     */
    baseClass?: ViewModelConstructor<any, any>;
    /**
     * Primary key name(s) to use. There should be field(s) with the corresponding name in the
     * provided `fields`.
     *
     * Only `pkFieldName` or `getImplicitPkField` should be provided. If neither are provided then
     * a field called `id` will be used and created if not provided in `fields`.
     *
     * @type-name string|string[]
     */
    pkFieldName: PkFieldNameT;
}

type KeysOfType<O, T> = keyof { [P in keyof O as O[P] extends T ? P : never]: O[P] };

type AugmentFields<
    OriginalFields extends FieldsMapping,
    AugmentedFields extends FieldsMappingOrNull<OriginalFields>
> = Omit<OriginalFields, keyof AugmentedFields> &
    Omit<AugmentedFields, KeysOfType<AugmentedFields, undefined | null>>;

type ExtractPkFields<
    FieldMappingType extends FieldsMapping,
    PkFieldType extends ExtractPkFieldTypes<FieldMappingType>
> = PkFieldType extends string
    ? Record<PkFieldType, FieldMappingType[PkFieldType]>
    : {
          [K in keyof FieldMappingType as K extends PkFieldType[number]
              ? K
              : never]: FieldMappingType[K];
      };

type ViewModelInterfaceInputData<
    FieldMappingType extends FieldsMapping,
    PkFieldType extends ExtractPkFieldTypes<FieldMappingType>
> = FieldDataMappingRaw<FieldMappingType> & {
    [K in keyof ExtractPkFields<FieldMappingType, PkFieldType>]: ExtractPkFields<
        FieldMappingType,
        PkFieldType
    >[K]['__parsableValueType'];
};

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
        requestedFieldNames: FieldPath<any, any>[],
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

export class BaseViewModel<
    FieldMappingType extends FieldsMapping,
    PkFieldType extends ExtractPkFieldTypes<FieldMappingType>,
    AssignedFieldNames extends ExtractFieldNames<FieldMappingType> = ExtractFieldNames<FieldMappingType>
> {
    get _model(): ViewModelConstructor<FieldMappingType, PkFieldType> {
        return Object.getPrototypeOf(this).constructor;
    }

    // TODO: return type
    /**
     * Returns the primary key value(s) for this instance. This is to conform to the
     * [Identifiable](doc:Identifiable) interface.
     */
    get _key(): PkFieldType extends string
        ? FieldMappingType[PkFieldType]['__fieldValueType']
        : {
              [K in keyof FieldMappingType as K extends PkFieldType[number]
                  ? K
                  : never]: FieldMappingType[K]['__fieldValueType'];
          } {
        const { pkFieldName } = this._model;
        if (Array.isArray(pkFieldName)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return pkFieldName.reduce((acc, fieldName) => {
                acc[fieldName as string] = this._data[fieldName as string];
                return acc;
            }, {});
        }
        return this._data[pkFieldName as string];
    }

    toJS(): {
        readonly [K in AssignedFieldNames]: FieldMappingType[K]['__fieldValueType'];
    } {
        const data = {};
        for (const [fieldName, value] of Object.entries(this._data)) {
            data[fieldName] = this._model.fields[fieldName].toJS(value);
        }
        return data as {
            readonly [K in AssignedFieldNames]: FieldMappingType[K]['__fieldValueType'];
        };
    }

    isEqual(record: ViewModelInterface<any, any> | null): boolean {
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
    }

    clone<CloneFieldNames extends ExtractFieldNames<FieldMappingType>>(
        fieldNames?:
            | CloneFieldNames[]
            | FieldPath<ViewModelConstructor<FieldMappingType, PkFieldType>>[]
    ): ViewModelInterface<FieldMappingType, PkFieldType, CloneFieldNames> {
        if (!fieldNames) {
            fieldNames = this._assignedFields as unknown as ExtractFieldNames<FieldMappingType>[];
        }
        const missingFieldNames: string[] = [];
        const nestedToClone: Record<
            string,
            FieldPath<ViewModelConstructor<FieldMappingType, PkFieldType>>[]
        > = {};
        const nonRelatedFieldNames: string[] = [];
        for (const pathElement of fieldNames as FieldPath<
            ViewModelConstructor<FieldMappingType, PkFieldType>
        >[]) {
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
                    nestedToClone[name].push(
                        p as FieldPath<ViewModelConstructor<FieldMappingType, PkFieldType>>
                    );
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
                            ...err.missingFieldNames.map(fieldName => `${name}.${fieldName}`)
                        );
                        missingRelations.push(
                            ...(err.missingRelations.map(([relationName, relationFieldNames]) => [
                                `${name}.${relationName}`,
                                relationFieldNames,
                            ]) as [string, string[]][])
                        );
                    } else {
                        throw err;
                    }
                }
            }
        }
        if (fieldNames && missingFieldNames.length > 0) {
            throw new MissingFieldsError(
                this as ViewModelInterface<any, any>,
                assignedFields,
                fieldNames as FieldPath<ViewModelConstructor<FieldMappingType, PkFieldType>>[],
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
        pkFieldNames.forEach(name => (data[name] = this[name as string]));

        return new this._model(data as ViewModelInterfaceInputData<FieldMappingType, PkFieldType>);
    }

    private __recordBoundFields: {
        readonly [K in AssignedFieldNames]: RecordBoundField<
            FieldMappingType[K]['__fieldValueType'],
            FieldMappingType[K]['__parsableValueType']
        >;
    };
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
    get _f(): {
        readonly [K in AssignedFieldNames]: RecordBoundField<
            FieldMappingType[K]['__fieldValueType'],
            FieldMappingType[K]['__parsableValueType']
        >;
    } {
        if (!this.__recordBoundFields) {
            const { fields } = this._model;
            const { _data } = this;
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const record = this;
            this.__recordBoundFields = this._assignedFields.reduce((acc: {}, fieldName) => {
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
            }, {}) as {
                readonly [K in AssignedFieldNames]: RecordBoundField<
                    FieldMappingType[K]['__fieldValueType'],
                    FieldMappingType[K]['__parsableValueType']
                >;
            };
        }
        return this.__recordBoundFields;
    }

    constructor(data: {
        [K in AssignedFieldNames]: FieldMappingType[K]['__parsableValueType'];
    }) {
        if (!data) {
            throw new Error('data must be specified');
        }
        const pkFieldNames = this._model.pkFieldNames;
        const missing = pkFieldNames.filter(name => !(name in data));
        const empty = pkFieldNames.filter(name => name in data && data[name as string] == null);
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
        this._data = freezeObject(assignedData) as {
            [k in AssignedFieldNames]: FieldMappingType[k]['__fieldValueType'];
        };

        return this;
    }

    /**
     * The assigned data for this record. You usually don't need to access this directly; values
     * for a field can be retrieved from the record directly using the field name
     *
     * @type-name Object
     */
    readonly _data: {
        [k in AssignedFieldNames]: FieldMappingType[k]['__fieldValueType'];
    };

    /**
     * List of field names with data available on this instance.
     *
     * @type-name string[]
     */
    readonly _assignedFields: string[];
}

export type ViewModelInterface<
    FieldMappingType extends FieldsMapping,
    PkFieldType extends ExtractPkFieldTypes<FieldMappingType>,
    AssignedFieldNames extends ExtractFieldNames<FieldMappingType> = ExtractFieldNames<FieldMappingType>
> = BaseViewModel<FieldMappingType, PkFieldType, AssignedFieldNames> &
    FieldDataMapping<Pick<FieldMappingType, AssignedFieldNames>>;

/**
 * Check if an object is ViewModel
 */
export function isViewModelInstance<T extends ViewModelInterface<any, any, any>>(
    view: any
): view is T {
    return !!(view && view instanceof BaseViewModel);
}

/**
 * Check if a class is a ViewModel
 */
export function isViewModelClass<T extends ViewModelConstructor<any, any>>(view: any): view is T {
    return !!(view && view.prototype instanceof BaseViewModel);
}

export interface ViewModelConstructor<
    FieldMappingType extends FieldsMapping,
    PkFieldType extends ViewModelPkFieldType<FieldMappingType>
> {
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
    // const C: ViewModelConstructor<any, any> = B;
    // const a3 = new C({ name: 'test' });
    // Error: Property 'age' does not exist on type ...
    // a3.age
    // This overload makes it so fields set on the record match the data passed in. Unfortunately this
    // information is lost if you extend the class. The second overload makes extending a class work
    // while still satisfying ViewModelConstructor (without the overload it won't be assignable to
    // ViewModelConstructor for some reason not obvious to me)
    new <D extends ViewModelInterfaceInputData<FieldMappingType, PkFieldType>>(
        data: D
    ): ViewModelInterface<FieldMappingType, PkFieldType, Extract<keyof D, string>>;
    new (data: ViewModelInterfaceInputData<FieldMappingType, PkFieldType>): ViewModelInterface<
        FieldMappingType,
        PkFieldType,
        Extract<keyof typeof data, ExtractFieldNames<FieldMappingType>>
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
     * Name of the primary key field for this ViewModel (or fields for compound keys)
     *
     * If `options.pkFieldName` is not specified a field will be created from `options.getImplicitPk`
     * if provided otherwise a default field with name 'id' will be created.
     */
    readonly pkFieldName: PkFieldType;

    /**
     * Shortcut to get pkFieldName as an array always, even for non-compound keys
     */
    readonly pkFieldNames: PkFieldType extends string ? [PkFieldType] : PkFieldType;

    /**
     * Shortcut to get the names of all fields excluding primary keys.
     *
     * If you want all fields including primary key do:
     *
     * ```js
     * model.fieldNames.concat(model.pkFieldNames);
     * ```
     */
    readonly fieldNames: Extract<keyof FieldMappingType, string>[];

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
    getField(
        fieldName: FieldPath<
            ViewModelConstructor<FieldMappingType, PkFieldType>,
            ExtractRelatedFields<ViewModelConstructor<FieldMappingType, PkFieldType>>
        >
    ): Field<any>;

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
    cache: ViewModelCache<ViewModelConstructor<FieldMappingType, PkFieldType>>;

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
    augment<
        T extends FieldsMappingOrNull<FieldMappingType>,
        AugmentPkFieldType extends ViewModelPkFieldType<
            AugmentFields<FieldMappingType, T>
        > = PkFieldType extends string
            ? T[PkFieldType] extends Field<any>
                ? PkFieldType
                : // This means the original pk field name doesn't exist in T OR we've lost the type - this seems
                  // to happen when you augment multiple levels without explicitly passing pkFieldName. Typing this
                  // as any so it still works (ideally would be never but that breaks the multilevel augment right now)
                  any
            : // This is for compound key but I don't know how to type it better
              any
    >(
        newFields: T,
        newOptions?: Partial<
            ViewModelOptions<AugmentFields<FieldMappingType, T>, AugmentPkFieldType>
        >
    ): ViewModelConstructor<AugmentFields<FieldMappingType, T>, AugmentPkFieldType>;
}

/**
 * Defines a getter on `base` for `name` that throws `errorMessage`. If this property isn't
 * overridden then when it's accessed the error will be thrown (eg. for static properties
 * like `label` & `labelPlural`.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function defineRequiredGetter(base: Function, name: string, errorMessage: string): void {
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

function bindFields<
    FieldMappingType extends FieldsMapping,
    PkFieldNameT extends ExtractFieldNames<FieldMappingType> | ExtractFieldNames<FieldMappingType>[]
>(
    fields: FieldMappingType,
    bindTo: ViewModelConstructor<FieldMappingType, PkFieldNameT>
): FieldMappingType {
    const newFields = Object.entries(fields).reduce((acc, [fieldName, field]) => {
        acc[fieldName] = field.clone();
        acc[fieldName].model = bindTo;
        acc[fieldName].name = fieldName;
        if (acc[fieldName].label === undefined) {
            acc[fieldName].label = getImplicitFieldLabel(fieldName);
        }
        return acc;
    }, {});
    return freezeObject(newFields) as FieldMappingType;
}

const reservedFieldNames = ['toJS', 'clone', 'isEqual'];

function checkReservedFieldNames(fields): void {
    reservedFieldNames.forEach(fieldName => {
        if (fields[fieldName]) {
            throw new Error(`${fieldName} is reserved and cannot be used as a field name`);
        }
    });
}

/**
 * Get assigned field paths for the record.
 *
 * See test cases for example of what this looks like
 */
export function getAssignedFieldsDeep<T extends ViewModelConstructor<any, any>>(
    record: InstanceType<T>
): FieldPath<T>[] {
    const fieldNames: FieldPath<T>[] = [];
    if (!Array.isArray(record._assignedFields)) console.log(record, record._assignedFields);
    for (const fieldName of record._assignedFields) {
        const data = record[fieldName];
        const field = record._model.fields[fieldName];
        if (field instanceof BaseRelatedViewModelField && data) {
            if (field.many) {
                if (data.length === 0) {
                    fieldNames.push([fieldName] as unknown as FieldPath<T>);
                } else {
                    // If we have many records we can only take the common set of fields
                    // Failing to do this will cause various issues with caching.
                    const paths = intersectionBy(...data.map(getAssignedFieldsDeep), p =>
                        flattenFieldPath(p).join('|')
                    );
                    for (const path of paths) {
                        fieldNames.push([
                            fieldName,
                            ...(Array.isArray(path) ? path : [path]),
                        ] as FieldPath<T>);
                    }
                }
            } else {
                if (!data._assignedFields) {
                    console.log(field);
                }
                for (const path of getAssignedFieldsDeep(data)) {
                    fieldNames.push([
                        fieldName,
                        ...(Array.isArray(path) ? path : [path]),
                    ] as FieldPath<T>);
                }
            }
        } else {
            fieldNames.push(fieldName as FieldPath<T>);
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
function expandField<T extends ViewModelConstructor<any, any>>(
    model: T,
    fieldName: ExtractFieldNames<T['fields']>
): FieldPath<T>[] {
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
export function expandRelationFieldPaths<T extends ViewModelConstructor<any, any>>(
    model: T,
    paths: FieldPath<T>[]
): FieldPath<T>[] {
    const expanded: FieldPath<T>[] = [];
    const fieldsAdded = new Set<string>();
    for (const path of paths) {
        if (typeof path === 'string') {
            const field = model.fields[path];
            if (field instanceof BaseRelatedViewModelField) {
                fieldsAdded.add(field.sourceFieldName);
                expanded.push(field.sourceFieldName as FieldPath<T>);
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
                        expanded.push(sourcePath as FieldPath<T>);
                    }
                    if (isLast) {
                        for (const p of expandField(currentModel, fieldName).map(subPath => [
                            ...path.slice(0, i),
                            ...subPath,
                        ])) {
                            const dottedP = p.join('.');
                            if (!fieldsAdded.has(dottedP)) {
                                expanded.push(p as FieldPath<T>);
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

export default function viewModelFactory<
    FieldMappingType extends FieldsMapping,
    PkFieldNameT extends ExtractFieldNames<FieldMappingType> | ExtractFieldNames<FieldMappingType>[]
>(
    fields: FieldMappingType,
    options: ViewModelOptions<FieldMappingType, PkFieldNameT>
): ViewModelConstructor<FieldMappingType, PkFieldNameT> {
    if (options.baseClass && !(options.baseClass.prototype instanceof BaseViewModel)) {
        throw new Error("'baseClass' must extend BaseViewModel");
    }

    checkReservedFieldNames(fields);
    // Store bound fields and primary key name for all models in the hierarchy
    const boundFields: Map<
        ViewModelConstructor<FieldMappingType, PkFieldNameT>,
        FieldMappingType
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
    function _bindFields(
        modelClass: ViewModelConstructor<FieldMappingType, PkFieldNameT>
    ): FieldMappingType {
        let f = boundFields.get(modelClass);
        if (!f) {
            const toBind = { ...fields };
            const missingFields = modelClass.pkFieldNames.filter(fieldName => !toBind[fieldName]);
            if (missingFields.length > 0) {
                throw new Error(
                    `${modelClass.name} has 'pkFieldName' set to '${modelClass.pkFieldNames.join(
                        ', '
                    )}' but the field(s) '${missingFields.join(
                        ', '
                    )}' does not exist in 'fields'. Either add the missing field(s) or update 'pkFieldName' to reflect the actual primary key field.`
                );
            }
            f = bindFields(toBind, modelClass);
            boundFields.set(modelClass, f);
            Object.values(f).forEach(field => field.contributeToClass(modelClass));
        }
        return f;
    }

    const baseClass = options.baseClass ?? BaseViewModel;

    const _Base = class extends baseClass<FieldMappingType, PkFieldNameT> {};

    Object.defineProperties(_Base, {
        __cache: {
            value: new Map<
                ViewModelConstructor<FieldMappingType, PkFieldNameT>,
                ViewModelCache<ViewModelConstructor<FieldMappingType, PkFieldNameT>>
            >(),
        },
        pkFieldName: {
            get(): PkFieldNameT {
                return options.pkFieldName;
            },
        },
        pkFieldNames: {
            /**
             * Shortcut to get pkFieldName as an array always, even for non-compound keys
             */
            get(): PkFieldNameT extends string
                ? [PkFieldNameT]
                : UnionToTuple<PkFieldNameT[number]> {
                const pkFieldNames = this.pkFieldName;
                if (typeof pkFieldNames == 'string') {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    return [pkFieldNames];
                }
                return pkFieldNames;
            },
        },
        fields: {
            get(): FieldMappingType {
                return _bindFields(this);
            },
        },
        fieldNames: {
            get(): string[] {
                const pkFieldNames = this.pkFieldNames;
                return Object.keys(this.fields).filter(name => !pkFieldNames.includes(name));
            },
        },
        getField: {
            value(
                fieldName: FieldPath<
                    ViewModelConstructor<FieldMappingType, PkFieldNameT>,
                    ExtractRelatedFields<ViewModelConstructor<FieldMappingType, PkFieldNameT>>
                >
                // TODO: can we extract the precise field?
            ): Field<any> {
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
        cache: {
            get(): ViewModelCache<ViewModelConstructor<FieldMappingType, PkFieldNameT>> {
                // This is a getter so we can instantiate cache on each ViewModel independently without
                // having to have the descendant create the cache
                let cache = this.__cache.get(this);
                if (!cache) {
                    cache = new ViewModelCache(this);
                    this.__cache.set(this, cache);
                }
                return cache;
            },
            set(value: ViewModelCache<ViewModelConstructor<FieldMappingType, PkFieldNameT>>): void {
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

    // Build getter/setter for all known fields. Note that we need to do this in _bindFields below as well in the
    // case that primary key fields are created.
    const properties: Record<string, any> = {};
    Object.keys(fields).forEach(fieldName => {
        properties[fieldName] = buildFieldGetterSetter(fieldName);
    });
    Object.defineProperties(_Base.prototype, properties);

    function augment<
        T extends FieldsMappingOrNull<FieldMappingType>,
        AugmentPkFieldType extends ViewModelPkFieldType<AugmentFields<FieldMappingType, T>>
    >(
        newFields: T,
        newOptions?: Partial<
            ViewModelOptions<AugmentFields<FieldMappingType, T>, AugmentPkFieldType>
        >
    ): ViewModelConstructor<AugmentFields<FieldMappingType, T>, AugmentPkFieldType> {
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
        const finalOptions = {
            ...options,
            ...newOptions,
            baseClass: this,
        };
        return viewModelFactory(
            f as AugmentFields<FieldMappingType, T>,
            finalOptions as ViewModelOptions<AugmentFields<FieldMappingType, T>, AugmentPkFieldType>
        );
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    _Base.augment = augment;

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

    return _Base as unknown as ViewModelConstructor<FieldMappingType, PkFieldNameT>;
}

// const BaseUser = viewModelFactory(
//     {
//         id: new Field<number>(),
//         firstName: new Field<string>(),
//         age: new Field<number>(),
//     },
//     { pkFieldName: 'id' }
// );
// class User extends BaseUser {
//     getYourStuff(): number {
//         return 5;
//     }
// }
//
// interface ExtendedViewModel<
//     Extended extends ViewModelConstructor<any, any>,
//     D extends ViewModelInterfaceInputData<Extended['fields'], Extended['pkFieldName']>
// > {
//     new (data: D): Pick<
//         InstanceType<Extended>,
//         Exclude<
//             keyof InstanceType<Extended>,
//             | keyof Extended['fields']
//             | keyof ViewModelInterface<
//                   Extended['fields'],
//                   Extended['pkFieldName'],
//                   Extract<keyof D, string>
//               >
//         >
//     > &
//         ViewModelInterface<Extended['fields'], Extended['pkFieldName'], Extract<keyof D, string>>;
// }
// // class NewUser<D extends ViewModelInterfaceInputData<typeof User['fields'], typeof User['pkFieldName']>> extends User implements ExtendedViewModel<typeof User, D> {
// class NewUser extends User {
//     getName(): string {
//         return this.firstName;
//     }
//     getMore(): void {
//         // asdf
//     }
//     static blah = 5;
//     static getBlah(): number {
//         return this.blah;
//     }
// }
// {
//     const a: ViewModelConstructor<any, any> = User;
//     const b: ViewModelConstructor<any, any> = NewUser;
//     const c: ViewModelInterface<any, any> = new NewUser({ id: 5, firstName: 'string' });
// }
//
// // new NewUser({ firstName: 'string' });
// // new NewUser({ id: 5, firstName: 'string' });
// //
// // const User33 = viewModelFactory(
// //     {
// //         userId: new Field<number>(),
// //         firstName: new Field<string>(),
// //         age: new Field<number>(),
// //     },
// //     { pkFieldName: 'userId' }
// // );
// //
// // const uu = new User33({ userId: 5, firstName: 'string' });
// // uu.age;
// // type LLOL = typeof uu._key;
// //
// // const UserCompound = viewModelFactory(
// //     {
// //         userId: new Field<number>(),
// //         userId2: new Field<string>(),
// //         firstName: new Field<string>(),
// //         age: new Field<number>(),
// //     },
// //     { pkFieldName: ['userId', 'userId2'] }
// // );
// // type W = typeof UserCompound.pkFieldNames;
// // const dsf: W = ['userId', 'userId2'];
// //
// // const uc = new UserCompound({ userId: 1, userId2: '2', firstName: 'string' });
// // type ROFL = typeof uc._key;
// //
// // type X = ConstructorParameters<typeof UserCompound>;
// // type YYY = ConstructorParameters<typeof User33>;
// //
// // type FieldNameMa = typeof UserCompound['fields'];
// // type PkFieldType = Extract<keyof FieldNameMa, string>[];
// // type MMM = keyof FieldNameMa;
// // type WOW = {
// //     [K in keyof FieldNameMa as K extends PkFieldType[0]
// //         ? K
// //         : never]: FieldNameMa[K]['__parsableValueType'];
// // };
// //
// // // class User extends ViewModel<typeof fields, 'id'> {
// // //     static label = "lol";
// // //     static fields = fields;
// // // }
// //
// // const data = { id: 1, age: 5 };
// // {
// //     const x = new BaseUser({ id: 1, age: 5 });
// //     const y = x._data;
// //     y.firstName;
// //     y.id;
// //     y.age;
// //     x.age;
// //     x.firstName;
// //     x._assignedFields
// // }
// //
// // {
// //     const x = new User({ id: 1, age: 5 });
// //     const y = x._data;
// //     y.firstName;
// //     y.id;
// //     y.age;
// //     x.age;
// //     x.firstName;
// // }
// //
// // {
// //     const x = new NewUser({ id: 1, age: 5 });
// //     x.getName();
// //     x.getMore();
// //     x.age;
// //     const y = x._data;
// //     y.firstName;
// //     y.age;
// //     x.age;
// //     x.firstName;
// // }
// // {
// //     type LOL = ViewModelInterfaceInputData<typeof NewUser['fields'], typeof NewUser['pkFieldName']>;
// //     type BLAH = Extract<keyof LOL, string>;
// //     type X = Pick<NewUser, 'getName'>;
// //     type ExtendedViewModel<Extended extends ViewModelConstructor<any, any>> =
// //         // Pick<
// //         //     Extended,
// //         //     keyof Extended
// //         // > &
// //         // Extended &
// //         {
// //             new <
// //                 D extends ViewModelInterfaceInputData<Extended['fields'], Extended['pkFieldName']>
// //             >(
// //                 data: D
// //             ): Pick<
// //                 InstanceType<Extended>,
// //                 Exclude<
// //                     keyof InstanceType<Extended>,
// //                     | keyof Extended['fields']
// //                     | keyof ViewModelInterface<
// //                           Extended['fields'],
// //                           Extended['pkFieldName'],
// //                           Extract<keyof D, string>
// //                       >
// //                 >
// //             > &
// //                 ViewModelInterface<
// //                     Extended['fields'],
// //                     Extended['pkFieldName'],
// //                     Extract<keyof D, string>
// //                 >;
// //         } & Extended;
// //     // const _NewUser = NewUser as Pick<typeof NewUser, keyof typeof NewUser> & ({ new<
// //     //         D extends
// //     //             ViewModelInterfaceInputData<typeof NewUser['fields'], typeof NewUser['pkFieldName']>
// //     //         >(data: D): Pick<NewUser, Exclude<keyof NewUser, keyof typeof NewUser['fields'] | keyof ViewModelInterface<typeof NewUser['fields'], typeof NewUser['pkFieldName'], Extract<keyof D, string>>>> & ViewModelInterface<typeof NewUser['fields'], typeof NewUser['pkFieldName'], 'id'|'age'>
// //     // });
// //     const __NewUser = NewUser as ExtendedViewModel<typeof NewUser>;
// //     const _NewUser = class extends NewUser {} as ExtendedViewModel<typeof NewUser>;
// //     type OISDF = keyof typeof NewUser;
// //     type IODFS8 = Pick<typeof NewUser, keyof typeof NewUser>;
// //     _NewUser.pkFieldName;
// //     _NewUser.pkFieldNames;
// //     _NewUser.blah;
// //     _NewUser.getBlah();
// //     const x = new _NewUser({ id: 1, age: 5 });
// //     x.getName();
// //     x.getMore();
// //     x.getYourStuff();
// //     x.getSomewairjmaw();
// //     x.age;
// //     x.id;
// //     const y = x._data;
// //     y.firstName;
// //     y.age;
// //     y.id;
// //     x.age;
// //     x.firstName;
// // }
// //
// // {
// //     const X: ViewModelConstructor<any, any> = NewUser;
// //     const x: BaseViewModel<any, any> = new NewUser({ id: 1 });
// // }
// //
// // type Y = Pick<typeof User.fields, Extract<keyof typeof data, string>>;
// // type ZZ = ViewModelFieldIndexer<Y>;
// //
// // type ExtractByValue<O, T> = { [P in keyof O as O[P] extends T ? P : never]: O[P] };
// //
// // // type FieldPathNewest3<
// // //     B extends string[],
// // //     T extends ViewModelConstructor<any, any>,
// // //     R extends RelatedFields<T> = RelatedFields<T>
// // //     > = (
// // //     | [...B, keyof T['fields']]
// // //     | (T['fields'][R] extends RelatedViewModelField<infer X>
// // //     ? [...B, R,  ExtractFieldNames<X['fields']>]
// // //     : never)
// // //     )[];
// // //
// // // type FieldPathNewest2<
// // //     B extends string[],
// // //     T extends ViewModelConstructor<any, any>,
// // //     R extends RelatedFields<T>
// // //     > = (
// // //     | [...B, keyof T['fields']]
// // //     | (T['fields'][R] extends RelatedViewModelField<infer X>
// // //     ? [...B, R, ExtractFieldNames<X['fields']>] | FieldPathNewest3<[...B, R], X,  RelatedFields<X>>// | FieldPath2<T, F, X, ExtractFieldNames<X>>
// // //     : never)
// // //     );
// //
// class Parent5 extends viewModelFactory(
//     {
//         id: new Field<string>(),
//         parent5Name: new Field<string>(),
//     },
//     { pkFieldName: 'id' }
// ) {}
// class Parent4 extends viewModelFactory(
//     {
//         id: new Field<string>(),
//         parent4Name: new Field<string>(),
//         parent5: new RelatedViewModelField<typeof Parent5>({
//             sourceFieldName: 'asdf',
//             to: Parent5,
//         }),
//     },
//     { pkFieldName: 'id' }
// ) {}
//
// class Parent3 extends viewModelFactory(
//     {
//         id: new Field<string>(),
//         parent3Name: new Field<string>(),
//         parent4: new RelatedViewModelField<typeof Parent4>({
//             sourceFieldName: 'asdf',
//             to: Parent4,
//         }),
//     },
//     { pkFieldName: 'id' }
// ) {}
//
// class Parent2 extends viewModelFactory(
//     {
//         id: new Field<string>(),
//         parent2Name: new Field<string>(),
//         parent3: new RelatedViewModelField<typeof Parent3>({
//             sourceFieldName: 'asdf',
//             to: Parent3,
//         }),
//     },
//     { pkFieldName: 'id' }
// ) {}
//
// class Parent1 extends viewModelFactory(
//     {
//         id: new Field<string>(),
//         parent1Name: new Field<string>(),
//         parent2: new RelatedViewModelField({
//             sourceFieldName: 'asdf',
//             to: Parent2,
//         }),
//     },
//     { pkFieldName: 'id' }
// ) {}
//
// class Group extends viewModelFactory(
//     {
//         id: new Field<string>(),
//         groupName: new Field<string>(),
//         owner: new RelatedViewModelField<typeof User>({
//             sourceFieldName: 'asdf',
//             to: User,
//         }),
//         parent: new RelatedViewModelField<typeof Parent1>({
//             sourceFieldName: 'asdf',
//             to: Parent1,
//         }),
//     },
//     { pkFieldName: 'id' }
// ) {
//     getName(): string {
//         return this.groupName;
//     }
// }
// class Address extends viewModelFactory(
//     {
//         id: new Field<string>(),
//         address1: new Field<string>(),
//         postcode: new Field<string>(),
//         addressGroup: new RelatedViewModelField<typeof Group>({
//             sourceFieldName: 'asdf',
//             to: Group,
//         }),
//     },
//     { pkFieldName: 'id' }
// ) {}
// class User2 extends viewModelFactory(
//     {
//         id: new Field<string>(),
//         firstName: new Field<string>(),
//         groupId: new Field<number | null>(),
//         group: new RelatedViewModelField<typeof Group>({
//             sourceFieldName: 'asdf',
//             to: Group,
//         }),
//         adminGroup: new RelatedViewModelField<typeof Group>({
//             sourceFieldName: 'asdf',
//             to: Group,
//         }),
//         address: new RelatedViewModelField<typeof Address>({
//             sourceFieldName: 'asdf',
//             to: Address,
//         }),
//     },
//     { pkFieldName: 'id' }
// ) {
//     getName(): string {
//         return this.firstName;
//     }
// }
// //
// // // Ummm.. get Field is for a single field!
// // User2.getField(['firstName', ['group', 'groupName'], ['group', 'owner']]);
// //
// // // type XX = ExtractRelatedFields<typeof User2>
// // // type X = FieldPathNewest<typeof User2>
// // // type Z =  FieldPathNewest<typeof Group, ExtractRelatedFields<typeof Group>>
// // // type YY = NestedFieldNames<ExtractRelatedFields<typeof User2>>
// // //
// {
//     type X = FieldPath<typeof User2>[];
//     const x: X = ['firstName', 'groupId', ['adminGroup', 'owner'], ['address', 'postcode']];
//     const y: X = [
//         'firstName',
//         ['group', 'owner', 'age'],
//         ['address', 'addressGroup', 'owner', 'firstName'],
//     ];
//     const z: X = [
//         'firstName',
//         ['group', 'owner', 'age'],
//         ['address', 'addressGroup', 'owner', 'firstName'],
//         ['address', 'addressGroup', 'parent', 'parent1Name'],
//         ['address', 'addressGroup', 'parent', 'parent2', 'parent2Name'],
//         ['address', 'addressGroup', 'parent', 'parent2', 'parent3'],
//         ['address', 'addressGroup', 'parent', 'parent2', 'parent3', 'parent4'],
//         [
//             'address',
//             'addressGroup',
//             'parent',
//             'parent2',
//             'parent3',
//             'parent4',
//             'parent5',
//             'parent5Name',
//         ],
//     ];
//     const xx: X = ['firstName', ['group', '*']];
//
// }
// // //
// // // type ValueOf<T> = T[keyof T]
// // //
// // // type NestedFieldNames<X extends Record<string, ViewModelConstructor<any, any>>> = ValueOf<{
// // //     [K in keyof X]: ValueOf<{[J in keyof X[K]['fields']]: [K, J] |(X[K]['fields'][J] extends RelatedViewModelField<infer X> ? [K, J, keyof X['fields']] : never)}>
// // // }>

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
    T extends ViewModelConstructor<any, any>,
    FieldNames extends keyof T['fields'] = keyof T['fields'],
    OptionalFieldNames extends keyof T['fields'] = keyof T['fields']
> = {
    [K in Extract<keyof T['fields'], FieldNames>]: T['fields'][K]['__fieldValueType'];
} & {
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
    T extends ViewModelConstructor<any, any>,
    FieldNames extends ExtractFieldNames<T['fields']>
> = InstanceType<T> &
    ViewModelInterface<
        T['fields'],
        T['pkFieldName'],
        FieldNames | (T['pkFieldName'] extends string ? T['pkFieldName'] : T['pkFieldName'][number])
    >;

// TODO: ^ make this work and always include the pk field names

export type ExtractPkFieldParseableValueType<T extends ViewModelConstructor<any, any>> =
    T['pkFieldName'] extends string
        ? T['fields'][T['pkFieldName']]['__parsableValueType']
        : { [K in T['pkFieldNames']]: T['fields'][K]['__parsableValueType'] };
