import { WidgetProps } from '@prestojs/ui';
import React from 'react';
import RadioChoiceWidget from './RadioChoiceWidget';
import SelectAsyncChoiceWidget from './SelectAsyncChoiceWidget';
import SelectChoiceWidget from './SelectChoiceWidget';

/**
 * pass widgetType: 'select' | 'radio' to specify widget type
 * by default, select is used when there are 4 or more choices available, otherwise radio
 *
 * See [Select](https://next.ant.design/components/select/) for Select props available
 * See [Radio](https://next.ant.design/components/radio/)   for Radio props available
 *
 * @extract-docs
 */
const CharChoicesWidget = React.forwardRef(
    (
        {
            widgetType,
            asyncChoices,
            ...rest
        }: WidgetProps<string, HTMLElement> & { widgetType: 'select' | 'radio' | undefined },
        ref: any
    ): React.ReactElement => {
        if (asyncChoices) {
            return <SelectAsyncChoiceWidget ref={ref} asyncChoices={asyncChoices} {...rest} />;
        }
        if (widgetType === 'select') {
            return <SelectChoiceWidget ref={ref} {...rest} />;
        } else if (widgetType === 'radio') {
            return <RadioChoiceWidget {...rest} />;
        } else if (rest.choices && rest.choices.size > 3) {
            return <SelectChoiceWidget ref={ref} {...rest} />;
        }

        return <RadioChoiceWidget {...rest} />;
    }
);

export default CharChoicesWidget;
