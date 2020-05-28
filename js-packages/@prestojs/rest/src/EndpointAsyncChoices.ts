// @ts-ignore-start
import { AsyncChoices, Choice, ChoicesGrouped, UseChoicesReturn } from '@prestojs/viewmodel';
import { UseChoicesProps } from '@prestojs/viewmodel/fields/AsyncChoices';
import Endpoint from './Endpoint';
import useAsyncLookup from './useAsyncLookup';
import useAsyncValue from './useAsyncValue';
import usePaginator from './usePaginator';

type EndpointAsyncChoicesOptions<T> = {
    getLabel(item: T): React.ReactNode;
    getValue(item: T): string | number;
    getChoices?: (items: T[]) => (Choice | ChoicesGrouped)[];
};

export default class EndpointAsyncChoices<T = any> implements AsyncChoices<T> {
    endpoint: Endpoint<T>;
    options: EndpointAsyncChoicesOptions<T>;
    constructor(endpoint: Endpoint<T>, options: EndpointAsyncChoicesOptions<T>) {
        this.endpoint = endpoint;
        this.options = options;
    }
    // TODO: Return errors?
    useChoices({
        currentValue,
        disabled = false,
        query,
        accumulatePages = false,
    }: UseChoicesProps = {}): UseChoicesReturn {
        const paginator = usePaginator(this.endpoint);
        const result = useAsyncLookup({
            trigger: disabled ? 'MANUAL' : 'SHALLOW',
            query,
            accumulatePages,
            execute: async props => (await this.endpoint.execute(props)).result,
            paginator,
        });
        const currentValueResolved = useAsyncValue({
            existingValues: result.result,
            id: currentValue || null,
            resolve: async id => {
                let query;
                if (Array.isArray(id)) {
                    query = { ids: id };
                } else {
                    query = { id: id };
                }
                let paginator;
                const paginatorClass = this.endpoint.getPaginatorClass();
                if (paginatorClass) {
                    const noop = (): void => undefined;
                    paginator = new paginatorClass([{}, noop], [{}, noop]);
                }
                const r = await this.endpoint.execute({ query, paginator });
                if (!Array.isArray(id)) {
                    return r.result?.[0];
                }
                return r.result;
            },
        });
        return {
            ...result,
            items: this.getChoices(result.result || []),
            currentValue: currentValueResolved,
        };
    }

    getChoices(items: T[]): (Choice | ChoicesGrouped)[] {
        if (this.options.getChoices) {
            return this.options.getChoices(items);
        }
        return items.map(item => ({
            label: this.getLabel(item),
            value: this.getValue(item),
        }));
    }

    async retrieve(id): Promise<T | null> {
        let query;
        if (Array.isArray(id)) {
            query = { ids: id };
        } else {
            query = { id: id };
        }
        let paginator;
        const paginatorClass = this.endpoint.getPaginatorClass();
        if (paginatorClass) {
            const noop = (): void => undefined;
            paginator = new paginatorClass([{}, noop], [{}, noop]);
        }
        const r = await this.endpoint.execute({ query, paginator });
        if (!Array.isArray(id)) {
            return r.result?.[0];
        }
        return r.result;
    }
    getLabel(item: T): React.ReactNode {
        return this.options.getLabel(item);
    }
    getValue(item: T): string | number {
        return this.options.getValue(item);
    }
}
