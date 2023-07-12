import React, { ReactElement, ReactNode } from 'react';

/**
 * @expandproperties
 */
export type ChoiceFormatterProps<T> = {
    /**
     * The value to format
     */
    value: T;
    /**
     * The choices to render. This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
     */
    choices: [any, string][] | Map<any, string>;
    /**
     * What to render when `value` is `null` or `undefined`
     */
    blankLabel?: ReactNode;
    /**
     * What to render if `value` is not found in `choices`. By default, this is considered a programming error and a warning
     * is logged. If your use case supports invalid values pass `warnOnInvalidChoice={false}` to suppress the warning.
     */
    invalidChoiceLabel?: ReactNode;
    /**
     * If `value` is not found in `choices` then a warning will be logged by default. To supress this warning pass
     * `warnOnInvalidChoice={false}`.
     *
     * Defaults to `true`.
     */
    warnOnInvalidChoice?: boolean;
};

/**
 * Render the label for choice based on the provided value
 *
 * This is the [default formatter](doc:getFormatterForField) used when a field has choices defined.
 *
 * @extractdocs
 * @menugroup Formatters
 */
export default function ChoiceFormatter<T>(props: ChoiceFormatterProps<T>): ReactElement {
    const {
        value,
        choices,
        blankLabel = null,
        invalidChoiceLabel = null,
        warnOnInvalidChoice = true,
    } = props;
    if (value == null) {
        return <>{blankLabel}</>;
    }
    const choiceValue = Array.from(choices).find(choice => choice[0] === value);
    if (choiceValue === null || choiceValue === undefined) {
        if (warnOnInvalidChoice) {
            console.warn(
                `Expected to find value choice label with value ${value} but no such choice option exists among `,
                choices
            );
        }
        return <>{invalidChoiceLabel}</>;
    }
    return <>{choiceValue[1]}</>;
}
