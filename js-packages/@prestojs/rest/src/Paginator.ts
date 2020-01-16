import isEqual from 'lodash/isEqual';

import { EndpointExecuteOptions } from './Endpoint';

type PaginationState = Record<string, any>;

type PaginationSetState = (currentState: PaginationState) => PaginationState;

export interface PaginatorInterface {
    getRequestInit(options: EndpointExecuteOptions): EndpointExecuteOptions;

    setResponse(response: Record<string, any>): void;
}

export interface PaginatorInterfaceClass extends Function {
    new (...args: any[]): PaginatorInterface;
}

export default class Paginator<State, InternalState> implements PaginatorInterface {
    currentState: State;
    internalState: InternalState;
    setCurrentState: (set: State) => void;
    setInternalState: (set: InternalState) => void;

    constructor([currentState, setCurrentState], [internalState, setInternalState]) {
        this.currentState = currentState || {};
        this.setCurrentState = setCurrentState;
        this.internalState = internalState || {};
        this.setInternalState = setInternalState;
    }

    getRequestInit(options: EndpointExecuteOptions): EndpointExecuteOptions {
        throw new Error('Not implemented');
    }

    setResponse(response: Record<string, any>): void {
        throw new Error('Not implemented');
    }
}
