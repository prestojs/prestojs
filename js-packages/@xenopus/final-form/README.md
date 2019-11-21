# React Final Form Integration

Integration with [react-final-form](https://github.com/final-form/react-final-form) that fills out
the widget to use based on a ModelView field.

TODO: Review/expand this once interface settled

## Basic usage

```js
import React from 'react';
import { ModelViewForm } from '@xenopus/final-form';

function UserForm(onSubmit) {
    return (
        <ModelViewForm onSubmit={onSubmit}>
            <label>
                First Name <ModelViewForm.Field field={User.fields.firstName} />
            </label>
            <label>
                Last Name
                <ModelViewForm.Field field={User.fields.lastName} />
            </label>
            <button type="submit">Submit</button>
        </ModelViewForm>
    );
}
```
