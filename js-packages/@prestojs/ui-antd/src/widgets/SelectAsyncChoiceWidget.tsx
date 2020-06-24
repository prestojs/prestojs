import { InputProps, WidgetProps } from '@prestojs/ui/FieldWidgetInterface';
import { Paginator } from '@prestojs/util';
import { AsyncChoicesInterface, Choice, useAsyncChoices } from '@prestojs/viewmodel';
import { Button, Select } from 'antd';
import { SelectProps } from 'antd/lib/select';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

type ValueType<T, Multiple extends boolean> = (Multiple extends true ? T[] : T) | null;

type SelectInputProps<T, Multiple extends boolean> = InputProps<
    ValueType<T, Multiple>,
    HTMLSelectElement
> & {
    // Types in antd require event. Our types don't because final-form doesn't.
    onBlur: (event: React.FocusEvent<HTMLSelectElement>) => void;
    onFocus: (event: React.FocusEvent<HTMLSelectElement>) => void;
};

/**
 * @expand-properties Most [Select](https://next.ant.design/components/select/) props in addition to the below. Note the
 * following restrictions: `mode` is set to "multiple" when `asyncChoices.multiple` is `true`, `labelInValue` can't be
 * changed, `notFoundContent` is set to `loadingContent` when choices are resolving otherwise `notFoundContent`
 * @hide-properties meta
 */
export type SelectAsyncChoiceProps<T, Multiple extends boolean> = SelectProps<
    ValueType<T, Multiple>
> &
    Omit<WidgetProps<ValueType<T, Multiple>, HTMLSelectElement>, 'choices' | 'asyncChoices'> & {
        /**
         * The [AsyncChoices](doc:AsyncChoicesInterface) instance to use.
         */
        asyncChoices: AsyncChoicesInterface<any, T, Multiple>;
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
        input: SelectInputProps<T, Multiple>;
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
            input: SelectInputProps<T, Multiple>;
        }) => Record<string, any>;
        /**
         * If provided this function will be called whenever a value is successfully
         * resolved using `asyncChoices.retrieve`.
         */
        onRetrieveSuccess?: (response: T, props: { input: SelectInputProps<T, Multiple> }) => void;
        /**
         * If provided this function will be called whenever `asyncChoices.retrieve` errors
         *
         * You can use this to do things like unset a value if it no longer exists.
         */
        onRetrieveError?: (error: Error, props: { input: SelectInputProps<T, Multiple> }) => void;
        /**
         * Any extra options to pass through to [list](doc:AsyncChoicesInterface#method-list)
         *
         * These will be available in both [useListDeps](doc:AsyncChoicesInterface#method-list) and [list](doc:AsyncChoicesInterface#method-useListDeps) under the `listOptions`
         * key
         */
        listOptions?: Record<string, any>;
        /**
         * Any extra options to pass through to [retrieve](doc:AsyncChoicesInterface#method-retrieve)
         *
         * These will be available in both [useRetrieveDeps](doc:AsyncChoicesInterface#method-retrieve) and [retrieve](doc:AsyncChoicesInterface#method-useRetrieveDeps) under the `retrieveOptions`
         * key
         */
        retrieveOptions?: Record<string, any>;
    };

type LabeledValue<T> = { key: T; label: React.ReactNode; found: boolean };

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
    asyncChoices: AsyncChoicesInterface<ItemType, T, any>;
}): LabeledValue<T>;
function getLabeledValue<T extends SelectAsyncChoiceWidgetValue, ItemType>(props: {
    rawValue: T[];
    allItems: Choice<T>[];
    selected?: ItemType[] | null;
    asyncChoices: AsyncChoicesInterface<ItemType, T, any>;
}): LabeledValue<T>[];
function getLabeledValue<T extends SelectAsyncChoiceWidgetValue, ItemType>(props: {
    rawValue: T | T[];
    allItems: Choice<T>[];
    selected?: ItemType | ItemType[] | null;
    asyncChoices: AsyncChoicesInterface<ItemType, T, any>;
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
    const matchedItem = rawValue ? allItems.filter(item => item.value === rawValue).pop() : null;
    let label;
    if (rawValue && !matchedItem && selected) {
        label = asyncChoices.getLabel(selected as ItemType);
    } else if (rawValue) {
        label = matchedItem ? matchedItem.label : asyncChoices.getMissingLabel(rawValue as T);
    }
    return {
        key: rawValue,
        label,
        found: !!matchedItem,
    };
}

function defaultRenderNextPageButton({ isLoading, onClick }): React.ReactNode {
    return (
        <Button loading={isLoading} block type="link" onClick={onClick}>
            Fetch More
        </Button>
    );
}

type SelectAsyncChoiceWidgetValue = number | string;

// Pagination is handled by rendering a button within a Select.Option that triggers a fetch. This
// is the value used for that option. We can can prevent clicks on the option in case the button
// fails to stop propagation and prevent an invalid change from occurring
const NEXT_PAGE_VALUE = '__nextpage';

/**
 * A [Select](https://next.ant.design/components/select/) widget that handles [async choices](doc:AsyncChoicesInterface)
 *
 * @extract-docs
 * @forward-ref
 * @menu-group Widgets
 */
function SelectAsyncChoiceWidget<
    T extends SelectAsyncChoiceWidgetValue,
    Multiple extends boolean = T extends Array<any> ? true : false
>(props: SelectAsyncChoiceProps<T, Multiple>, ref: React.RefObject<Select>): React.ReactElement {
    const {
        input,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        meta,
        asyncChoices,
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
    const [keywords, setKeywords] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { list, choices, selected } = useAsyncChoices<any, T, Multiple>({
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
    const { paginator } = list;
    const isLoading = list.isLoading || selected.isLoading;
    const debouncedSetKeywords = useMemo(
        () =>
            debounce(keywords => {
                if (paginator) {
                    paginator;
                }
                setKeywords(keywords);
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
    } else if (rawValue != null) {
        value = getLabeledValue<T, any>({
            rawValue: rawValue as T,
            allItems: flattenedItems,
            selected: selected?.value,
            asyncChoices,
        });
    }
    const { onChange } = input;
    const wrappedOnChange = useCallback(
        value => {
            if (Array.isArray(value)) {
                return onChange(value.map(v => v.value));
            }
            if (value.value === NEXT_PAGE_VALUE) {
                // This catches the option wrapping the next page more button
                return;
            }
            return onChange(value.value);
        },
        [onChange]
    );

    return (
        <Select
            mode={asyncChoices.multiple ? 'multiple' : undefined}
            ref={ref}
            onDropdownVisibleChange={(isOpen): void => {
                // Internally antd seems to do this itself but for some reason
                // triggers an infinite loop in our case due to the debounced
                // function passed to onSearch. Manually clearing it here
                // on close resolves this issue.
                if (!isOpen) {
                    setKeywords('');
                }
                setIsOpen(isOpen);
            }}
            loading={isLoading}
            showSearch
            onSearch={debounceWait === 0 ? setKeywords : debouncedSetKeywords}
            filterOption={false}
            disabled={selected.isLoading}
            {...input}
            {...rest}
            onChange={wrappedOnChange}
            labelInValue
            value={selected.isLoading ? undefined : value}
            notFoundContent={isLoading ? loadingContent : rest.notFoundContent}
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
