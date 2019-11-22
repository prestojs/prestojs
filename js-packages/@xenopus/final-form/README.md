# React Final Form Integration

Integration with [react-final-form](https://github.com/final-form/react-final-form) that fills out
the widget to use based on a ViewModel field.

TODO: Review/expand this once interface settled

## Basic usage

```js
import React from 'react';
import { Form } from '@xenopus/final-form';

function UserForm(onSubmit) {
    return (
        <Form onSubmit={onSubmit}>
            <Form.Item field={User.fields.firstName} />
            <Form.Item field={User.fields.lastName} />
            <Form.Item field={User.fields.email} />
            <Form.Item field={User.fields.email} name="emailConfirmation" label="Confirm Email" />
            <Form.Item>
                <Form.Field name="signUpNewsletter">
                    {({ input }) => <Checkbox {...input}>Sign up to newsletter?</Checkbox>}
                </Form.Field>
            </Form.Item>
            <button type="submit">Submit</button>
        </Form>
    );
}
```
