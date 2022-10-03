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
    value?: any;
    [rest: string]: any;
};

/**
 * For the given [Field](doc:Field) and `value` render the relevant [Formatter](/docs/ui#Formatters) for it.
 *
 * <Usage>
 *
 *     <Alert>
 *        Usage of this component requires [UiProvider](doc:UiProvider) to appear somewhere above it in the component hierarchy
 *     </Alert>
 *
 *     This component works by calling `getFormatterForField` provided by [UiProvider](doc:UiProvider) to get the component
 *     to use and then will render that component passing `value` and any additional props passed to `FieldFormatter`.
 *
 *     There are two ways to pass the value through.
 *
 *     ### Pass field and value
 *
 *     For the below examples `Person` will be:
 *
 *     ```js
 *     class Person extends viewModelFactory({
 *         id: new Field(),
 *         email: new EmailField(),
 *     }, { pkFieldName: 'id' }) {
 *
 *     }
 *     ```
 *
 *     You can pass the field class and value as separate props:
 *
 *     ```js
 *     <FieldFormatter field={Person.fields.email} value="test@example.com" />
 *     ```
 *
 *     ### Pass bound field
 *
 *     The other way to pass the value is using a [bound field](doc:viewModelFactory#Accessors-_f) which is the easiest
 *     option if are dealing with an instance of a ViewModel, e.g.
 *
 *     ```js
 *     person = new Person({ id: 1, email: 'test@example.com' });
 *     ```
 *
 *     The usage then becomes:
 *
 *     ```js
 *     <FieldFormatter field={person._f.email} />
 *     ```
 *
 *     which is the equivalent of the previous example passing `field` and `value` separately. This works as `person._f`
 *     contains versions of all `Person` fields with the `value` prop set to the value of that record. This is a convenient
 *     way to pass around the `field` and `value` as a single prop.
 *
 *     Any additional arguments a formatter accepts can be passed through directly:
 *
 *     ```js
 *     <FieldFormatter field={person._f.email} blankLabel={<em>No email</em>} />
 *     ```
 *
 *     Note that it's up to the underlying formatter returned by `getFormatterForField` to support any extra props.
 * </Usage>
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
