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
        <ModelViewForm modelView={User} onSubmit={onSubmit}>
            {({ handleSubmit }) => (
                <form onSubmit={handleSubmit}>
                    <label>
                        First Name <ModelViewForm.Field name="firstName" />
                    </label>
                    <label>
                        Last Name
                        <ModelViewForm.Field name="Last Name" />
                    </label>
                    <button type="submit">Submit</button>
                </form>
            )}
        </ModelViewForm>
    );
}
```
