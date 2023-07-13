import React from 'react';
import DateWidget, { DateWidgetProps } from './DateWidget';
import RangeWidget, { RangeWidgetProps } from './RangeWidget';

/**
 * @expandproperties
 */
export type DateRangeWidgetProps = Omit<
    RangeWidgetProps<Date, HTMLInputElement, Omit<DateWidgetProps, 'input' | 'ref'>>,
    'inputWidget' | 'lowerInput' | 'upperInput'
> & {
    /**
     * Any props you want to pass to the lower input of the range
     */
    lowerInput?: Omit<DateWidgetProps, 'input' | 'ref'>;
    /**
     * Any props you want to pass to the upper input of the range
     */
    upperInput?: Omit<DateWidgetProps, 'input' | 'ref'>;
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
export default function DateRangeWidget(props: DateRangeWidgetProps): React.ReactElement {
    return <RangeWidget {...props} inputWidget={DateWidget} />;
}
