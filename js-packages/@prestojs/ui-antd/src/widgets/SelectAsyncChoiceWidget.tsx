import { InputProps, WidgetProps } from '@prestojs/ui/FieldWidgetInterface';
import { isEqual, Paginator } from '@prestojs/util';
import { AsyncChoicesInterface, Choice, useAsyncChoices } from '@prestojs/viewmodel';
import { Button, Select } from 'antd';
import { SelectProps } from 'antd/lib/select';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

type ValueType<T> = T[] | T | null;

type SelectInputProps<T> = InputProps<ValueType<T>, HTMLSelectElement> & {
    // Types in antd require event. Our types don't because final-form doesn't.
    onBlur: (event: React.FocusEvent<HTMLSelectElement>) => void;
    onFocus: (event: React.FocusEvent<HTMLSelectElement>) => void;
};

/**
 * @expand-properties Most [Select](https://ant.design/components/select/) props in addition to the below. Note the
 * following restrictions: `mode` is set to "multiple" when `asyncChoices.multiple` is `true`, `labelInValue` can't be
 * changed, `notFoundContent` is set to `loadingContent` when choices are resolving otherwise `notFoundContent`
 * @hide-properties meta
 */
export type SelectAsyncChoiceProps<T> = SelectProps<ValueType<T>> &
    Omit<WidgetProps<ValueType<T>, HTMLSelectElement>, 'choices' | 'asyncChoices'> & {
        /**
         * The [AsyncChoices](doc:AsyncChoicesInterface) instance to use.
         */
        asyncChoices: AsyncChoicesInterface<any, T>;
        /**
         * Number of milliseconds to debounce changes to search keywords before an API call
         * will be triggered. Set to 0 to disable.
         *
         * Defaults to `300`
         */
        debounceWait?: number;
        /**
         * Whether to call the Endpoint immediately when the select has not been opened (eg. before the
         * initial open and after it's closed when the search value is cleared)
         *
         * Defaults to `false`
         */
        triggerWhenClosed?: boolean;
        input: SelectInputProps<T>;
        /**
         * Content to show when the dropdown is open and in the loading state. This it passed through
         * to `notFoundContent` on [Select](https://ant.design/components/select/#API). If you pass through
         * `notFoundContent` it is only used when not in the loading state.
         *
         * Defaults to `'Fetching results...'`
         */
        loadingContent?: React.ReactNode;
        /**
         * Any extra props to pass through to [Select.Option](https://ant.design/components/select/#Option-props).
         * This can be useful for thing like passing className or ID's for testing, eg:
         * ```jsx
         * optionProps={{ 'data-testid': 'select-option' }}
         * ```
         */
        optionProps?: Record<string, any>;
        /**
         * Whether pages should be accumulated as more are fetched. This defaults to true and means
         * that whenever the next page is fetched it is appended to the bottom of the list.
         *
         * Defaults to `true`
         */
        accumulatePages?: boolean;
        /**
         * Function to render the button for fetching the next page of results.
         *
         * Function is passed an object with:
         * * `paginator` - the [Paginator](doc:Paginator) instance
         * * `isLoading` - whether the widget is currently in a loading state
         *
         * Can pass `false` to disable this functionality entirely.
         *
         * Note that this is always rendered within a [Select.Option](https://ant.design/components/select/#Option-props).
         * You can pass `nextPageOptionProps` to pass additional props to this eg. for styling.
         *
         * Defaults to:
         *
         * ```tsx
         * function defaultRenderNextPageButton({ isLoading, onClick }) {
         *   return (
         *     <Button loading={isLoading} block type="link" onClick={onClick}>
         *       Fetch More
         *     </Button>
         *   );
         * }
         * ```
         */
        renderNextPageButton?:
            | false
            | ((props: {
                  paginator: Paginator<any, any>;
                  isLoading: boolean;
                  onClick: (e: React.MouseEvent) => void;
              }) => React.ReactNode);
        /**
         * Any extra props to pass through to the [Select.Option](https://ant.design/components/select/#Option-props) that
         * wraps the next page button.
         *
         * This can be useful for thing like passing className or ID's for testing, eg:
         * ```jsx
         * nextPageOptionProps={{ 'data-testid': 'select-option-next-page' }}
         * ```
         */
        nextPageOptionProps?: Record<string, any>;
        /**
         * Function to build query object to pass through to `asyncChoices.list`.
         *
         * By default this will be an object containing a the current search keywords
         * under the key `keywords`.
         *
         * The function is passed an object containing
         * * `keywords` - the current search keywords
         * * `isOpen` - whether the select is open
         * * `input` - the current form input object. The current value can be extracted from this.
         *
         * Defaults to `({ keywords }) => ({ keywords })`
         */
        buildQuery?: (props: {
            keywords: string;
            isOpen: boolean;
            input: SelectInputProps<T>;
        }) => Record<string, any>;
        /**
         * If provided this function will be called whenever a value is successfully
         * resolved using `asyncChoices.retrieve`.
         */
        onRetrieveSuccess?: (response: T, props: { input: SelectInputProps<T> }) => void;
        /**
         * If provided this function will be called whenever `asyncChoices.retrieve` errors
         *
         * You can use this to do things like unset a value if it no longer exists.
         */
        onRetrieveError?: (error: Error, props: { input: SelectInputProps<T> }) => void;
        /**
         * Any extra options to pass through to [list](doc:AsyncChoicesInterface#method-list)
         *
         * These will be available in both [useListProps](doc:AsyncChoicesInterface#method-list) and [list](doc:AsyncChoicesInterface#method-useListProps) under the `listOptions`
         * key
         */
        listOptions?: Record<string, any>;
        /**
         * Any extra options to pass through to [retrieve](doc:AsyncChoicesInterface#method-retrieve)
         *
         * These will be available in both [useRetrieveProps](doc:AsyncChoicesInterface#method-retrieve) and [retrieve](doc:AsyncChoicesInterface#method-useRetrieveProps) under the `retrieveOptions`
         * key
         */
        retrieveOptions?: Record<string, any>;
        /**
         * Whether to clear and fetch fresh results when the drop down is opened after the initial fetch. If this is set to
         * false then the only time fresh results are fetched will be when the search filter changes or a new page of results
         * is retrieved.
         *
         * This defaults to `true`.
         */
        clearOnOpen?: boolean;
    };

