import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { UiProvider } from '@prestojs/ui';
import { NumberField, Field, viewModelFactory } from '@prestojs/viewmodel';

import Form from '../Form';

class User extends viewModelFactory({
    age: new NumberField({ label: 'Age' }),
    email: new Field({ label: 'Email' }),
}) {
    static label = 'User';
    static labelPlural = 'Users';
}

function Widget({ input }): React.ReactElement {
    return <input {...input} />;
}

function getWidgetForField(): typeof Widget {
    return Widget;
}

test('ViewModelForm should accept renderable children rather than function', () => {
    const onSubmit = jest.fn();
    const { getByText, getByLabelText } = render(
        <UiProvider getWidgetForField={getWidgetForField}>
            <Form onSubmit={onSubmit}>
                <label>
                    Age
                    <Form.Field field={User.fields.age} />
                </label>
                <button type="submit">Submit</button>
            </Form>
        </UiProvider>
    );
    const ageInput = getByLabelText('Age');
    expect(ageInput.tagName).toBe('INPUT');
    fireEvent.change(ageInput, { target: { value: '23' } });
    fireEvent.click(getByText('Submit'));
    expect(onSubmit).toHaveBeenLastCalledWith(
        { age: '23' },
        expect.any(Object),
        expect.any(Function)
    );
});

test('ViewModelForm should accept a function as children', () => {
    const onSubmit = jest.fn();
    const { getByText, getByLabelText } = render(
        <UiProvider getWidgetForField={getWidgetForField}>
            <Form onSubmit={onSubmit}>
                {({ handleSubmit }): React.ReactElement => (
                    <form onSubmit={handleSubmit}>
                        <label>
                            Email
                            <Form.Field field={User.fields.email} />
                        </label>
                        <button type="submit">Submit</button>
                    </form>
                )}
            </Form>
        </UiProvider>
    );
    const emailInput = getByLabelText('Email');
    expect(emailInput.tagName).toBe('INPUT');
    fireEvent.change(emailInput, { target: { value: 'a@b.com' } });
    fireEvent.click(getByText('Submit'));
    expect(onSubmit).toHaveBeenLastCalledWith(
        { email: 'a@b.com' },
        expect.any(Object),
        expect.any(Function)
    );
});
