import { RangedWidgetProps, WidgetProps } from '@prestojs/ui';
import { Input } from 'antd';
import cx from 'classnames';
import React, { RefObject } from 'react';

/**
 * @expandproperties
 */
export type RangeWidgetProps<FieldValue, T extends HTMLElement, P> = RangedWidgetProps<
    FieldValue,
    T,
    P
> & {
    inputWidget: React.ComponentType<
        WidgetProps<FieldValue, any> & { className: string; ref?: RefObject<T> }
    >;
    lowerRef?: RefObject<T>;
    upperRef?: RefObject<T>;
};

export default function RangeWidget<FieldValue, T extends HTMLElement, InputWidgetProps>(
    props: RangeWidgetProps<FieldValue, T, InputWidgetProps>
): React.ReactElement {
    const {
        lowerInput,
        upperInput,
        separator = '-',
        inputWidget: InputWidget,
        input: { value = {} as Record<string, FieldValue>, onChange },
        className,
        meta,
        lowerRef,
        upperRef,
    } = props;
    return (
        <Input.Group compact className={cx('presto-range-widget-wrapper', className)}>
            <InputWidget
                ref={lowerRef}
                {...lowerInput}
                input={{
                    value: value.lower,
                    onChange(v) {
                        return onChange({ ...value, lower: v });
                    },
                }}
                className={cx('presto-range-widget-lower', lowerInput?.className)}
            />
            <span className="presto-range-widget-separator">{separator}</span>
            <InputWidget
                ref={upperRef}
                {...upperInput}
                input={{
                    value: value.upper,
                    onChange(v) {
                        return onChange({ ...value, upper: v });
                    },
                }}
                className={cx('presto-range-widget-upper', upperInput?.className)}
            />
        </Input.Group>
    );
}
