/**
 * Default formatter for EmailField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * This just outputs the string exactly as entered.
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `EmailField` is [CharFormatter](doc:CharFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterOptions`
 * option.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { EmailField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        email: new EmailField(),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({ id: 1, email: 'test@example.com' });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.email.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.email} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