type LabeledValue<T> = { key: T; label: React.ReactNode; found: boolean; missingLabel: boolean };

/**
 * Given a value `rawValue` this functions looks up the matching item in `allItems` and returns
 * the label using `asyncChoices.getLabel`.
 *
 * If the value was not found in `allItems` the `found` property will be `false` otherwise `true`.
 *
 * If `rawValue` is an array an array of labeled values will be returned.
 */
function getLabeledValue<T extends SelectAsyncChoiceWidgetValue, ItemType>(props: {
    rawValue: T;
    allItems: Choice<T>[];
    selected?: ItemType | null;
    asyncChoices: AsyncChoicesInterface<ItemType, T>;
}): LabeledValue<T>;
function getLabeledValue<T extends SelectAsyncChoiceWidgetValue, ItemType>(props: {
    rawValue: T[];
    allItems: Choice<T>[];
    selected?: ItemType[] | null;
    asyncChoices: AsyncChoicesInterface<ItemType, T>;
}): LabeledValue<T>[];
function getLabeledValue<T extends SelectAsyncChoiceWidgetValue, ItemType>(props: {
    rawValue: T | T[];
    allItems: Choice<T>[];
    selected?: ItemType | ItemType[] | null;
    asyncChoices: AsyncChoicesInterface<ItemType, T>;
}): LabeledValue<T> | LabeledValue<T>[] {
    const { rawValue, allItems, selected, asyncChoices } = props;
    if (Array.isArray(rawValue)) {
        const selectedById = ((selected || []) as ItemType[]).reduce(
            (acc: { [fieldName: string]: ItemType }, item) => {
                acc[asyncChoices.getValue(item)] = item;
                return acc;
            },
            {}
        );
        return rawValue.map(v =>
            getLabeledValue<T, ItemType>({
                rawValue: v,
                allItems,
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                selected: selectedById[v],
                asyncChoices,
            })
        );
    }
    const matchedItem = rawValue ? allItems.find(item => item.value === rawValue) : null;
    let label;
    let missingLabel = false;
    if (
        rawValue &&
        !matchedItem &&
        selected &&
        asyncChoices.getValue(selected as ItemType) === rawValue
    ) {
        label = asyncChoices.getLabel(selected as ItemType);
    } else if (rawValue) {
        missingLabel = !matchedItem;
        label = matchedItem ? matchedItem.label : asyncChoices.getMissingLabel(rawValue as T);
    }
    return {
        key: rawValue,
        label,
        found: !!matchedItem,
        missingLabel,
    };
}

function defaultRenderNextPageButton({ isLoading, onClick }): React.ReactNode {
    return (
        <Button loading={isLoading} block type="link" onClick={onClick}>
            Fetch More
        </Button>
    );
}

type SelectReducerState = { isOpen: boolean; keywords: string; internalKeywords: string };
type SelectReducerAction =
    | { type: 'open' }
    | { type: 'close' }
    | { type: 'setKeywords'; keywords: string }
    | { type: 'setInternalKeywords'; keywords: string };

