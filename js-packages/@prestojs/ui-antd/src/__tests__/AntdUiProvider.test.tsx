/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FieldWidgetType, useUi, WidgetProps } from '@prestojs/ui';
import { Field } from '@prestojs/viewmodel';
import { render } from 'presto-testing-library';
import React from 'react';
import AntdUiProvider, { useAntdUiConfig } from '../AntdUiProvider';

function TestDatePicker(): React.ReactElement {
    return <div data-testid="date-picker">Test DatePicker</div>;
}

function TestTimePicker(): React.ReactElement {
    return <div data-testid="time-picker">Test TimePicker</div>;
}

test('AntdUiProvider should provide AntdUiConfig with DatePicker', () => {
    const countByConfigInstance = new Map();
    function Inner(): React.ReactElement {
        const config = useAntdUiConfig();
        countByConfigInstance.set(config, (countByConfigInstance.get(config) || 0) + 1);
        try {
            const DatePicker = config.getDatePicker();
            return <DatePicker />;
        } catch (err) {
            return <h1 data-testid="error">{err.message}</h1>;
        }
    }

    function TestWrapper(props): React.ReactElement {
        return (
            <AntdUiProvider {...props}>
                <Inner />
            </AntdUiProvider>
        );
    }
    global.console.error = jest.fn();
    const { rerender, getByTestId } = render(<TestWrapper />);
    expect(getByTestId('error')).toHaveTextContent(/you must first configure/);
    expect(countByConfigInstance.size).toBe(1);
    rerender(<TestWrapper datePickerComponent={TestDatePicker} />);
    expect(getByTestId('date-picker')).toContainHTML('Test DatePicker');
    // Should return same config instance if components are the same
    rerender(<TestWrapper datePickerComponent={TestDatePicker} />);
    rerender(<TestWrapper datePickerComponent={TestDatePicker} />);
    rerender(<TestWrapper datePickerComponent={TestDatePicker} />);
    expect(countByConfigInstance.size).toBe(2);
});

test('AntdUiProvider should provide AntdUiConfig with TimePicker', () => {
    const countByConfigInstance = new Map();
    function Inner(): React.ReactElement {
        const config = useAntdUiConfig();
        countByConfigInstance.set(config, (countByConfigInstance.get(config) || 0) + 1);
        try {
            const TimePicker = config.getTimePicker();
            return <TimePicker />;
        } catch (err) {
            return <h1 data-testid="error">{err.message}</h1>;
        }
    }

    function TestWrapper(props): React.ReactElement {
        return (
            <AntdUiProvider {...props}>
                <Inner />
            </AntdUiProvider>
        );
    }
    global.console.error = jest.fn();
    const { getByTestId, rerender } = render(<TestWrapper />);
    expect(getByTestId('error')).toHaveTextContent(/you must first configure/);
    expect(countByConfigInstance.size).toBe(1);
    rerender(<TestWrapper timePickerComponent={TestTimePicker} />);
    expect(getByTestId('time-picker')).toContainHTML('Test TimePicker');
    // Should return same config instance if components are the same
    rerender(<TestWrapper timePickerComponent={TestTimePicker} />);
    rerender(<TestWrapper timePickerComponent={TestTimePicker} />);
    rerender(<TestWrapper timePickerComponent={TestTimePicker} />);
    expect(countByConfigInstance.size).toBe(2);
});

