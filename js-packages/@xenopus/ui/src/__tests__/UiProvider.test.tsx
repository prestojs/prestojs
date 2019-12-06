import { Field } from '@xenopus/viewmodel';
import React from 'react';
import { render } from '@testing-library/react';

import FieldWidget, { WidgetProps } from '../FieldWidget';
import useUi from '../useUi';
import UiProvider from '../UiProvider';

function FieldWrapper({ field }): React.ReactElement {
    const { getWidgetForField } = useUi();

    const Widget = getWidgetForField(field) as React.ComponentType<WidgetProps<any, any>>;
    const input = {
        name: field.label,
        value: 1,
        onChange: (): any => {},
        onBlur: (): any => {},
        onFocus: (): any => {},
    };
    return <Widget input={input} meta={{}} />;
}

test('useUi should warn if no provider', () => {
    // Supress error logs. Even though we catch it below React with log errors out.
    const mockError = jest.spyOn(global.console, 'error').mockImplementation(() => {});
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
    function getWidget<T>(field): FieldWidget<T, any> {
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
    function getWidgetOuter<T>(field): FieldWidget<T, any> | null {
        if (field.label === 'special') {
            return SpecialWidget;
        }
        if (field.label == 'unknown') {
            return null;
        }
        return DefaultWidget;
    }
    function getWidgetInner<T>(field): FieldWidget<T, any> | null {
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
    const mockError = jest.spyOn(global.console, 'error').mockImplementation(() => {});
    expect(() => rerender(<TestWrapper field={field4} />)).toThrowError(
        /No widget provided for field/
    );
    mockError.mockRestore();
});
