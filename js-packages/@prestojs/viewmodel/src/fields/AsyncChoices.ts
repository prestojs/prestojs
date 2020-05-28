export type Choice<T> = {
    value: T;
    label: React.ReactNode;
    [x: string]: any;
};
export type ChoicesGrouped<T> = [string, Choice<T>[]];
type ChoiceValue = any;

type IfArray<T, Then, Else> = T extends Array<any> ? Then : Else;

type Unwrap<T> = T extends Array<infer U> ? U : T;

export interface AsyncChoicesInterface<ItemType, ValueType> {
    multiple: ValueType extends Array<any> ? true : false;
    useListDeps: (args: any) => any;
    list(params: Record<string, any>, deps?: any): Promise<Unwrap<ItemType>[]>;
    useRetrieveDeps: (args: any) => any;
    retrieve(
        value: ValueType,
        deps?: any
    ): Promise<IfArray<ValueType, Unwrap<ItemType>[], ItemType>>;
    getChoices(items: Unwrap<ItemType>[]): (Choice<ValueType> | ChoicesGrouped<ValueType>)[];
    getLabel(item: Unwrap<ItemType>): React.ReactNode;
    getValue(item: Unwrap<ItemType>): ChoiceValue;
}

type AsyncChoicesOptions<ItemType, ValueType> = Omit<
    AsyncChoicesInterface<ItemType, ValueType>,
    'getChoices'
> &
    Partial<
        Pick<
            AsyncChoicesInterface<ItemType, ValueType>,
            'getChoices' | 'useListDeps' | 'useRetrieveDeps'
        >
    >;

class AsyncChoices<ItemType, ValueType> implements AsyncChoicesInterface<ItemType, ValueType> {
    options: AsyncChoicesOptions<ItemType, ValueType>;
    multiple: ValueType extends Array<any> ? true : false;

    constructor(options: AsyncChoicesInterface<ItemType, ValueType>) {
        this.options = options;
        this.multiple = options.multiple;
    }
    useListDeps(args: any): any {
        return this.options.useListDeps?.(args) || null;
    }
    list(params: Record<string, any>, deps?: any): Promise<Unwrap<ItemType>[]> {
        return this.options.list(params, deps);
    }
    useRetrieveDeps(args: any): any {
        return this.options.useRetrieveDeps?.(args) || null;
    }
    retrieve(
        value: ChoiceValue | ChoiceValue[],
        deps?: any
    ): Promise<IfArray<ValueType, Unwrap<ItemType>[], ItemType>> {
        return this.options.retrieve(value, deps);
    }
    getChoices(
        items: (ItemType extends Array<infer T> ? T : ItemType)[]
    ): (Choice<ValueType> | ChoicesGrouped<ValueType>)[] {
        if (this.options.getChoices) {
            return this.options.getChoices(items);
        }
        return items.map(item => ({
            label: this.getLabel(item),
            value: this.getValue(item),
        }));
    }
    getLabel(item: Unwrap<ItemType>): React.ReactNode {
        return this.options.getLabel(item);
    }
    getValue(item: Unwrap<ItemType>): ChoiceValue {
        return this.options.getValue(item);
    }
}

export default AsyncChoices;
