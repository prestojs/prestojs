import { WidgetProps } from '@prestojs/ui';
import type { RadioGroupProps, RadioProps } from 'antd';
import { Radio } from 'antd';
import React from 'react';

/**
 * @expandproperties
 * @hideproperties asyncChoices
 */
export type RadioChoicesWidgetProps<ValueT> = Omit<
    WidgetProps<ValueT | null, HTMLDivElement>,
    'choices'
> &
    RadioGroupProps & {
        /**
         * The choices to render. This can be a `Map` of value to label or an array of 2-element arrays `[value, label]`.
         */
        choices: Map<ValueT, string> | [ValueT, string][];
        /**
         * The component to use for each choice (ie. the radio button). Defaults to [Radio](https://ant.design/components/radio/#API).
         */
        radioComponent?: React.ComponentType<RadioProps>;
        /**
         * Any additional props to pass through to each choice. These are passed through to the `radioComponent`.
         *
         * Should be a `Map` of the choice value to the props to pass through
         */
        choiceProps?: Map<ValueT, Record<string, any>>;
    };

// Note that Radio.Group doesn't support ref so we don't use forwardRef here
/**
 * See [Radio](https://ant.design/components/radio/) for props available
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default function RadioChoicesWidget<ValueT extends number | string | boolean>(
    props: RadioChoicesWidgetProps<ValueT>
): React.ReactElement {
    const { input, choices, meta, radioComponent, choiceProps, ...rest } = props;
    const RadioComponent = radioComponent || Radio;
    return (
        <Radio.Group {...rest} {...input}>
            {choices &&
                Array.from(choices, ([key, label]) => (
                    <RadioComponent
                        key={key.toString()}
                        value={key}
                        {...(choiceProps?.get(key) || {})}
                    >
                        {label}
                    </RadioComponent>
                ))}
        </Radio.Group>
    );
}

RadioChoicesWidget.Button = Radio.Button;
