import { isEqual } from '@prestojs/util';
import ViewModelCache from '../ViewModelCache';
import { FieldDataMappingRaw, isViewModelClass, ViewModelConstructor } from '../ViewModelFactory';
import Field, { FieldProps } from './Field';
import ListField from './ListField';

type RelatedViewModelValueType<TargetViewModelT extends ViewModelConstructor<any, any>> =
    InstanceType<TargetViewModelT>;

type BaseRelatedViewModelValueType<T extends ViewModelConstructor<any, any>> =
    | RelatedViewModelValueType<T>
    | RelatedViewModelValueType<T>[];
type RelatedViewModelParsableType<T extends ViewModelConstructor<any, any>> =
    | FieldDataMappingRaw<T['fields']>
    | FieldDataMappingRaw<T['fields']>[];

/**
 * @expand-properties
 */
type RelatedViewModelFieldProps<
    TargetViewModelT extends ViewModelConstructor<any, any>,
    FieldValueT,
    SourceFieldNameT extends string
> = FieldProps<FieldValueT> & {
    /**
     * The name of the field on the [ViewModel](doc:viewModelFactory) that stores the
     * ID for this relation
     */
    sourceFieldName: SourceFieldNameT;
    /**
     * Either a [ViewModel](doc:viewModelFactory), a function that returns a [ViewModel](doc:viewModelFactory)
     * or a function that returns a `Promise` that resolves to a [ViewModel](doc:viewModelFactory).
     */
    to: (() => Promise<TargetViewModelT> | TargetViewModelT) | TargetViewModelT;
    /**
     * The cache to use to retrieve related records from. Uses the default model cache if not specified.
     */
    cache?: ViewModelCache<TargetViewModelT>;
};

export class UnresolvedRelatedViewModelFieldError<
    TargetViewModelT extends ViewModelConstructor<any, any>,
    FieldValueT extends BaseRelatedViewModelValueType<TargetViewModelT>,
    ParsableValueT extends RelatedViewModelParsableType<TargetViewModelT>
> extends Error {
    field: BaseRelatedViewModelField<TargetViewModelT, FieldValueT, ParsableValueT>;
    constructor(
        field: BaseRelatedViewModelField<TargetViewModelT, FieldValueT, ParsableValueT>,
        message
    ) {
        super(message);
        this.field = field;
    }
}

/**
 * We split into RelatedViewModelField (for single records) and ManyRelatedViewModelField (for multiple records)
 * mainly to making typing easier.
 *
 * Use `ManyRelatedViewModelField` if `sourceFieldName` refers to a `ListField` otherwise `RelatedViewModelField`.
 */
export abstract class BaseRelatedViewModelField<
    TargetViewModelT extends ViewModelConstructor<any, any>,
    FieldValueT extends BaseRelatedViewModelValueType<TargetViewModelT>,
    ParsableValueT extends RelatedViewModelParsableType<TargetViewModelT>,
    // This exists so we can infer the field name for the id to include when
    SourceFieldNameT extends string = string
