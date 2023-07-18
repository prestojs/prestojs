/**
 * Default formatter for ImageField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `ImageField` is [ImageFormatter](doc:ImageFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterProps`
 * option. These will be passed through to the formatter component.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { ImageField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        profileImage: new ImageField(),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage() {
    const record = new ExampleModel({
        id: 1,
        profileImage: 'https://picsum.photos/id/237/200/300',
    });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.profileImage.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.profileImage} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}
