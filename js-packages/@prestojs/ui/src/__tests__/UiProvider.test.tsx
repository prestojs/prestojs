import { Field } from '@prestojs/viewmodel';
import { render } from 'presto-testing-library';
import React from 'react';

import { FieldWidgetType, WidgetProps } from '../FieldWidgetInterface';
import UiProvider from '../UiProvider';
import useUi from '../useUi';

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
            <UiProvider getWidgetForField={getWidget}>
                <FieldWrapper field={field} />
            </UiProvider>
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
            <UiProvider getFormatterForField={getFormatter}>
                <FieldFormatter field={field} />
            </UiProvider>
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
            <UiProvider getWidgetForField={getWidgetOuter}>
                <UiProvider getWidgetForField={getWidgetInner}>
                    <FieldWrapper field={field} />
                </UiProvider>
            </UiProvider>
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