> extends Field<FieldValueT, ParsableValueT> {
    private _loadTo: () => Promise<TargetViewModelT> | TargetViewModelT;
    private _resolvedTo: TargetViewModelT;
    private _resolvingTo?: Promise<TargetViewModelT>;
    private _cache?: ViewModelCache<TargetViewModelT>;
    sourceFieldName: SourceFieldNameT;
    sourceField: Field<any>;

    get many(): boolean {
        return this.sourceField instanceof ListField;
    }

    constructor(
        props: RelatedViewModelFieldProps<TargetViewModelT, FieldValueT, SourceFieldNameT>
    ) {
        const { to, sourceFieldName, cache, ...fieldProps } = props;
        super(fieldProps);
        this._cache = cache;
        if (isViewModelClass(to)) {
            this._resolvedTo = to;
        } else {
            this._loadTo = to;
        }
        this.sourceFieldName = sourceFieldName;
        this._isResolvingDeps = false;
    }

    /**
     * @private
     */
    contributeToClass(viewModel: TargetViewModelT): void {
        if (!viewModel.fields[this.sourceFieldName]) {
            throw new Error(
                `Specified sourceFieldName '${this.sourceFieldName}' does not exist on model. Either add the missing field or change 'sourceFieldName' to the correct field.`
            );
        }
        this.sourceField = viewModel.fields[this.sourceFieldName];
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (this.many && !(this instanceof ManyRelatedViewModelField)) {
            throw new Error(
                'When `sourceFieldName` refers to a `ListField` you must use `ManyRelatedViewModelField` instead of `RelatedViewModelField`'
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (!this.many && this instanceof ManyRelatedViewModelField) {
            throw new Error(
                '`ManyRelatedViewModelField` must specify a `ListField` in `sourceFieldName`. For other field types use `RelatedViewModelField`.'
            );
        }
    }

    _isResolvingDeps: boolean;

    /**
     * Resolves the ViewModel this field links to. This is necessary as the ViewModel might be a dynamic
     * import that hasn't yet loaded.
     *
     * This needs to be called manually before `to` can be accessed.
     */
    resolveViewModel(): Promise<TargetViewModelT> {
        if (this._resolvedTo) {
            return Promise.resolve(this._resolvedTo);
        }
        if (!this._resolvingTo) {
            const maybeViewModel = this._loadTo();
            if (isViewModelClass(maybeViewModel)) {
                this._resolvedTo = maybeViewModel;
                return Promise.resolve(maybeViewModel);
            }
            this._resolvingTo = maybeViewModel.then(async r => {
                this._isResolvingDeps = true;
                // Resolve all dependencies of dependencies
                await Promise.all(
                    r.fieldNames
                        .filter(
                            fieldName =>
                                r.fields[fieldName] instanceof BaseRelatedViewModelField &&
                                // This avoids lock when there is a circular dep
                                !r.fields[fieldName]._isResolvingDeps
                        )
                        .map(fieldName => r.fields[fieldName].resolveViewModel())
                );
                this._isResolvingDeps = false;
                this._resolvedTo = r;
                return r;
            });
        }
        return this._resolvingTo;
    }

    /**
     * Compares to relations for equality - if the ViewModel has the same data this returns true
     */
    isEqual(value1: FieldValueT, value2: FieldValueT): boolean {
        return isEqual(value1, value2);
    }

    /**
     * Get the [ViewModel](doc:viewModelFactory) this related field is to.
     *
     * If `to` was defined as a function returning a `Promise` then you must call `resolveViewModel`
     * and wait for the returned `Promise` to resolve before accessing this otherwise an error will be thrown
     */
    get to(): TargetViewModelT {
        if (!this._resolvedTo) {
            if (this._resolvingTo) {
                throw new UnresolvedRelatedViewModelFieldError(
                    this,
                    `${this.model.name}.fields.${this.name}.resolveViewModel() has been called but hasn't yet resolved. Did you forgot to wait for the promise to resolve?`
                );
            }
            const maybeViewModel = this._loadTo();
            if (isViewModelClass(maybeViewModel)) {
                this._resolvedTo = maybeViewModel;
            } else {
                throw new UnresolvedRelatedViewModelFieldError(
                    this,
                    `Call ${this.model.name}.fields.${this.name}.resolveViewModel() first`
                );
            }
        }
        return this._resolvedTo;
    }

    get cache(): ViewModelCache<TargetViewModelT> {
        if (this._cache) {
            return this._cache;
        }
        return this.to.cache as unknown as ViewModelCache<TargetViewModelT>;
    }
}

/**
 * Define a field that references another ViewModel
 *
 * This requires two things:
 *
 * 1) The ViewModel to reference
 * 2) The field on the source ViewModel that contains the ID for the relation
 *
 * In the following example `User` has a `Group` as a relation. The id for the
 * connected group is stored on the `groupId` field:
 *
 * ```js
 * class Group extends viewModelFactory({
 *   name: new CharField(),
 * }) {}
 * class User extends viewModelFactory({
 *   name: new CharField(),
 *   groupId: new IntegerField(),
 *   group: new RelatedViewModelField({
 *     to: Group,
 *     sourceFieldName: 'groupId',
 *   }),
 * }) {}
 * ```
 *
 * You can then fetch the data - including the relations - from the cache:
 *
 * ```js
 * Group.cache.add({ id: 1, name: 'Staff' });
 * User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
 * User.cache.get(['name', 'group']);
 * // { id: 1, name: 'Bob', groupId: 1, group: { id: 1, name: 'Staff' }}
 * ```
 *
 * The `to` field can also be a function to support circular references:
 *
 * ```js
 * class Group extends viewModelFactory({
 *   name: new CharField(),
 *   ownerId: new IntegerField(),
 *   owner: new RelatedViewModelField({
 *     to: () => User,
 *     sourceFieldName: 'ownerId',
 *   }),
 * }) {}
 * class User extends viewModelFactory({
 *   name: new CharField(),
 *   groupId: new IntegerField(),
 *   group: new RelatedViewModelField({
 *     to: Group,
 *     sourceFieldName: 'groupId',
 *   }),
 * }) {}
 * ```
 *
 * You can query the circular relations as deep as you want:
 *
 * ```js
 * Group.cache.add({ id: 1, name: 'Staff', ownerId: 1 });
 * User.cache.add({ id: 1, name: 'Bob', groupId: 1 });
 * User.cache.get(['name', 'group', ['group', 'owner'], ['group', 'owner', 'group']]);
 * // {
 * //   id: 1,
 * //   name: 'Bob',
 * //   groupId: 1,
 * //   group: {
 * //     id: 1,
 * //     name: 'Staff',
 * //     ownerId: 1,
 * //     owner: {
 * //       id: 1,
 * //       name: 'Bob',
 * //       groupId: 1,
 * //       group: {
 * //         id: 1,
 * //         name: 'Staff',
 * //         ownerId: 1,
 * //       }
 * //     },
 * //   },
 * // }
 * ```
 *
 * `to` can also be a function that returns a Promise. This is useful to
 * lazy load modules:
 *
 * ```js
 * class Subscription extends viewModelFactory({
 *   userId: new IntegerField(),
 *   user: new RelatedViewModelField({
 *       sourceFieldName: 'userId',
 *       to: async () => {
 *         const User = await import('./User').default;
 *         return User;
 *       }
 *   })
 * }) {}
 * ```
 *
 * **NOTE:** When you return a promise you have to call `resolveViewModel` on
 * that field before it's usable:
 *
 * ```js
 * await Subscription.fields.user.resolveViewModel()
 * ```
 *
 * Failure to do this will result in an error being thrown the first time it's accessed.
 *
 * If you have multiple values use [ManyRelatedViewModelField](doc:ManyRelatedViewModelField) instead.
 *
 * @extract-docs
 * @menu-group Fields
 */
export class RelatedViewModelField<
    TargetViewModelT extends ViewModelConstructor<any, any>,
    SourceFieldNameT extends string = string
> extends BaseRelatedViewModelField<
    TargetViewModelT,
    RelatedViewModelValueType<TargetViewModelT>,
    FieldDataMappingRaw<TargetViewModelT['fields']>,
    SourceFieldNameT
> {
    static fieldClassName = 'RelatedViewModelField';
    /**
     * Converts a value into the relations [ViewModel](doc:viewModelFactory) instance.
     */
    normalize(value): RelatedViewModelValueType<TargetViewModelT> {
        if (!value) {
            return value;
        }
        if (!(value instanceof this.to)) {
            return new this.to(value) as RelatedViewModelValueType<TargetViewModelT>;
        }
        return value as RelatedViewModelValueType<TargetViewModelT>;
    }

    /**
     * Converts the linked record to a plain javascript object
     */
    toJS(value: RelatedViewModelValueType<TargetViewModelT>): Record<string, any> {
        if (!value) {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map(v => v.toJS());
        }
        return value.toJS();
    }
}

/**
 * Define a field that contains multiple records from another ViewModel
 *
 * This behaves the same as [RelatedViewModelField](doc:RelatedViewModelField) but `sourceFieldName`
 * must refer to a [ListField](doc:ListField) and all values are an array instead of a single value.
 *
 * @extract-docs
 * @menu-group Fields
 */
export class ManyRelatedViewModelField<
    TargetViewModelT extends ViewModelConstructor<any, any>,
    SourceFieldNameT extends string = string
> extends BaseRelatedViewModelField<
    TargetViewModelT,
    RelatedViewModelValueType<TargetViewModelT>[],
    FieldDataMappingRaw<TargetViewModelT['fields']>[],
    SourceFieldNameT
> {
    static fieldClassName = 'ManyRelatedViewModelField';
    /**
     * Converts a value into the relations [ViewModel](doc:viewModelFactory) instance.
     */
    normalize(value): RelatedViewModelValueType<TargetViewModelT>[] {
        if (!value) {
            return value;
        }
        if (!Array.isArray(value)) {
            throw new Error(
                `The source field (${this.sourceFieldName}) for ${this.name} is a ListField so the value passed to normalize must be an array. Received: ${value}`
            );
        }
        return value.map(v => {
            if (!(v instanceof this.to)) {
                return new this.to(v) as RelatedViewModelValueType<TargetViewModelT>;
            }
            return v as RelatedViewModelValueType<TargetViewModelT>;
        });
    }

    /**
     * Converts the linked record to a plain javascript object
     */
    toJS(value: RelatedViewModelValueType<TargetViewModelT>[]): Record<string, any> {
        if (!value) {
            return value;
        }
        return value.map(v => v.toJS());
    }
}
