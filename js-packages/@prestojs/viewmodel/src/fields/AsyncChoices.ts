import { getId, getNodeLabel, isIdentifiable, isLabeled } from '@prestojs/util';

/**
 * A single choice
 */
export interface Choice<T> {
    /**
     * The value for the choices
     */
    value: T;
    /**
     * The label for the choice
     */
    label: React.ReactNode;
    /**
     * Any additional properties that might be returned on each choice by `getChoices`
     */
    [x: string]: any;
}
/**
 * Grouped choices - a label for the grouping and an array of choices for that label
 */
export type ChoicesGrouped<T> = [string, Choice<T>[]];

/**
 * Interface for asynchronous choices. If you wish to write a compatible class for
 * use with `asyncChoices` you must conform to this interface. See [AsyncChoices](doc:AsyncChoices)
 * for a concrete implementation that is suitable for most cases.
 *
 * A choice is a `value` that identifies the item (eg. an id) and a `label` that
 * describes the item and is shown to users (eg. the name).
 *
 * When `multiple` is true multiple values can be selected.
 *
 * To define async choices two things are required:
 *
 * 1) [A function to resolve existing value(s)](#Method-retrieve). This is used when viewing existing
 *    value(s) and need label(s) to show (e.g. when displaying a choice on a detail
 *    view or rendering the value selected on a select widget).
 * 2) [A function to list & filter the available choices](#Method-list). This is used when selecting
 *    a value (e.g. the options shown in a select widget).
 *
 * Both of these functions may need to store state (eg. pagination for a listing)
 * or access things from context (eg. read values from a cache). This can be done
 * via two hooks - `useListProps` and `useRetrieveProps`. These functions should be
 * called from a component or hook that deals with async choices when calling
 * `list` and `retrieve` respectively. The return value from the hook is passed to
 * the corresponding function.
 *
 * See [useAsyncChoices](doc:useAsyncChoices) for a React hook to use async choices.
 *
 * @extractdocs
 * @menugroup Async Choices
 * @typeParam ItemType The type of the item(s) return by `list` or `retrieve`.
 * @typeParam ValueType The type of the value that identifies an item (eg. it's id)
 */
export interface AsyncChoicesInterface<ItemType, ValueType> {
    /**
     * If true then multiple values can be selected. When this is true
     * retrieve() will be passed and return an array rather than a single value.
     */
    multiple: boolean;
    /**
     * Hook that returns any extra props to pass through to `list` in components/hooks that
     * consume this (eg. [useAsyncChoices](doc:useAsyncChoices)). This is useful to
     * store state for things like pagination.
     *
     * What this function is passed depends on the implementation but when used with
     * [useAsyncChoices](doc:useAsyncChoices) it will be `query` (the query object eg. to
     * filter results with) and `listOptions` (any additional options passed on the `listOptions`
     * prop to `useAsyncChoices`).
     * Official presto widgets all use `useAsyncChoices` and so will use these parameters.
     */
    useListProps(args: any): any;
    /**
     * Function to resolve a list of choices based on the provided params.
     *
     * What this function is passed depends on the implementation but when used with
     * [useAsyncChoices](doc:useAsyncChoices) it will be passed `query` (the query object eg. to
     * filter results with), `paginator` (the current paginator if any) and `listOptions` (any
     * additional options passed on the `listOptions` prop to `useAsyncChoices`).
     * Official presto widgets all use `useAsyncChoices` and so will use these parameters.
     */
    list(params: Record<string, any>): Promise<ItemType[]>;

    /**
     * Hook that returns props to pass through to `retrieve` in components/hooks that consume this (eg. [useAsyncChoices](doc:useAsyncChoices).
     * This is useful for things like hooking into an existing cache (eg. [useViewModelCache](doc:useViewModelCache)).
     * The value returned here is passed as the second parameter to `retrieve`. In addition the `existingValues` key is
     * passed through to `useAsyncValue` as the list of items it can resolve existing values from.
     *
     * What this function is passed depends on the implementation but when used with
     * [useAsyncChoices](doc:useAsyncChoices) it will be passed `id` if there's a current value
     * and it's not an array, `ids` if there's a current value and it is an array, `existingValues` which is
     * the values returned by `list` (may be null if `list` not yet called) and `retrieveOptions`
     * (any additional options passed on the `retrieveOptions` prop to `useAsyncChoices`).
     * Official presto widgets all use `useAsyncChoices` and so will use these parameters.
     */
    useRetrieveProps(args: any): any;

    /**
     * Function to resolve specific values. This is used to know how to render the label for a value(s).
     *
     * The first parameter is the value to retrieve (will be an array when `multiple` is true).
     *
     * `deps` is the value returned by `useRetrieveProps`.
     *
     * @param value The value(s) to retrieve. If `multiple` is true this will be an array.
     */
    retrieve(value: ValueType[] | ValueType, deps?: any): Promise<ItemType[] | ItemType>;

    /**
     * Generate the list of choices. This can return an array of single choices or grouped choices.
     *
     * A grouped choice is a 2 element Array with a label and a list of choices.
     *
     * A single choice looks like:
     *
     * ```js
     * const choice = {
     *     value: 1,
     *     label: "Item 1"
     * }
     * ```
     *
     * Grouped choices are an array of 2-tuples, the group label and choices for that label:
     *
     * ```js
     * const choicesGrouped = [["Group1", [{ value: 1, label: "Item 1"}, { value: 2, label: "Item 2"}]], ["Group 2", [{ value: 3, label: "Item 3"}]]]
     * ```
     *
     * @param items The items to extract choices from
     *
     * @returns Either an array of single choices or grouped choices.
     */
    getChoices(items: ItemType[]): (Choice<ValueType> | ChoicesGrouped<ValueType>)[];

