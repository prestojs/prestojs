import { Field, viewModelFactory } from '@prestojs/viewmodel';
import React from 'react';
import { render } from '@testing-library/react';

import UiProvider from '../UiProvider';
import FieldFormatter from '../FieldFormatter';

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

    class A extends viewModelFactory({
        field1: new Field(),
        field2: new Field(),
    }) {}
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
