/**
 * Default formatter for FileField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `FileField` is [LinkFormatter](doc:LinkFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterProps`
 * option. These will be passed through to the formatter component.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { FileField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        document: new FileField(),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({ id: 1, document: 'https://example.com/file.tgz' });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.document.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.document} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
