import {
    FieldFormatter,
    getFormatterForField as defaultGetFormatterForField,
    UiProvider,
} from '@prestojs/ui';
import { CharField, IntegerField, viewModelFactory } from '@prestojs/viewmodel';
import { Suspense } from 'react';

function UpperCaseFormatter({ value }) {
    if (!value) {
        return value;
    }
    return value.toUpperCase();
}

class User extends viewModelFactory({
    name: new CharField(),
    age: new IntegerField(),
}) {}

function getFormatterForField(field) {
    if (field instanceof CharField) {
        return UpperCaseFormatter;
    }
    return defaultGetFormatterForField(field);
}
export default function App() {
    const user = new User({ id: 1, age: 56, name: 'Gaston' });
    return (
        <Suspense fallback={null}>
            <UiProvider getFormatterForField={getFormatterForField}>
                <dl>
                    <dt>Name</dt>
                    <dd>
                        <FieldFormatter field={user._f.name} />
                    </dd>
                    <dt>Age</dt>
                    <dd>
                        <FieldFormatter field={user._f.age} />
                    </dd>
                </dl>
            </UiProvider>
        </Suspense>
    );
}
