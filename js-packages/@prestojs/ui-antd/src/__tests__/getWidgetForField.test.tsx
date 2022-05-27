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
import { act, render, waitFor } from '@testing-library/react';
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
    const UnknownWidget = getWidgetForField(new PasswordField()) as any;

    const { getByTestId, getByText } = render(
        <React.Suspense fallback="loading...">
            <UnknownWidget data-testid="widget" />
        </React.Suspense>
    );

    expect(await getByText('loading...')).toBeInTheDocument();
    // just check the widget came through with the testid so we know it resolved suspense
    await waitFor(() => expect(getByTestId('widget')).toBeInTheDocument());
});

test('getWidgetForField should return widget for descendant classes of same type', async () => {
    class CustomDecimal extends NumberField {}

    const UnknownWidget = getWidgetForField(new CustomDecimal()) as any;

    const { getByTestId, getByText } = render(
        <React.Suspense fallback="loading...">
            <UnknownWidget data-testid="widget" />
        </React.Suspense>
    );

    expect(await getByText('loading...')).toBeInTheDocument();
    await waitFor(() => expect(getByTestId('widget')).toBeInTheDocument());
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
            extraProps = UnknownWidget[1];
            UnknownWidget = UnknownWidget[0];
        }
        const input = { onChange: jest.fn() };

        render(
            <React.Suspense fallback="loading...">
                <AntdUiProvider datePickerComponent={DatePicker} timePickerComponent={TimePicker}>
                    <UnknownWidget input={input} {...extraProps} />
                </AntdUiProvider>
            </React.Suspense>
        );
        await act(async () => {
            const result = await UnknownWidget._payload._result;
            expect(result.default ?? result).toBe(widgetClass);
        });
    }
);

test('getWidgetForField should pass maxLength to Input fields', async () => {
    let UnknownWidget = getWidgetForField(new CharField({ maxLength: 10 })) as any;
    expect(Array.isArray(UnknownWidget)).toBe(true);
    if (Array.isArray(UnknownWidget)) {
        expect(UnknownWidget[1]).toEqual({ maxLength: 10 });
    }
});
