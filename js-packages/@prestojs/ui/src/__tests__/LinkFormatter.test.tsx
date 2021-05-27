import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/react';
import React from 'react';
import LinkFormatter from '../formatters/LinkFormatter';

test('LinkFormatter should accept blankLabel', () => {
    const { getByTestId, rerender } = render(
        <div data-testid="value">
            <LinkFormatter value={null} />
        </div>
    );
    expect(getByTestId('value')).toHaveTextContent('');
    rerender(
        <div data-testid="value">
            <LinkFormatter value={null} blankLabel="Not Found" />
        </div>
    );
    expect(getByTestId('value')).toHaveTextContent('Not Found');
});

test('LinkFormatter should accept extraProps', () => {
    const { getByTestId } = render(
        <LinkFormatter value="http://www.example.com/" id="abc" data-testid="value">
            Test
        </LinkFormatter>
    );
    expect(getByTestId('value')).toHaveTextContent('Test');
    expect(getByTestId('value')).toHaveAttribute('href', 'http://www.example.com/');
    expect(getByTestId('value')).toHaveAttribute('id', 'abc');
});

test('LinkFormatter should accept linkComponent', () => {
    function L(props: {
        href: string;
        children: React.ReactNode;
        className: string;
    }): React.ReactElement {
        return <a {...props} data-testid="value" />;
    }
    const { getByTestId } = render(
        <LinkFormatter linkComponent={L} value="http://www.example.com/" className="ok">
            Test
        </LinkFormatter>
    );
    expect(getByTestId('value')).toHaveTextContent('Test');
    expect(getByTestId('value')).toHaveAttribute('href', 'http://www.example.com/');
    expect(getByTestId('value')).toHaveAttribute('class', 'ok');
});
