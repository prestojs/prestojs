import React from 'react';

export interface WidgetProps {
    value: any;
    onChange: (valueOrEvent: any) => any;
}

type FieldWidget = React.ComponentType<WidgetProps> | string;

export default FieldWidget;
