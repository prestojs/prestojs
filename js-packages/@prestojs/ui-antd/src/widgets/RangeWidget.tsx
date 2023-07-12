import { RangedWidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import cx from 'classnames';
import React from 'react';

/**
 * @expandproperties
 */
export type RangeWidgetProps<FieldValue, T extends HTMLElement, P> = RangedWidgetProps<
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
        className,
        meta,
    } = props;
    const { lowerRef, upperRef } = ref || {};
    return (
        <>
            <Input.Group compact className={cx('presto-range-widget-wrapper', className)}>
                <InputWidget
                    ref={lowerRef}
                    value={value.lower}
                    onChange={(v: any): void => onChange({ ...value, lower: v })}
                    {...lowerInput}
                    className={cx('presto-range-widget-lower', lowerInput.className)}
                />
                <Input className="presto-range-widget-separator" placeholder={separator} disabled />
                <InputWidget
                    ref={upperRef}
                    value={value.upper}
                    onChange={(v: any): void => onChange({ ...value, upper: v })}
                    {...upperInput}
                    className={cx('presto-range-widget-upper', upperInput.className)}
                />
            </Input.Group>
        </>
    );
}

export default React.forwardRef(RangeWidget);
