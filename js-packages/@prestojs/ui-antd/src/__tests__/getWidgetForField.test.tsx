import {
    AsyncChoices,
    BooleanField,
    CharField,
    CurrencyField,
    DateField,
    DateRangeField,
    DateTimeField,
    DateTimeRangeField,
    DecimalField,
    DecimalRangeField,
    DurationField,
    EmailField,
    Field,
    FieldProps,
    FileField,
    FloatField,
    FloatRangeField,
    ImageField,
    IntegerField,
    IntegerRangeField,
    IPAddressField,
    JsonField,
    ListField,
    NullableBooleanField,
    NumberField,
    PasswordField,
    SlugField,
    TextField,
    TimeField,
    URLField,
    UUIDField,
} from '@prestojs/viewmodel';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import { DatePicker, TimePicker } from 'antd';
import React from 'react';
import AntdUiProvider from '../AntdUiProvider';
import getWidgetForField from '../getWidgetForField';
import BooleanWidget from '../widgets/BooleanWidget';
import ChoicesWidget from '../widgets/CharChoicesWidget';
import CharChoicesWidget from '../widgets/CharChoicesWidget';
import CharWidget from '../widgets/CharWidget';
import CurrencyWidget from '../widgets/CurrencyWidget';
import DateRangeWidget from '../widgets/DateRangeWidget';
import DateTimeRangeWidget from '../widgets/DateTimeRangeWidget';
import DateTimeWidget from '../widgets/DateTimeWidget';
import DateWidget from '../widgets/DateWidget';
import DecimalRangeWidget from '../widgets/DecimalRangeWidget';
import DecimalWidget from '../widgets/DecimalWidget';
import DurationWidget from '../widgets/DurationWidget';
import EmailWidget from '../widgets/EmailWidget';
import FileWidget from '../widgets/FileWidget';
import FloatRangeWidget from '../widgets/FloatRangeWidget';
import FloatWidget from '../widgets/FloatWidget';
import ImageWidget from '../widgets/ImageWidget';
import IntegerRangeWidget from '../widgets/IntegerRangeWidget';
import IntegerWidget from '../widgets/IntegerWidget';
import IPAddressWidget from '../widgets/IPAddressWidget';
import JsonWidget from '../widgets/JsonWidget';
import NullableBooleanWidget from '../widgets/NullableBooleanWidget';
import NumberWidget from '../widgets/NumberWidget';
import PasswordWidget from '../widgets/PasswordWidget';
import SlugWidget from '../widgets/SlugWidget';
import TextWidget from '../widgets/TextWidget';
import TimeWidget from '../widgets/TimeWidget';
import URLWidget from '../widgets/URLWidget';
import UUIDWidget from '../widgets/UUIDWidget';

test('getWidgetForField should return widget for field', async () => {
    const fieldArgs = { label: 'input number with a spin button' };
    const UnknownWidget = getWidgetForField(new NumberField(fieldArgs)) as any;

    render(
        <React.Suspense fallback="loading...">
            <UnknownWidget />
        </React.Suspense>
    );

    expect(await screen.findByText('loading...')).toBeInTheDocument();
    const lazyElement = await screen.findByRole('spinbutton');
    expect(lazyElement).toBeInTheDocument();
});

test('getWidgetForField should return widget for descendant classes of same type', async () => {
    class CustomDecimal extends NumberField {}

    const fieldArgs = { label: 'input number with a spin button' };
    const UnknownWidget = getWidgetForField(new CustomDecimal(fieldArgs)) as any;

    render(
        <React.Suspense fallback="loading...">
            <UnknownWidget />
        </React.Suspense>
    );

    const lazyElement = await screen.findByRole('spinbutton');
    expect(lazyElement).toBeInTheDocument();
});

test.each(
    [
        [BooleanField, BooleanWidget],
        [CharField, CharWidget],
        [new CurrencyField({ decimalPlaces: 2 }), CurrencyWidget],
        [DateField, DateWidget],
        [DateRangeField, DateRangeWidget],
        [DateTimeField, DateTimeWidget],
        [DateTimeRangeField, DateTimeRangeWidget],
        [new DecimalField({ decimalPlaces: 2 }), DecimalWidget],
        [DecimalRangeField, DecimalRangeWidget],
        [DurationField, DurationWidget],
        [EmailField, EmailWidget],
        [FileField, FileWidget],
        [FloatField, FloatWidget],
        [FloatRangeField, FloatRangeWidget],
        [ImageField, ImageWidget],
        [IntegerField, IntegerWidget],
        [IntegerRangeField, IntegerRangeWidget],
        [IPAddressField, IPAddressWidget],
        [JsonField, JsonWidget],
        [NumberField, NumberWidget],
        [NullableBooleanField, NullableBooleanWidget],
        [PasswordField, PasswordWidget],
        [SlugField, SlugWidget],
        [TextField, TextWidget],
        [TimeField, TimeWidget],
        [URLField, URLWidget],
        [UUIDField, UUIDWidget],
        [new CharField({ choices: [['1', 'One']] }), ChoicesWidget],
        [new IntegerField({ choices: [[1, 'One']] }), ChoicesWidget],
        [new ListField({ childField: new IntegerField({ choices: [[1, 'One']] }) }), ChoicesWidget],
        [
            new CharField({
                asyncChoices: new AsyncChoices({
                    list(params): Promise<any> {
                        return Promise.resolve();
                    },
                    retrieve(value: string): Promise<any> {
                        return Promise.resolve();
                    },
                    getLabel(item): React.ReactNode {
                        return 'label';
                    },
                    getValue(item): string {
                        return '1';
                    },
                }),
            }),
            CharChoicesWidget,
        ],
    ].map(([field, widget]) => [
        // extract names so we can better render test name below... otherwise not needed
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        widget.render.name,
        field instanceof Field ? field.constructor.name : field.name,
        field,
        widget,
    ])
)(
    'getWidgetForField should select widget %s for field %s',
    async (
        fieldName,
        widgetName,
        fieldClass: (new (props?: FieldProps<any, any>) => Field<any>) | Field<any>,
        widgetClass
    ) => {
        let UnknownWidget = getWidgetForField(
            fieldClass instanceof Field ? fieldClass : new fieldClass()
        ) as any;
        let extraProps = {};
        if (Array.isArray(UnknownWidget)) {
            UnknownWidget = UnknownWidget[0];
            extraProps = UnknownWidget[1];
        }
        const input = { onChange: jest.fn() };

        render(
            <React.Suspense fallback="loading...">
                <AntdUiProvider datePickerComponent={DatePicker} timePickerComponent={TimePicker}>
                    <UnknownWidget input={input} {...extraProps} />
                </AntdUiProvider>
            </React.Suspense>
        );
        const result = await UnknownWidget._result;
        expect(result.default ?? result).toBe(widgetClass);
    }
);
