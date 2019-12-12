import React from 'react';
import getFormatterForField from './getFormatterForField';
import { Field } from '@xenopus/viewmodel';

export default function FieldFormatter<FieldValue>({
    field,
    ...rest
}: {
    field: Field<FieldValue>;
}): React.ReactElement | null {
    const Formatter = getFormatterForField(field);

    if (!Formatter) return null;

    if (Array.isArray(Formatter)) {
        const [ActualFormatter, props] = Formatter;
        return <ActualFormatter {...props} {...rest} />;
    } else {
        return <Formatter {...rest} />;
    }
}
