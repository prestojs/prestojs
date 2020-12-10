import { WidgetProps } from '@prestojs/ui';
import React from 'react';
import RadioChoiceWidget from './RadioChoiceWidget';
import SelectAsyncChoiceWidget from './SelectAsyncChoiceWidget';
import SelectChoiceWidget from './SelectChoiceWidget';

/**
 * @expand-properties
 */
type IntegerChoicesWidgetProps = WidgetProps<string, HTMLElement> & {
    /**
     * Choices are rendered as either [SelectChoiceWidget](doc:SelectChoiceWidget) or [RadioChoiceWidget](doc:RadioChoiceWidget).
     * Specify `select` or `radio` to choose one of these or leave blank to select based on number of choices (if > 3 defaults to
     * 'select' otherwise 'radio').
     *
     * Note that this doesn't apply if `asyncChoices` is provided. In that case [SelectAsyncChoiceWidget](SelectAsyncChoiceWidget)
     * is used.
     */
    widgetType?: 'select' | 'radio';
};

/**
 * Render choices as either a [SelectChoiceWidget](doc:SelectChoiceWidget) or [RadioChoiceWidget](doc:RadioChoiceWidget).
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function IntegerChoicesWidget(props: IntegerChoicesWidgetProps, ref: any): React.ReactElement {
    const { widgetType, asyncChoices, ...rest } = props;
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

export default React.forwardRef(IntegerChoicesWidget);
