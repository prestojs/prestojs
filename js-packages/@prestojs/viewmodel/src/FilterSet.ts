import FieldBinder from './FieldBinder';

/**
 * Base Filterset class for filters to be applied to models. Shares commonality with ViewModels in sense that FilterSets
 * are also field based. Filter fields are usually part of backend model fields, but some of them might be calculated and
 * others not necessary exposed to frontend ViewModel, so it'll be independent of a given ViewModel.
 *
 * Currently serves the bare purpose of being a collection of Fields (ie. does not hold any data inside it)
 *
 * This should be extended and have relevant fields set on it:
 *
 * ```js
 * class UserFilterSet extends FilterSet {
 *     static _model = User;
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
export default class FilterSet extends FieldBinder {
    [fieldName: string]: any;

    constructor() {
        super();
        throw new Error(
            `${
                Object.getPrototypeOf(this).constructor.name
            }: FilterSet serves as a collection of fields and should not be instantized.`
        );
    }

    public static toString(): string {
        return this.name;
    }
}
