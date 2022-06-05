/**
 * Default formatter for DateField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 *
 * The default formatter for `DateTimeField` is [DateTimeFormatter](doc:DateTimeFormatter).
 *
 * You can pass options for the formatter via the [Field](doc:Field) under the `formatterOptions`
 *  option. These will be passed through to the formatter component (eg. `locales` & `localeOptions`
 *  in this example).
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { DateTimeField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        activatedAt: new DateTimeField({
            formatterProps: {
                locales: ['en-AU'],
            },
        }),
        deactivateAt: new DateTimeField({
            label: 'Date deactivated',
            formatterProps: {
                locales: ['en-AU'],
                localeOptions: {
                    dateStyle: 'short',
                    timeStyle: 'short',
                },
            },
        }),
    },
    { pkFieldName: 'id' }
) {}

export default function FormUsage(props) {
    const record = new ExampleModel({
        id: 1,
        deactivateAt: '2022-01-10',
        activatedAt: new Date('2022-01-01'),
    });
    return (
        <React.Suspense fallback="Loading...">
            <UiProvider getFormatterForField={getFormatterForField}>
                <div className="grid grid-cols-1 gap-4 w-full">
                    <dl>
                        <dt>{ExampleModel.fields.activatedAt.label}</dt>
                        <dd>
                            <FieldFormatter field={record._f.activatedAt} />
                        </dd>
                        <dt>{ExampleModel.fields.deactivateAt.label}</dt>
                        <dd>
                            {' '}
                            <FieldFormatter field={record._f.deactivateAt} />
                        </dd>
                    </dl>
                </div>
            </UiProvider>
        </React.Suspense>
    );
}

export function getStaticProps(context) {
    const record = new ExampleModel({
        id: 1,
        deactivateAt: '2022-01-10',
        activatedAt: new Date('2022-01-01'),
    });
    console.log(record.activatedAt.toLocaleDateString(['en-AU']));
    return {
        props: {
            wot: record.activatedAt.toLocaleDateString(['en-AU']),
        },
    };
}
