import { isViewModelClass, ViewModelConstructor, ViewModelInterface } from '../ViewModelFactory';
import Field, { FieldProps } from './Field';

type RelatedViewModelFieldProps<T extends ViewModelConstructor<any>> = FieldProps<
    ViewModelInterface<T['fields'], any, T['__pkFieldType'], T['__pkType']>
> & {
    sourceFieldName: string;
    to: (() => Promise<T> | T) | T;
};

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
 * User.cache.get(['name', 'group', ['group', 'owner'], ['group', 'owner', 'group']);
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
 * `to` can also be a a function that returns a Promise. This is useful to
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
 * @extract-docs
 * @menu-group Fields
 */
export default class RelatedViewModelField<
    T extends ViewModelConstructor<any> = ViewModelConstructor<any>
> extends Field<
    ViewModelInterface<T['fields'], any, T['__pkFieldType'], T['__pkType']>,
    {
        [K in keyof T['fields']]?: T['fields'][K]['__parsableValueType'];
    }
> {
    private _loadTo: () => Promise<T> | T;
    private _resolvedTo: T;
    private _resolvingTo?: Promise<T>;
    sourceFieldName: string;

    constructor({ to, sourceFieldName, ...values }: RelatedViewModelFieldProps<T>) {
        super(values);
        if (isViewModelClass(to)) {
            this._resolvedTo = to;
        } else {
            this._loadTo = to;
        }
        this.sourceFieldName = sourceFieldName;
    }

    contributeToClass(viewModel: T): void {
        if (!viewModel.fields[this.sourceFieldName]) {
            throw new Error(
                `Specified sourceFieldName '${this.sourceFieldName}' does not exist on model. Either add the missing field or change 'sourceFieldName' to the correct field.`
            );
        }
    }

    _isResolvingDeps = false;
    /**
     * Resolves the ViewModel this field links to. This is necessary as the ViewModel might be a dynamic
     * import that hasn't yet loaded.
     *
     * This needs to be called manually before `to` can be accessed.
     */
    resolveViewModel(): Promise<T> {
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
                                r.fields[fieldName] instanceof RelatedViewModelField &&
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

    normalize(value): ViewModelInterface<T['fields'], any, T['__pkFieldType'], T['__pkType']> {
        if (value && !(value instanceof this.to)) {
            return new this.to(value);
        }
        return value;
    }

    isEqual(
        value1: ViewModelInterface<T['fields'], any, T['__pkFieldType'], T['__pkType']>,
        value2: ViewModelInterface<T['fields'], any, T['__pkFieldType'], T['__pkType']>
    ): boolean {
        if (!value1) {
            return value1 === value2;
        }
        return value1.isEqual(value2);
    }

    toJS(
        value: ViewModelInterface<T['fields'], any, T['__pkFieldType'], T['__pkType']>
    ): Record<string, any> {
        if (!value) {
            return value;
        }
        return value.toJS();
    }

    get to(): T {
        if (!this._resolvedTo) {
            if (this._resolvingTo) {
                throw new Error(
                    `${this.model.name}.fields.${this.name}.resolveViewModel() has been called but hasn't yet resolved. Did you forgot to wait for the promise to resolve?`
                );
            }
            const maybeViewModel = this._loadTo();
            if (isViewModelClass(maybeViewModel)) {
                this._resolvedTo = maybeViewModel;
            } else {
                throw new Error(
                    `Call ${this.model.name}.fields.${this.name}.resolveViewModel() first`
                );
            }
        }
        return this._resolvedTo;
    }
}
