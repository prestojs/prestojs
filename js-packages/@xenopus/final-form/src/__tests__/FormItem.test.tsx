import React from 'react';
import { render } from '@testing-library/react';
import { UiProvider } from '@xenopus/ui';
import { NumberField, ModelView } from '@xenopus/viewmodel';
import Form from '../Form';

class User extends ModelView {
    static _meta = {
        label: 'User',
        labelPlural: 'Users',
    };

    static age = new NumberField({ name: 'age', label: 'Age' });
}

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
                            <Form.Item field={User.age} {...props} />
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