function reducer(state: SelectReducerState, action: SelectReducerAction): SelectReducerState {
    switch (action.type) {
        case 'open':
            return { ...state, isOpen: true, keywords: '', internalKeywords: '' };
        case 'close':
            // Originally attempted to clear keywords on close... but that caused an infinite loop that
            // I was unable to track down. Clear them in 'open' instead.
            return { ...state, isOpen: false };
        case 'setKeywords':
            return { ...state, keywords: action.keywords };
        case 'setInternalKeywords':
            return { ...state, internalKeywords: action.keywords };
    }
}

type SelectAsyncChoiceWidgetValue = number | string;

// Pagination is handled by rendering a button within a Select.Option that triggers a fetch. This
// is the value used for that option. We can can prevent clicks on the option in case the button
// fails to stop propagation and prevent an invalid change from occurring
const NEXT_PAGE_VALUE = '__nextpage';

/**
 * A [Select](https://ant.design/components/select/) widget that handles [async choices](doc:AsyncChoicesInterface)
 *
 * @extract-docs
 * @forward-ref
 * @menu-group Widgets
 */
function SelectAsyncChoiceWidget<
    T extends SelectAsyncChoiceWidgetValue,
    Multiple extends boolean = T extends Array<any> ? true : false
>(props: SelectAsyncChoiceProps<T>, ref): React.ReactElement {
    const {
        input,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        meta,
        asyncChoices,
        clearOnOpen = true,
        debounceWait = 500,
        triggerWhenClosed = false,
        loadingContent = 'Fetching results...',
        optionProps = {},
        nextPageOptionProps = {},
        accumulatePages = true,
        renderNextPageButton = defaultRenderNextPageButton,
        buildQuery = ({ keywords }): {} => ({ keywords }),
        onRetrieveSuccess,
        onRetrieveError,
        listOptions,
        retrieveOptions,
        ...rest
    } = props;
    const [{ isOpen, keywords, internalKeywords }, dispatch] = useReducer(reducer, {
        isOpen: false,
        keywords: '',
        internalKeywords: '',
    });
    // Internal input state for keywords. This differs from 'keywords' in that 'keywords' are debounced but 'internalKeywords' are not
    const setInternalKeywords = (s): void => dispatch({ type: 'setInternalKeywords', keywords: s });
    // Track the last value set so we can use it's labels if we need to. This is necessary for the case where
    // values have been selected but then the list is further filtered such that the selected items are no
    // longer in the list of choices.
    const [lastValue, setLastValue] = useState<Choice<T>[]>([]);
    const setKeywords = (s): void => dispatch({ type: 'setKeywords', keywords: s });
    const { list, choices, selected } = useAsyncChoices<any, T>({
        asyncChoices,
        trigger: !isOpen && !triggerWhenClosed ? 'MANUAL' : 'DEEP',
        query: buildQuery({ keywords, input, isOpen }),
        accumulatePages,
        value: input.value,
        onRetrieveSuccess:
            onRetrieveSuccess &&
            ((response: T): void => {
                onRetrieveSuccess(response, { input });
            }),
        onRetrieveError:
            onRetrieveError &&
            ((error: Error): void => {
                onRetrieveError(error, { input });
            }),
        listOptions,
        retrieveOptions,
    });
    const listRef = useRef(list);
    listRef.current = list;
    useEffect(() => {
        // we use a ref for `list` as we only want this to do anything when `isOpen` changes to true
        if (isOpen && !listRef.current.isLoading && listRef.current.result && clearOnOpen) {
            listRef.current.reset();
            if (
                listRef.current.paginator &&
                !isEqual(
                    listRef.current.paginator.currentState,
                    listRef.current.paginator.firstState()
                )
            ) {
                // Reset paginator as well; this will cause a refetch
                listRef.current.paginator.first();
            } else {
                // If no paginator or paginator is already on first page manually trigger a fetch
                listRef.current.run();
            }
        }
    }, [accumulatePages, clearOnOpen, isOpen]);
    const { paginator } = list;
    const isLoading = list.isLoading || selected.isLoading;
    const debouncedSetKeywords = useMemo(
        () =>
            debounce(keywords => {
                setKeywords(keywords);
                if (paginator?.responseIsSet) {
                    paginator.first();
                }
            }, debounceWait),
        [paginator, debounceWait]
    );
    useEffect(() => {
        return (): void => {
            debouncedSetKeywords.cancel();
        };
    }, [debouncedSetKeywords]);
    const flattenedItems: Choice<T>[] =
        choices?.reduce((acc: Choice<T>[], itemOrGroupedItems) => {
            if (Array.isArray(itemOrGroupedItems)) {
                acc.push(...itemOrGroupedItems[1]);
            } else {
                acc.push(itemOrGroupedItems);
            }
            return acc;
        }, []) || [];
    // Add previously selected values to end. Array is searched in order for a label
    // - duplicates don't matter and first found value will be used. This is to handle
    // case where `choices` has been filtered by a search and no longer includes the
    // currently selected items.
    flattenedItems.push(...lastValue);
    const rawValue = input.value;
    let value;
    // When dealing with multi-select any existing values that are selected
    // but aren't in the returned data (eg. they aren't on the current page)
    // need to be shown regardless otherwise when you change selection it
    // will unselect them.
    const extraOptions: LabeledValue<T>[] = [];
    if (Array.isArray(rawValue)) {
        const labeledValues = getLabeledValue<T, any>({
            rawValue: rawValue as T[],
            allItems: flattenedItems,
            selected: selected?.value,
            asyncChoices,
        });
        value = [];
        for (const labeledValue of labeledValues) {
            value.push(labeledValue);
            if (!labeledValue.found) {
                extraOptions.push(labeledValue);
            }
        }
    } else if (rawValue != null && rawValue !== '') {
        value = getLabeledValue<T, any>({
            rawValue: rawValue as T,
            allItems: flattenedItems,
            selected: selected?.value,
            asyncChoices,
        });
    }
    const { onChange } = input;
    const wrappedOnChange = useCallback(
        (value: Choice<T> | Choice<T>[]) => {
            if (Array.isArray(value)) {
                setLastValue(value);
                return onChange(value.map(v => v.value));
            }
            if (value.value === NEXT_PAGE_VALUE) {
                // This catches the option wrapping the next page more button
                // It would be nice to do the next page selection here and not from the button as this
                // would allow usage of the keyboard... unfortunately not possible with Ant Select as
                // it closes the dropdown on selection and there's no way that I found to prevent this
                // from happening.
                return;
            }
            setLastValue([value]);
            return onChange(value.value);
        },
        [onChange]
    );

    const isMissingLabel =
        value && (Array.isArray(value) ? value.some(v => v.missingLabel) : value.missingLabel);
    return (
        <Select
            mode={asyncChoices.multiple ? 'multiple' : undefined}
            ref={ref}
            open={isOpen}
            onDropdownVisibleChange={(isOpen): void => {
                dispatch({ type: isOpen ? 'open' : 'close' });
            }}
            loading={isLoading}
            showSearch
            onSearch={(k: string): void => {
                if (!isOpen) {
                    return;
                }
                setInternalKeywords(k);
                (debounceWait === 0 ? setKeywords : debouncedSetKeywords)(k);
            }}
            filterOption={false}
            disabled={!isOpen && selected.isLoading}
            {...rest}
            onChange={wrappedOnChange}
            labelInValue
            // if label is missing and is currently attempting to resolve the label don't render
            // anything - this avoids showing the missing label value (eg. the raw id) unnecessarily
            value={isMissingLabel && selected.isLoading ? undefined : value}
            notFoundContent={isLoading ? loadingContent : rest.notFoundContent}
            searchValue={internalKeywords}
        >
            {extraOptions.map(option => (
                <Select.Option key={option.key.toString()} value={option.key} {...optionProps}>
                    {option.label}
                </Select.Option>
            ))}
            {choices &&
                choices.map(choiceOrGroupedChoices => {
                    if (Array.isArray(choiceOrGroupedChoices)) {
                        const [label, choices] = choiceOrGroupedChoices;
                        return (
                            <Select.OptGroup key={label} label={label}>
                                {choices.map(({ label, value }) => (
                                    <Select.Option
                                        key={value?.toString()}
                                        value={value as any}
                                        {...optionProps}
                                    >
                                        {label}
                                    </Select.Option>
                                ))}
                            </Select.OptGroup>
                        );
                    }
                    const { label, value } = choiceOrGroupedChoices;
                    return (
                        <Select.Option
                            key={value?.toString()}
                            value={value as any}
                            {...optionProps}
                        >
                            {label}
                        </Select.Option>
                    );
                })}
            {choices &&
                renderNextPageButton &&
                choices.length > 0 &&
                paginator?.responseIsSet &&
                paginator?.hasNextPage() && (
                    <Select.Option
                        key={NEXT_PAGE_VALUE}
                        value={NEXT_PAGE_VALUE}
                        style={{ padding: 0 }}
                        {...nextPageOptionProps}
                    >
                        {renderNextPageButton({
                            isLoading,
                            paginator,
                            onClick: (e): void => {
                                e.stopPropagation();
                                paginator.next();
                            },
                        })}
                    </Select.Option>
                )}
        </Select>
    );
}

export default React.forwardRef(SelectAsyncChoiceWidget);
