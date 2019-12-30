import isEqual from 'lodash/isEqual';

import { EndpointExecuteOptions } from './Endpoint';

type PaginationState = Record<string, any>;

type PaginationSetState = (currentState: PaginationState) => PaginationState;
export type PaginationStateChangeListener = (state: PaginationState) => void;

export interface PaginatorInterface {
    getRequestInit(options: EndpointExecuteOptions): EndpointExecuteOptions;

    setResponse(response: Record<string, any>): void;

    syncState(state): void;
}

export interface PaginatorInterfaceClass extends Function {
    new (...args: any[]): PaginatorInterface;
}

export default class Paginator implements PaginatorInterface {
    // There exists 2 kinds of state on a paginator - the parameters that get sent with the request
    // (currentState) and any relevant values returned in the response (eg. the total number of records
    // or the next cursor etc). Response related values are stored directly on the paginator everything
    // else is stored in `currentState`.
    currentState: PaginationState;

    // If specified will be called whenever `currentState` changes. The intended usage of this is to
    // trigger a new request when pagination details change.
    onChange?: PaginationStateChangeListener;

    constructor(initialState: PaginationState, onChange?: PaginationStateChangeListener) {
        this.currentState = initialState;
        this.onChange = onChange;
    }

    setState(setter: PaginationSetState): void {
        if (typeof setter !== 'function') {
            throw new Error(
                'You must pass a function to setState. This is passed the current state and you should return the new state to set.'
            );
        }
        const previousState = this.currentState;
        const nextState = setter(this.currentState);
        if (!isEqual(previousState, nextState)) {
            this.currentState = nextState;
            if (this.onChange) {
                this.onChange(this.currentState);
            }
        }
    }

    getRequestInit(options: EndpointExecuteOptions): EndpointExecuteOptions {
        throw new Error('Not implemented');
    }

    setResponse(response: Record<string, any>): void {
        throw new Error('Not implemented');
    }

    syncState(state): void {
        throw new Error('Not implemented');
    }
}
