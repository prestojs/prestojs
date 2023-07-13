/**
 * Default formatter for URLField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `URLField` is [LinkFormatter](doc:LinkFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterProps`
 * option. These will be passed through to the formatter component (e.g. `target` & `rel` in this example).
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { IntegerField, URLField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        url: new URLField({
            formatterProps: {
                target: '_blank',
                rel: 'noopener noreferrer',
            },
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({ id: 1, url: 'https://prestojs.com' });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.url.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.url}>Presto JS</FieldFormatter>
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
