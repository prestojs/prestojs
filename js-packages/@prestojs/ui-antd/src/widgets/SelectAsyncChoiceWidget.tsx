import { InputProps, WidgetProps } from '@prestojs/ui/FieldWidgetInterface';
import { AsyncChoicesInterface, Choice, useAsyncChoices } from '@prestojs/viewmodel';
import { Button, Select } from 'antd';
import { SelectProps } from 'antd/lib/select';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

export type SelectChoiceProps<T> = SelectProps<T> &
    WidgetProps<T, HTMLSelectElement> & {
        asyncChoices: AsyncChoicesInterface<any, T>;
        /**
         * Number of milliseconds to debounce changes to search keywords before an API call
         * will be triggered.
         */
        debounceWait?: number;
        /**
         * Whether to call the Endpoint immediately when the select has not been opened (eg. before the
         * initial open and after it's closed when the search value is cleared)
         */
        triggerWhenClosed?: boolean;
        input: InputProps<number | string | boolean, HTMLSelectElement> & {
            // Types in antd require event. Our types don't because final-form doesn't.
            onBlur: (event: React.FocusEvent<HTMLSelectElement>) => void;
            onFocus: (event: React.FocusEvent<HTMLSelectElement>) => void;
        };
    };

function getLabeledValue({ rawValue, allItems, selected, asyncChoices }) {
    if (Array.isArray(rawValue)) {
        return rawValue.map((v, i) =>
            getLabeledValue({
                rawValue: v,
                allItems,
                selected: selected?.[i],
                asyncChoices,
            })
        );
    }
    const matchedItem = rawValue ? allItems.filter(item => item.value === rawValue).pop() : null;
    let value;
    if (rawValue && !matchedItem && selected) {
        value = { key: rawValue, label: asyncChoices.getLabel(selected) };
    } else if (rawValue) {
        value = {
            key: rawValue,
            label: matchedItem ? matchedItem.label : '?',
        };
    }
    return [value, !!matchedItem];
}

/**
 * See [Select](https://next.ant.design/components/select/) for Select props available
 */
const SelectAsyncChoiceWidget = React.forwardRef(
    <T extends unknown>(
        {
            input,
            meta,
            asyncChoices,
            debounceWait = 500,
            triggerWhenClosed = false,
            ...rest
        }: SelectChoiceProps<T>,
        ref: React.RefObject<Select>
    ): React.ReactElement => {
        const [keywords, setKeywords] = useState('');
        const [isOpen, setIsOpen] = useState(false);
        const { list, choices, selected } = useAsyncChoices({
            asyncChoices,
            trigger: !isOpen && !triggerWhenClosed ? 'MANUAL' : 'SHALLOW',
            query: { keywords },
            accumulatePages: true,
            value: input.value,
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
        const x = getLabeledValue({
            rawValue,
            allItems: flattenedItems,
            selected: selected?.value,
            asyncChoices,
        });
        // When dealing with multi-select any existing values that are selected
        // but aren't in the returned data (eg. they aren't on the current page)
        // need to be shown regardless otherwise when you change selection it
        // will unselect them.
        const extraOptions = [];
        if (Array.isArray(rawValue)) {
            value = [];
            for (const [v, isInOptions] of x) {
                value.push(v);
                if (!isInOptions) {
                    extraOptions.push(v);
                }
            }
        } else {
            value = x[0];
        }
        if (asyncChoices.multiple) console.log(rawValue, value);
        const { onChange } = input;
        const wrappedOnChange = useCallback(
            value => {
                if (Array.isArray(value)) {
                    console.log(value);
                    return onChange(value.map(v => v.value));
                }
                if (value.value === 'fetchmore') {
                    // This catches the option wrapping the fetch more button
                    return;
                }
                return onChange(value.value);
            },
            [onChange]
        );
        return (
            <Select
                mode={asyncChoices.multiple ? 'multiple' : undefined}
                notFoundContent={isLoading ? <div>Fetching results...</div> : undefined}
                ref={ref}
                onDropdownVisibleChange={(isOpen): void => setIsOpen(isOpen)}
                loading={isLoading}
                showSearch
                onSearch={debouncedSetKeywords}
                filterOption={false}
                {...input}
                {...rest}
                onChange={wrappedOnChange}
                labelInValue
                value={selected.isLoading ? undefined : value}
            >
                {extraOptions.map(option => (
                    <Select.Option key={option.key.toString()} value={option.key}>
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
                                        <Select.Option key={value.toString()} value={value as any}>
                                            {label}
                                        </Select.Option>
                                    ))}
                                </Select.OptGroup>
                            );
                        }
                        const { label, value } = choiceOrGroupedChoices;
                        return (
                            <Select.Option key={value.toString()} value={value as any}>
                                {label}
                            </Select.Option>
                        );
                    })}
                {choices &&
                    choices.length > 0 &&
                    paginator?.responseSet &&
                    paginator?.hasNextPage() && (
                        <Select.Option key="fetchMore" value="fetchmore" style={{ padding: 0 }}>
                            <Button
                                loading={isLoading}
                                block
                                type="link"
                                onClick={(e): void => {
                                    e.stopPropagation();
                                    paginator.next();
                                }}
                            >
                                Fetch More
                            </Button>
                        </Select.Option>
                    )}
            </Select>
        );
    }
);

export default SelectAsyncChoiceWidget;
