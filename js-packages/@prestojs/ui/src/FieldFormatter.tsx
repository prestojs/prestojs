import { Field } from '@prestojs/viewmodel';
import React from 'react';
import useUi from './useUi';

/**
 * @expand-properties Any extra props are passed directly through to the formatter component.
 */
type FieldFormatterProps<FieldValueT, ParsableValueT, SingleValueT> = {
    /**
     * The field used to determine the formatter to use. If field is [bound to the record](doc:viewModelFactory#Accessors-_f)
     * then `value` is not required and will be set to `field.value`.
     */
    field: Field<FieldValueT, ParsableValueT, SingleValueT>;
    /**
     * Value to format. If `field` is a [record bound field](doc:viewModelFactory#Accessors-_f) then this is not required.
     */
    value?: FieldValueT;
    [rest: string]: any;
};

/**
 * For the given `Field` and `value` render the relevant Formatter for it.
 *
 * Usage of this component requires [UiProvider](doc:UiProvider) to appear somewhere above it in the component hierarchy. You
 * must pass the `getFormatterForField` prop through which is what determines which component to use for a specific field.
 *
 * `getFormatterForField` can return either a component directly or a 2-element array of the component and some props to pass
 * through to it. `FieldFormatter` handles rendering the returned component and passing through any extra props returned from
 * `getFormatterForField` or passed through to `Formatter`.
 *
 * @extract-docs
 */
export default function FieldFormatter<FieldValueT, ParsableValueT, SingleValueT>(
    props: FieldFormatterProps<FieldValueT, ParsableValueT, SingleValueT>
): React.ReactElement {
    const { field, ...rest } = props;

    const { getFormatterForField } = useUi();

    if (field.isBound && !('value' in rest)) {
        rest.value = field.value;
    }

    const Formatter = getFormatterForField(field) as React.ComponentType<any>;

    if (Array.isArray(Formatter)) {
        const [ActualFormatter, props] = Formatter;
        return <ActualFormatter {...props} {...rest} />;
    } else {
        return <Formatter {...rest} />;
    }
}
