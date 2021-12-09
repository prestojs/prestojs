import { isEqual } from '@prestojs/util';
import intersectionBy from 'lodash/intersectionBy';
import startCase from 'lodash/startCase';
import Field, { RecordBoundField } from './fields/Field';
import { BaseRelatedViewModelField } from './fields/RelatedViewModelField';
import { normalizeFields, ViewModelFieldPaths } from './fieldUtils';
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
    [P in keyof T['fields'] as T['fields'][P] extends BaseRelatedViewModelField<any, any, any>
        ? P
        : never]: T['fields'][P] extends BaseRelatedViewModelField<infer X, any, any> ? X : never;
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
                      | (R[K]['fields'][J] extends BaseRelatedViewModelField<infer X, any, any>
                            ? FieldPathInner<[K, J], X>
                            : never);
              }>;
          }>
      ];

export type FieldPath<
    T extends ViewModelConstructor<any, any>,
    R extends ExtractRelatedFields<T> = ExtractRelatedFields<T>
> =
    // | '*'
    | Extract<keyof T['fields'], string>
    | ValueOf<{
          [K in Extract<keyof R, string>]: ValueOf<{
              [J in Extract<keyof R[K]['fields'], string>]:
                  | [K, J]
                  | (R[K]['fields'][J] extends BaseRelatedViewModelField<infer X, any, any>
                        ? FieldPathInner<[K, J], X>
                        : never);
          }>;
      }>;

export type FieldPaths<
    T extends ViewModelConstructor<any, any>,
    R extends ExtractRelatedFields<T> = ExtractRelatedFields<T>
> = '*' | FieldPath<T, R>[];

type _ExtractRootFieldNames<
    T extends ViewModelConstructor<any, any>,
    FieldNames extends FieldPath<T>
> = Extract<
    FieldNames extends Array<any>
        ? // If possible infer the name of the source field name and include that. If it's not known just exclude
          // it which will mean the user must explicitly specify the source field name if they want the types for it
          // to work (when you specify a related field you automatically get the source field even if you don't ask
          // for it)
          T['fields'][FieldNames[0]] extends BaseRelatedViewModelField<
              any,
              any,
              any,
              infer SourceFieldNameT
          >
            ? SourceFieldNameT extends keyof T['fields']
                ? FieldNames[0] | SourceFieldNameT
                : FieldNames[0]
            : FieldNames[0]
        : FieldNames,
    string
>;

/**
 * Given a FieldPath return the root field name of each path, eg.
 * ['id', 'name', ['group', 'owner']]
 * would return ['id', 'name', 'group']
 */
type ExtractRootFieldNames<
    T extends ViewModelConstructor<any, any>,
    FieldNames extends FieldPath<T>
> = _ExtractRootFieldNames<T, FieldNames> extends keyof T['fields']
    ? _ExtractRootFieldNames<T, FieldNames>
    : never;

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

/**
 * Extract fields when specified using '*'. Currently this is all fields but could change to be
 * non-relation fields only
 */
export type ExtractStarFieldNames<FieldMappingType extends FieldsMapping> =
    ExtractFieldNames<FieldMappingType>;

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
    /**
     * Get the actual ViewModel class for this instance
     */
    get _model(): ViewModelConstructor<FieldMappingType, PkFieldType> {
        return Object.getPrototypeOf(this).constructor;
    }

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

    /**
     * Return the data for this record as a plain object
     */
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

    /**
     * Compares two records to see if they are equivalent.
     *
     * - If the ViewModel is different then the records are always considered different
     * - If the records were initialised with a different set of fields then they are
     *   considered different even if the common fields are the same and other fields are
     *   all null
     */
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

    /**
     * Clone this record, optionally with only a subset of the fields
     */
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
        const assignedData: Record<string, any> = {};
        const assignedFields: string[] = [];
        const assignedFieldsDeep: FieldPath<ViewModelConstructor<FieldMappingType, PkFieldType>>[] =
            [];
        const fields = this._model.fields;
        for (const [key, value] of Object.entries(data)) {
            const field = fields[key];
            if (field) {
                assignedData[key] = field.normalize(value);
                if (field instanceof BaseRelatedViewModelField) {
                    // Convert null to empty array for many fields
                    if (field.many && !assignedData[key]) {
                        assignedData[key] = [];
                    }
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
                    if (field.many) {
                        if (assignedData[key].length > 0) {
                            // If we have many records we can only take the common set of fields
                            // Failing to do this will cause various issues with caching.
                            const paths = intersectionBy(
                                ...assignedData[key].map(record => record._assignedFieldsDeep),
                                p => flattenFieldPath(p).join('|')
                            );
                            const normalizedPaths = normalizeFields(field.to, paths);
                            for (const index in assignedData[key]) {
                                // Clone any records that have extra fields so has same fields as `paths`. Without
                                // this caching can be inconsistent. In practice this would be unusual.
                                const r = assignedData[key][index];
                                if (r._assignedFieldPaths !== normalizedPaths) {
                                    assignedData[key][index] = r.clone(normalizedPaths.fieldPaths);
                                }
                            }

                            for (const path of paths) {
                                assignedFieldsDeep.push([
                                    key,
                                    ...(Array.isArray(path) ? path : [path]),
                                ] as FieldPath<
                                    ViewModelConstructor<FieldMappingType, PkFieldType>
                                >);
                            }
                        } else {
                            // Many to many field but no data - can only push the sourcefield name
                            assignedFieldsDeep.push(
                                field.sourceFieldName as FieldPath<
                                    ViewModelConstructor<FieldMappingType, PkFieldType>
                                >
                            );
                        }
                    } else if (assignedData[key]) {
                        for (const path of assignedData[key]._assignedFieldsDeep) {
                            assignedFieldsDeep.push([
                                key,
                                ...(Array.isArray(path) ? path : [path]),
                            ] as FieldPath<ViewModelConstructor<FieldMappingType, PkFieldType>>);
                        }
                    }
                    // Key could be set but the value is null. In that case we want the sourceFieldName to be set to
                    // null as well.
                    if (key in assignedData) {
                        assignedData[field.sourceFieldName] = pkOrPks ?? null;
                        if (!data[field.sourceFieldName]) {
                            assignedFields.push(field.sourceFieldName);
                            assignedFieldsDeep.push(field.sourceFieldName);
                        }
                    }
                } else {
                    assignedFieldsDeep.push(
                        key as FieldPath<ViewModelConstructor<FieldMappingType, PkFieldType>>
                    );
                }
                assignedFields.push(key);
            } else {
                // TODO: Should extra keys in data be a warning or ignored?
                console.warn(
                    `Received value for key ${key}. No such field exists on ${this._model.name}`
                );
            }
        }

        // Do this after resolving the above so that primary keys can be derived from related records if necessary
        // (eg. if you have a join table where primary keys are both RelatedViewModelField's)
        const pkFieldNames = this._model.pkFieldNames;
        const missing = pkFieldNames.filter(name => !(name in assignedData));
        const empty = pkFieldNames.filter(
            name => name in assignedData && assignedData[name as string] == null
        );
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

        // Sort fields so consistent order; primarily as it makes testing easier
        assignedFields.sort();
        this._assignedFieldPaths = normalizeFields(this._model, assignedFieldsDeep);
        this._assignedFields = assignedFields;
        this._assignedFieldsDeep = this._assignedFieldPaths.fieldPaths;
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

    /**
     * Deep field names set on this record. If no relations are set this is the same as `_assignedFields`.
     *
     * A deep field is a field that is a relation to another model and is represented as an array, eg.
     * `['group', 'name']` would be the the `name` field on the `group` relation.
     *
     * @type-name string[]
     */
    readonly _assignedFieldsDeep: FieldPath<ViewModelConstructor<FieldMappingType, PkFieldType>>[];

    /**
     * The `ViewModelFieldPaths` instance for this record. This is a unique instance based on the actual
     * assigned fields and can be compared to other instances to determine if the same fields are set.
     */
    readonly _assignedFieldPaths: ViewModelFieldPaths<
        ViewModelConstructor<FieldMappingType, PkFieldType>
    >;
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

