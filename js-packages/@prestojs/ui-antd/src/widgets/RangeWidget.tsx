import { RangedWidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import React from 'react';

// it'd appear ant's inconsistent in widget types at this moment (see: inputnumber, datepicker, upload) and they're actively changing/addressing these. we'll say widget's any for now?
const RangeWidget = React.forwardRef(
    <FieldValue, T extends HTMLElement, P>(
        {
            lowerInput,
            upperInput,
            separator = '-',
            inputWidget: InputWidget,
            ...rest
        }: RangedWidgetProps<FieldValue, T, P> & { inputWidget: any },
        ref: any
    ): React.ReactElement => {
        const { lowerRef, upperRef } = ref;
        return (
            <>
                <Input.Group compact>
                    <InputWidget ref={lowerRef} {...lowerInput} {...rest} />
                    <Input placeholder={separator} disabled />
                    <InputWidget ref={upperRef} {...upperInput} {...rest} />
                </Input.Group>
            </>
        );
    }
);

export default RangeWidget;
