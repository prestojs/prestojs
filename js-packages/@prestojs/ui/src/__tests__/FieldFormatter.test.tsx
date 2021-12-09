import { Field, viewModelFactory } from '@prestojs/viewmodel';
import { render } from '@testing-library/react';
import React from 'react';
import FieldFormatter from '../FieldFormatter';

import UiProvider from '../UiProvider';

test('FieldFormatter should support record bound fields or passing value direct', () => {
    function DefaultFormatter({ value }): React.ReactElement {
        return value;
    }
    function SpecialFormatter({ value }): React.ReactElement {
        return value.toUpperCase();
    }
    function getFormatter(field): React.ComponentType<any> {
        if (field.name === 'field2') {
            return SpecialFormatter;
        }
        return DefaultFormatter;
    }
    function TestWrapper(props): React.ReactElement {
        return (
            <UiProvider getFormatterForField={getFormatter}>
                <FieldFormatter {...props} />
            </UiProvider>
        );
    }

    class A extends viewModelFactory(
        {
            id: new Field(),
            field1: new Field(),
            field2: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    const record = new A({ id: 1, field1: 'normal', field2: 'special' });

    const { rerender, container } = render(<TestWrapper field={record._f.field1} />);
    expect(container.innerHTML).toBe('normal');

    rerender(<TestWrapper field={record._f.field2} />);
    expect(container.innerHTML).toBe('SPECIAL');

    rerender(<TestWrapper field={record._f.field2} value="whatever" />);
    expect(container.innerHTML).toBe('WHATEVER');

    rerender(<TestWrapper field={record._f.field1} value="whatever" />);
    expect(container.innerHTML).toBe('whatever');
});
