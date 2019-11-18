import React from 'react';
import { render } from '@testing-library/react';
import ModelView from '../ModelView';
import ModelViewProvider from '../ModelViewProvider';
import useModelView from '../useModelView';

test('useModelView should error if no provider', () => {
    // Supress error logs. Even though we catch it below React with log errors out.
    const mockError = jest.spyOn(global.console, 'error').mockImplementation(() => {});
    function TestWrapper(): null {
        useModelView();
        return null;
    }
    expect(() => render(<TestWrapper />)).toThrowError(/used within a ModelViewProvider/);
    mockError.mockRestore();
});

test('ModelViewProvider should provide ModelView', () => {
    function Inner(): React.ReactElement {
        const { modelView } = useModelView();

        return <>{modelView._meta.label}</>;
    }
    function TestWrapper({ modelView }): React.ReactElement {
        return (
            <ModelViewProvider modelView={modelView}>
                <Inner />
            </ModelViewProvider>
        );
    }
    class User extends ModelView {
        static _meta = {
            label: 'User',
            labelPlural: 'Users',
        };
    }
    class Booking extends ModelView {
        static _meta = {
            label: 'Booking',
            labelPlural: 'Bookings',
        };
    }
    const { rerender, container } = render(<TestWrapper modelView={User} />);
    expect(container.innerHTML).toBe('User');
    rerender(<TestWrapper modelView={Booking} />);
    expect(container.innerHTML).toBe('Booking');
});