describe('UiProvider behaviour should be the same when using AntdUiProvider', () => {
    // These are copied from UiProvider.test.tsx
    function FieldWrapper({ field }): React.ReactElement {
        const { getWidgetForField } = useUi();

        const Widget = getWidgetForField(field) as React.ComponentType<WidgetProps<any, any>>;
        const input = {
            name: field.label,
            value: 1,
            onChange: (): any => {}, // eslint-disable-line
            onBlur: (): any => {}, // eslint-disable-line
            onFocus: (): any => {}, // eslint-disable-line
        };
        return <Widget input={input} meta={{}} />;
    }

    function FieldFormatter({ field }): React.ReactElement {
        const { getFormatterForField } = useUi();

        const Formatter = getFormatterForField(field) as React.ComponentType<any>;
        const input = {
            name: field.label,
        };
        return <Formatter input={input} />;
    }

    test('useUi should warn if no provider', () => {
        // Supress error logs. Even though we catch it below React with log errors out.
        const mockError = jest.spyOn(global.console, 'error').mockImplementation(() => {}); // eslint-disable-line
        function TestWrapper(): null {
            useUi();
            return null;
        }
        expect(() => render(<TestWrapper />)).toThrowError(/used within a UiProvider/);
        mockError.mockRestore();
    });

    test('UiProvider should provide widget', () => {
        function DefaultWidget(): React.ReactElement {
            return <>default_widget</>;
        }
        function SpecialWidget(): React.ReactElement {
            return <>special_widget</>;
        }
        function getWidget<T>(field): FieldWidgetType<T, any> {
            if (field.label === 'special') {
                return SpecialWidget;
            }
            return DefaultWidget;
        }
        function TestWrapper({ field }): React.ReactElement {
            return (
                <AntdUiProvider getWidgetForField={getWidget}>
                    <FieldWrapper field={field} />
                </AntdUiProvider>
            );
        }
        const field1 = new Field({ label: 'special' });
        const field2 = new Field({ label: 'normal' });
        const { rerender, container } = render(<TestWrapper field={field1} />);
        expect(container.innerHTML).toBe('special_widget');
        rerender(<TestWrapper field={field2} />);
        expect(container.innerHTML).toBe('default_widget');
    });

    test('UiProvider should provide formatter', () => {
        function DefaultFormatter(): React.ReactElement {
            return <>default_formatter</>;
        }
        function SpecialFormatter(): React.ReactElement {
            return <>special_formatter</>;
        }
        function getFormatter<T>(field): React.ComponentType<T> {
            if (field.label === 'special') {
                return SpecialFormatter;
            }
            return DefaultFormatter;
        }
        function TestWrapper({ field }): React.ReactElement {
            return (
                <AntdUiProvider getFormatterForField={getFormatter}>
                    <FieldFormatter field={field} />
                </AntdUiProvider>
            );
        }
        const field1 = new Field({ label: 'special' });
        const field2 = new Field({ label: 'normal' });
        const { rerender, container } = render(<TestWrapper field={field1} />);
        expect(container.innerHTML).toBe('special_formatter');
        rerender(<TestWrapper field={field2} />);
        expect(container.innerHTML).toBe('default_formatter');
    });

    test('UiProvider should support nested providers', () => {
        function DefaultWidget(): React.ReactElement {
            return <>default_widget</>;
        }
        function SpecialWidget(): React.ReactElement {
            return <>special_widget</>;
        }
        function NestedWidget(): React.ReactElement {
            return <>nested_widget</>;
        }
        function getWidgetOuter<T>(field): FieldWidgetType<T, any> | null {
            if (field.label === 'special') {
                return SpecialWidget;
            }
            if (field.label == 'unknown') {
                return null;
            }
            return DefaultWidget;
        }

        function getWidgetInner<T>(field): FieldWidgetType<T, any> | null {
            if (field.label === 'inner') {
                return NestedWidget;
            }
            return null;
        }

        function TestWrapper({ field }): React.ReactElement {
            return (
                <AntdUiProvider getWidgetForField={getWidgetOuter}>
                    <AntdUiProvider getWidgetForField={getWidgetInner}>
                        <FieldWrapper field={field} />
                    </AntdUiProvider>
                </AntdUiProvider>
            );
        }
        const field1 = new Field({ label: 'special' });
        const field2 = new Field({ label: 'normal' });
        const field3 = new Field({ label: 'inner' });
        const field4 = new Field({ label: 'unknown' });
        const { rerender, container } = render(<TestWrapper field={field1} />);
        expect(container.innerHTML).toBe('special_widget');
        rerender(<TestWrapper field={field2} />);
        expect(container.innerHTML).toBe('default_widget');
        rerender(<TestWrapper field={field3} />);
        expect(container.innerHTML).toBe('nested_widget');
        const mockError = jest.spyOn(global.console, 'error').mockImplementation(() => {}); // eslint-disable-line
        expect(() => rerender(<TestWrapper field={field4} />)).toThrowError(
            /No widget provided for field/
        );
        mockError.mockRestore();
    });
});
