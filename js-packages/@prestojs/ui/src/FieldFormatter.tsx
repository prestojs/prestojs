import React from 'react';
import getFormatterForField from './getFormatterForField';
import { Field } from '@prestojs/viewmodel';
import useUi from './useUi';

/*
 Wraps around getFormatterForField to always return ReactElement; Applies default props from getFormatterForField if any.
 */
export default function FieldFormatter<FieldValue>({
    field,
    ...rest
}: {
    field: Field<FieldValue>;
}): React.ReactElement {
    const { getFormatterForField } = useUi();

    const Formatter = getFormatterForField(field) as React.ComponentType<any>;

    if (Array.isArray(Formatter)) {
        const [ActualFormatter, props] = Formatter;
        return <ActualFormatter {...props} {...rest} />;
    } else {
        return <Formatter {...rest} />;
    }
}