    /**
     * Get a label for an item
     *
     * @param item The item to get a label for
     */
    getLabel(item: ItemType): React.ReactNode;

    /**
     * Return label to use when an item can't be found. This can be used by widgets to control
     * what is rendered when an item for a value cannot be found (eg. when it's deleted or
     * when it's loading). The exact details of how this is used depend on the widget.
     *
     * @param value The value to return the missing label for
     */
    getMissingLabel(value: ValueType): React.ReactNode;

    /**
     * Get the value to use for an item. The value should be unique and is what's used when a
     * choice is selected (e.g. it's the value that would be saved to a database).
     *
     * @param item The item to get the value for
     */
    getValue(item: ItemType): ValueType;

    /**
     * Given a value parse it into the expected type.
     *
     * For example, if the value comes in as a string (e.g. from a URL query parameter) then this could
     * parse the value as a `number` so it matches the id returned from the server.
     */
    parseValue(value: any): ValueType;

    /**
     * Resolve the specific instance of an item to use. By default, this should just return `item`
     * but can be used to resolve a specific instance of a class from a cache for example.
     */
    useResolveItems<T extends ItemType | ItemType[] | null>(item: T): T;
}

/**
 * @expandproperties
 */
export type AsyncChoicesOptions<ItemType, ValueType> = Omit<
    AsyncChoicesInterface<ItemType, ValueType>,
    | 'getChoices'
    | 'useListProps'
    | 'useRetrieveProps'
    | 'getMissingLabel'
    | 'getLabel'
    | 'getValue'
    | 'useResolveItems'
    | 'multiple'
    | 'parseValue'
> &
    Partial<
        Pick<
            AsyncChoicesInterface<ItemType, ValueType>,
            | 'getChoices'
            | 'useListProps'
            | 'useRetrieveProps'
            | 'getMissingLabel'
            | 'getLabel'
            | 'getValue'
            | 'useResolveItems'
            | 'multiple'
            | 'parseValue'
        >
    >;

/**
 * Default implementation for [AsyncChoicesInterface](doc:AsyncChoicesInterface)
 *
 * <Usage>
 *
 * You must provide `list` and `retrieve` - everything else can be optional with the following restrictions:
 *
 * * `getLabel` - this is optional if items returned by `list` and `retrieve` implement [NodeLabeled](doc:NodeLabeled) otherwise it must be provided
 * * `getValue` - this is optional if items returned by `list` and `retrieve` implement [Identifiable](doc:Identifiable) otherwise it must be provided
 *
 * For usage with `@prestojs/antd` see the [SelectAsyncChoicesWidget](doc:SelectAsyncChoicesWidget). For other usages
 * see the [useAsyncChoices](doc:useAsyncChoices) hook.
 *
 * See the below for some commented examples.
 *
 * </Usage>
 *
 * @extractdocs
 * @menugroup Async Choices
 * @typeParam ItemType The type of the item(s) return by `list` or `retrieve`.
 * @typeParam ValueType The type of the value that identifies an item (eg. it's id)
 */
class AsyncChoices<ItemType, ValueType> implements AsyncChoicesInterface<ItemType, ValueType> {
    options: AsyncChoicesOptions<ItemType, ValueType>;
    multiple: boolean;

    constructor(options: AsyncChoicesOptions<ItemType, ValueType>) {
        this.options = options;
        this.multiple = !!options.multiple;
    }
    useListProps(args: any): any {
        return this.options.useListProps?.call(this, args) || args;
    }
    list(params: Record<string, any>): Promise<ItemType[]> {
        return this.options.list.call(this, params);
    }
    useRetrieveProps(args: any): any {
        return this.options.useRetrieveProps?.call(this, args) || args;
    }

    retrieve(value: ValueType[] | ValueType, deps?: any): Promise<ItemType[] | ItemType> {
        return this.options.retrieve(value, deps);
    }

    getChoices(items: ItemType[]): (Choice<ValueType> | ChoicesGrouped<ValueType>)[] {
        if (this.options.getChoices) {
            return this.options.getChoices.call(this, items);
        }
        return items.map(item => ({
            label: this.getLabel(item),
            value: this.getValue(item),
        }));
    }
    getLabel(item: ItemType): React.ReactNode {
        if (this.options.getLabel) {
            return this.options.getLabel.call(this, item);
        }
        if (isLabeled(item)) {
            return getNodeLabel(item);
        }
        throw new Error(
            'getLabel must be provided to AsyncChoices if item does not provide a getLabel or getNodeLabel method'
        );
    }
    getMissingLabel(value: ValueType): React.ReactNode {
        if (this.options.getMissingLabel) {
            return this.options.getMissingLabel.call(this, value);
        }
        return String(value);
    }
    getValue(item: ItemType): ValueType {
        if (this.options.getValue) {
            return this.options.getValue.call(this, item);
        }
        if (isIdentifiable(item)) {
            return getId(item) as unknown as ValueType;
        }
        throw new Error(
            'getValue must be provided to AsyncChoices if item does not have a `_key` property'
        );
    }
    parseValue(value: any) {
        if (this.options.parseValue) {
            return this.options.parseValue.call(this, value);
        }
        return value;
    }
    useResolveItems<T extends ItemType | ItemType[] | null>(items: T): T {
        if (this.options.useResolveItems) {
            return this.options.useResolveItems.call(this, items);
        }
        return items;
    }
}

export default AsyncChoices;
