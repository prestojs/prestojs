import NumberFormatter from '../formatters/NumberFormatter';

test('NumberFormatter format numbers correctly', () => {
    expect(NumberFormatter({ value: null })).toBeNull();

    expect(NumberFormatter({ value: 1 })).toBe('1');

    expect(NumberFormatter({ value: 0.69 })).toBe('0.69');

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(NumberFormatter({ value: '42' })).toBe('42');

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(NumberFormatter({ value: 'ulururu' })).toBeNull();

    expect(NumberFormatter({ value: 5000 })).toBe('5,000');

    expect(
        NumberFormatter({
            value: 5000,
            localeOptions: { style: 'currency', currency: 'USD', currencyDisplay: 'code' },
        })
    ).toBe('USD 5,000.00');
});
