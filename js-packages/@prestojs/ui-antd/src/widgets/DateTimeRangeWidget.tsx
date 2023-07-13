import React from 'react';
import DateTimeWidget, { DateTimeWidgetProps } from './DateTimeWidget';
import RangeWidget, { RangeWidgetProps } from './RangeWidget';

/**
 * @expandproperties
 */
export type DateTimeRangeWidgetProps = Omit<
    RangeWidgetProps<Date, HTMLInputElement, Omit<DateTimeWidgetProps, 'input' | 'ref'>>,
    'inputWidget' | 'lowerInput' | 'upperInput'
> & {
    /**
     * Any props you want to pass to the lower input of the range
     */
    lowerInput?: Omit<DateTimeWidgetProps, 'input' | 'ref'>;
    /**
     * Any props you want to pass to the upper input of the range
     */
    upperInput?: Omit<DateTimeWidgetProps, 'input' | 'ref'>;
};

/**
 * See [DatePicker](https://ant.design/components/date-picker/) for props available
 *
 * As with all range widgets, ref should be shaped as `{ lowerRef: Ref(), upperRef: Ref() }`
 *
 * You may pass in props to be used for the individual input as lowerInput / upperInput
 *
 * @extractdocs
 * @menugroup Widgets
 */
export default function DateTimeRangeWidget(props: DateTimeRangeWidgetProps): React.ReactElement {
    return <RangeWidget {...props} inputWidget={DateTimeWidget} />;
}
