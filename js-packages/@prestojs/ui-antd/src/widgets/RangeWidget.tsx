import { RangedWidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import React from 'react';

/**
 * @expand-properties
 */
type RangeWidgetProps<FieldValue, T extends HTMLElement, P> = RangedWidgetProps<
    FieldValue,
    T,
    P
> & { inputWidget: any };

// it'd appear ant's inconsistent in widget types at this moment (see: inputnumber, datepicker, upload) and they're actively changing/addressing these. we'll say widget's any for now?
function RangeWidget<FieldValue, T extends HTMLElement, P>(
    props: RangeWidgetProps<FieldValue, T, P>,
    ref: any
): React.ReactElement {
    const {
        lowerInput,
        upperInput,
        separator = '-',
        inputWidget: InputWidget,
        input: { value = {} as Record<string, FieldValue>, onChange },
        ...rest
    } = props;
    const { lowerRef, upperRef } = ref || {};
    return (
        <>
            <Input.Group compact>
                <InputWidget
                    ref={lowerRef}
                    defaultValue={value.lower}
                    onChange={(v: any): void => onChange({ ...value, lower: v })}
                    {...lowerInput}
                    {...rest}
                />
                {separator}
                <InputWidget
                    ref={upperRef}
                    defaultValue={value.upper}
                    onChange={(v: any): void => onChange({ ...value, upper: v })}
                    {...upperInput}
                    {...rest}
                />
            </Input.Group>
        </>
    );
}

export default React.forwardRef(RangeWidget);
