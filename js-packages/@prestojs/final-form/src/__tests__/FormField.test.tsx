import { UiProvider } from '@prestojs/ui';
import { NumberField, viewModelFactory } from '@prestojs/viewmodel';
import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import Form from '../Form';

class User extends viewModelFactory(
    {
        id: new NumberField(),
        age: new NumberField({ label: 'Age', defaultValue: 5 }),
        name: new NumberField({ label: 'Name', defaultValue: (): string => 'dynamic' }),
    },
    { pkFieldName: 'id' }
) {
    static label = 'User';
    static labelPlural = 'Users';
}

function Widget({ input, ...props }): React.ReactElement {
    return <input name={input.name} placeholder={input.name} {...props} />;
}

function getWidgetForField(): typeof Widget {
    return Widget;
}

test('FormField should provide default widget when none specified', () => {
    function TestWrapper(props): React.ReactElement {
        return (
            <UiProvider getWidgetForField={getWidgetForField}>
                <Form onSubmit={jest.fn()}>
                    {({ handleSubmit }): React.ReactElement => (
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="age" id="age-label">
                                Age
                                <Form.Field field={User.fields.age} {...props} id="age" />
                            </label>
                        </form>
                    )}
                </Form>
            </UiProvider>
        );
    }
    const { rerender, getByLabelText } = render(<TestWrapper />);
    expect(getByLabelText('Age').tagName).toBe('INPUT');
    expect(getByLabelText('Age').getAttribute('placeholder')).toBe('age');
    // Specifying render, component or children should mean we don't inject a widget but
    // use whatever is passed in
    rerender(<TestWrapper component="textarea" />);
    expect(getByLabelText('Age').tagName).toBe('TEXTAREA');
    rerender(<TestWrapper render={(props): React.ReactElement => <select {...props} />} />);
    expect(getByLabelText('Age').tagName).toBe('SELECT');
    rerender(
        <TestWrapper>
            {(): React.ReactElement => <div id="age" aria-labelledby="age-label" />}
        </TestWrapper>
    );
    expect(getByLabelText('Age').tagName).toBe('DIV');
});

test('FormField should use field default', () => {
    const onSubmit = jest.fn();
    function TestWrapper({
        initialValues,
        defaultValue,
    }: { initialValues?: {}; defaultValue?: number } = {}): React.ReactElement {
        return (
            <UiProvider getWidgetForField={getWidgetForField}>
                <Form onSubmit={onSubmit} initialValues={initialValues}>
                    {({ handleSubmit }): React.ReactElement => (
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="age">
                                Age
                                <Form.Field
                                    field={User.fields.age}
                                    defaultValue={defaultValue}
                                    id="age"
                                />
                            </label>
                            <label htmlFor="name">
                                Name
                                <Form.Field field={User.fields.name} id="name" />
                            </label>
                            <button type="submit">Submit</button>
                        </form>
                    )}
                </Form>
            </UiProvider>
        );
    }
    const { rerender, getByText } = render(<TestWrapper />);
    fireEvent.click(getByText('Submit'));
    expect(onSubmit).toHaveBeenLastCalledWith(
        { age: 5, name: 'dynamic' },
        expect.any(Object),
        expect.any(Function)
    );
    rerender(<TestWrapper defaultValue={666} />);
    fireEvent.click(getByText('Submit'));
    // Prior to final-form 4.20.2 this would change to use the updated value. Since that release
    // this changed to not do that any longer.
    expect(onSubmit).toHaveBeenLastCalledWith(
        { age: 5, name: 'dynamic' },
        expect.any(Object),
        expect.any(Function)
    );

    // Override field specific with initialValues
    rerender(<TestWrapper key="force-reinit" initialValues={{ age: 20 }} />);
    fireEvent.click(getByText('Submit'));
    expect(onSubmit).toHaveBeenLastCalledWith(
        { age: 20, name: 'dynamic' },
        expect.any(Object),
        expect.any(Function)
    );
});