/**
 * @type-name ViewModel Class
 */
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
     * If you want all fields including primary key use `allFieldNames`
     */
    readonly fieldNames: Extract<keyof FieldMappingType, string>[];

    /**
     * Shortcut to get all field names including primary keys
     */
    readonly allFieldNames: Extract<keyof FieldMappingType, string>[];

    /**
     * Shortcut to get the names of all relation fields
     */
    readonly relationFieldNames: Extract<
        keyof ExtractRelatedFields<ViewModelConstructor<FieldMappingType, PkFieldType>>,
        string
    >[];

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
    cache: ViewModelCache<any>;
    // TODO: Previously had this as
    // cache: ViewModelCache<ViewModelConstructor<FieldMappingType, PkFieldType>>;
    // But caused issues with extending factory when descendant class had it's own methods
    // This approach had downside of really requiring you to define `cache` on the descendant
    // class to get proper typing - for Alliance purposes this is fine but not ideal for general case

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

/**
 * Binds the fields to a ViewModel class. On each field this attaches the `model` property, sets `name` and
 * generates a `label` if not explicitly set on the field.
 */
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

// These are methods or on the ViewModel instances so we can't allow any fields of these names
const reservedFieldNames = ['toJS', 'clone', 'isEqual'];

function checkReservedFieldNames(fields): void {
    reservedFieldNames.forEach(fieldName => {
        if (fields[fieldName]) {
            throw new Error(`${fieldName} is reserved and cannot be used as a field name`);
        }
    });
}

/**
 * Thrown when attempting to access a field that does not exist on a ViewModel
 */
export class InvalidFieldError extends Error {}

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

    const pkFieldNames = (
        typeof options.pkFieldName == 'string' ? [options.pkFieldName] : options.pkFieldName
    ) as string[];
    const allFieldNames = Object.keys(fields);
    allFieldNames.sort();
    const fieldNames = allFieldNames.filter(name => !pkFieldNames.includes(name));
    const relationFieldNames = allFieldNames.filter(
        fieldName => fields[fieldName] instanceof BaseRelatedViewModelField
    );

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
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return pkFieldNames;
            },
        },
        fields: {
            get(): FieldMappingType {
                return _bindFields(this);
            },
        },
        allFieldNames: {
            get(): string[] {
                return allFieldNames;
            },
        },
        fieldNames: {
            get(): string[] {
                return fieldNames;
            },
        },
        relationFieldNames: {
            get(): string[] {
                return relationFieldNames;
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
 * Type to describe a ViewModel instance with only some fields set
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
    FieldNames extends FieldPath<T> = ExtractFieldNames<T['fields']>
> = Omit<InstanceType<T>, ExtractFieldNames<T['fields']>> &
    ViewModelInterface<
        T['fields'],
        T['pkFieldName'],
        | ExtractRootFieldNames<T, FieldNames>
        | (T['pkFieldName'] extends string ? T['pkFieldName'] : T['pkFieldName'][number])
    >;

/**
 * Extracts the parseable type for primary key on a ViewModel
 */
export type ExtractPkFieldParseableValueType<T extends ViewModelConstructor<any, any>> =
    T['pkFieldName'] extends string
        ? T['fields'][T['pkFieldName']]['__parsableValueType']
        : { [K in T['pkFieldNames']]: T['fields'][K]['__parsableValueType'] };
