import { UiProvider } from '@prestojs/ui';
import { NumberField, viewModelFactory } from '@prestojs/viewmodel';
import { render } from '@testing-library/react';
import React from 'react';
import Form from '../Form';

class User extends viewModelFactory(
    {
        id: new NumberField(),

        age: new NumberField({ blank: true, label: 'Age' }),
    },
    { pkFieldName: 'id' }
) {}

function Widget({ input }): React.ReactElement {
    return <input name={input.name} placeholder={input.name} />;
}

function FormItemWrapper({ children, label, help, required }): React.ReactElement {
    return (
        <div>
            <label>
                {label} {children}
            </label>
            {required ? '(required)' : '(optional)'}
            {help && <span data-testid="help">{help}</span>}
        </div>
    );
}

function getWidgetForField(): typeof Widget {
    return Widget;
}

test('FormItem should render default field widget when none specified but allow overrides', () => {
    function TestWrapper(props): React.ReactElement {
        return (
            <UiProvider getWidgetForField={getWidgetForField} formItemComponent={FormItemWrapper}>
                <Form onSubmit={jest.fn()}>
                    {({ handleSubmit }): React.ReactElement => (
                        <form onSubmit={handleSubmit}>
                            <Form.Item field={User.fields.age} {...props} />
                        </form>
                    )}
                </Form>
            </UiProvider>
        );
    }
    const { getByTestId, rerender, queryByText, getByLabelText, queryByTestId } = render(
        <TestWrapper />
    );
    expect(getByLabelText('Age').tagName).toBe('INPUT');
    expect(getByLabelText('Age').getAttribute('placeholder')).toBe('age');
    expect(queryByText('(required)')).toBeNull();
    expect(queryByText('(optional)')).toBeTruthy();
    expect(queryByTestId('help')).toBeNull();

    // Should be able to override rendering
    rerender(<TestWrapper fieldProps={{ render: (): React.ReactElement => <textarea /> }} />);
    expect(getByLabelText('Age').tagName).toBe('TEXTAREA');

    // Should be able to override rendering or other props
    rerender(<TestWrapper fieldProps={{ render: (): React.ReactElement => <textarea /> }} />);
    expect(getByLabelText('Age').tagName).toBe('TEXTAREA');

    rerender(<TestWrapper fieldProps={{ name: 'differentName' }} />);
    expect(getByLabelText('Age').getAttribute('name')).toBe('differentName');

    rerender(<TestWrapper required />);
    expect(queryByText('(required)')).toBeTruthy();
    expect(queryByText('(optional)')).toBeFalsy();

    rerender(<TestWrapper help="Enter your age" />);
    expect(getByTestId('help').innerHTML).toBe('Enter your age');

    rerender(<TestWrapper label={<div data-testid="label">CUSTOM LABEL</div>} />);
    expect(getByTestId('label').innerHTML).toBe('CUSTOM LABEL');
});
