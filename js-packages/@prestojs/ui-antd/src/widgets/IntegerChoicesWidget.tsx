import React from 'react';
import ChoicesWidget, { ChoicesWidgetProps } from './ChoicesWidget';

/**
 * @deprecated Use [ChoicesWidget](doc:ChoicesWidget) instead
 * @menugroup Widgets
 * @extractdocs
 */
export default function IntegerChoicesWidget<T extends string | number>(
    props: ChoicesWidgetProps<T>
) {
    return <ChoicesWidget {...props} />;
}
