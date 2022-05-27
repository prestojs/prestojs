/**
 * Default formatter for DateField
 *
 * This example shows the default formatter that will be used with [FieldFormatter](doc:FieldFormatter).
 *
 * See [getFormatterForField](doc:getFormatterForField) for how a formatter is selected for a field.
 */
import { FieldFormatter, getFormatterForField, UiProvider } from '@prestojs/ui';
import { DateField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';

class ExampleModel extends viewModelFactory(
    {
        id: new IntegerField(),
        activatedAt: new DateField(),
        deactivateAt: new DateField({
            label: 'Date deactivated',
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
                            <FieldFormatter field={record._f.activatedAt} locales={['en-AU']} />
                        </dd>
                        <dt>{ExampleModel.fields.deactivateAt.label}</dt>
                        <dd>
                            {' '}
                            <FieldFormatter field={record._f.deactivateAt} locales={['en-AU']} />
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
