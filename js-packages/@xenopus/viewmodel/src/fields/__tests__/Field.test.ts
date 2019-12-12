import CharField from '../CharField';
import Field from '../Field';

test('Field options validation', () => {
    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        () => new Field({ label: 'phone number', required: 3 })
    ).toThrowError('"required" should be a boolean, received: 3');

    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        () => new Field({ label: 'phone number', readOnly: {} })
    ).toThrowError('"readOnly" should be a boolean, received: [object Object]');

    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        () => new Field({ label: 'phone number', writeOnly: 'no' })
    ).toThrowError('"writeOnly" should be a boolean, received: no');

    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        () => new Field({ label: 'phone number', choices: 3 })
    ).toThrowError('"choices" should be Iterable, received: 3');

    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        () => new Field({ label: 'phone number', snake: 'oil' })
    ).toThrowError('Received unknown option(s): snake');

    new Field({
        label: 'a',
        required: false,
        helpText: 'Help',
        defaultValue: 1,
        choices: new Map(),
        readOnly: false,
        writeOnly: true,
    });
});

test('Field should clone correctly', () => {
    const f1 = new CharField({
        label: 'a',
        required: false,
        helpText: 'Help',
        defaultValue: 'default',
        choices: new Map(),
        readOnly: false,
        writeOnly: true,
    });
    const f2 = f1.clone();
    expect(Object.getPrototypeOf(f2)).toBe(Object.getPrototypeOf(f1));
    expect(f1.constructor).toBe(f2.constructor);
    expect(f2).toBeInstanceOf(Field);
    expect(f2).toBeInstanceOf(CharField);
    for (const prop of [
        'label',
        'required',
        'helpText',
        'defaultValue',
        'choices',
        'readOnly',
        'writeOnly',
    ]) {
        expect(f2[prop]).toEqual(f1[prop]);
    }
});
