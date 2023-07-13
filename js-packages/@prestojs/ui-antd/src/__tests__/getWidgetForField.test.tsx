import {
    AsyncChoices,
    BooleanField,
    CharField,
    DateField,
    DateRangeField,
    DateTimeField,
    DateTimeRangeField,
    DecimalField,
    DecimalRangeField,
    EmailField,
    Field,
    FileField,
    FloatField,
    FloatRangeField,
    ImageField,
    IntegerField,
    IntegerRangeField,
    JsonField,
    ListField,
    NumberField,
    PasswordField,
    TextField,
    TimeField,
    URLField,
} from '@prestojs/viewmodel';
import '@testing-library/jest-dom/extend-expect';
import { DatePicker, TimePicker } from 'antd';
import { act, render, waitFor } from 'presto-testing-library';
import React from 'react';
import AntdUiProvider from '../AntdUiProvider';
import getWidgetForField from '../getWidgetForField';
import BooleanWidget from '../widgets/BooleanWidget';
import CharWidget from '../widgets/CharWidget';
import ChoicesWidget from '../widgets/ChoicesWidget';
import DateRangeWidget from '../widgets/DateRangeWidget';
import DateTimeRangeWidget from '../widgets/DateTimeRangeWidget';
import DateTimeWidget from '../widgets/DateTimeWidget';
import DateWidget from '../widgets/DateWidget';
import DecimalRangeWidget from '../widgets/DecimalRangeWidget';
import DecimalWidget from '../widgets/DecimalWidget';
import EmailWidget from '../widgets/EmailWidget';
import FileWidget from '../widgets/FileWidget';
import FloatRangeWidget from '../widgets/FloatRangeWidget';
import FloatWidget from '../widgets/FloatWidget';
import ImageWidget from '../widgets/ImageWidget';
import IntegerRangeWidget from '../widgets/IntegerRangeWidget';
import IntegerWidget from '../widgets/IntegerWidget';
import JsonWidget from '../widgets/JsonWidget';
import NullableBooleanWidget from '../widgets/NullableBooleanWidget';
import NumberWidget from '../widgets/NumberWidget';
import PasswordWidget from '../widgets/PasswordWidget';
import TextWidget from '../widgets/TextWidget';
import TimeWidget from '../widgets/TimeWidget';

test('getWidgetForField should return widget for field', async () => {
    const [UnknownWidget, props] = getWidgetForField(new PasswordField()) as any;
    const input = {
        value: null,
        onChange(nextValue) {
            // intentionally blank
        },
    };

    const { getByTestId, getByText } = render(
        <React.Suspense fallback="loading...">
            <UnknownWidget data-testid="widget" {...props} input={input} />
        </React.Suspense>
    );

    expect(await getByText('loading...')).toBeInTheDocument();
    // just check the widget came through with the testid so we know it resolved suspense
    await waitFor(() => expect(getByTestId('widget')).toBeInTheDocument());
});

test('getWidgetForField should return widget for descendant classes of same type', async () => {
    class CustomDecimal extends NumberField {}

    const [UnknownWidget, props] = getWidgetForField(new CustomDecimal()) as any;

    const { getByTestId, getByText } = render(
        <React.Suspense fallback="loading...">
            <UnknownWidget data-testid="widget" {...props} />
        </React.Suspense>
    );

    expect(await getByText('loading...')).toBeInTheDocument();
    await waitFor(() => expect(getByTestId('widget')).toBeInTheDocument());
});

test.each(
    [
        [BooleanField, BooleanWidget],
        [new BooleanField({ blank: true }), NullableBooleanWidget],
        [CharField, CharWidget],
        [DateField, DateWidget],
        [DateRangeField, DateRangeWidget],
        [DateTimeField, DateTimeWidget],
        [DateTimeRangeField, DateTimeRangeWidget],
        [new DecimalField({ decimalPlaces: 2 }), DecimalWidget],
        [DecimalRangeField, DecimalRangeWidget],
        [EmailField, EmailWidget],
        [FileField, FileWidget],
        [FloatField, FloatWidget],
        [FloatRangeField, FloatRangeWidget],
        [ImageField, ImageWidget],
        [IntegerField, IntegerWidget],
        [IntegerRangeField, IntegerRangeWidget],
        [JsonField, JsonWidget],
        [NumberField, NumberWidget],
        [PasswordField, PasswordWidget],
        [TextField, TextWidget],
        [TimeField, TimeWidget],
        [URLField, CharWidget],
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
            ChoicesWidget,
        ],
    ].map(([field, widget]: [any, any]) => [
        // extract names so we can better render test name below... otherwise not needed
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        widget.render ? widget.render.name : widget.name,
        field instanceof Field ? field.constructor.name : field.name,
        field,
        widget,
    ])
)(
    'getWidgetForField should select widget %s for field %s',
    async (widgetName, fieldName, fieldClass, widgetClass) => {
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
            let result = await UnknownWidget._payload._result;
            if (result.render) {
                result = result.render;
            }
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
