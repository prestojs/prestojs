import fs from 'fs';
import path from 'path';
import viewModelFactory from '../../ViewModelFactory';
import CharField from '../CharField';
import Field from '../Field';
import { ManyRelatedViewModelField, RelatedViewModelField } from '../RelatedViewModelField';

// We want all provided fields to specify `fieldClassName` so can reliably be used in eg. getWidgetForField
test.each([
    ...fs
        .readdirSync(path.resolve(__dirname, '../'))
        .filter(f => f.endsWith('Field.ts') && f !== 'Field.ts' && f !== 'RelatedViewModelField.ts')
        .map(f => [f.split('.')[0], require('../' + f).default]),
    ['RelatedViewModelField', RelatedViewModelField],
    ['ManyRelatedViewModelField', ManyRelatedViewModelField],
])('%s should specify fieldClassName that matches the classes name', (fieldClassName, field) => {
    expect(field.fieldClassName).toBe(fieldClassName);
});

test('Field options validation', () => {
    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => new Field({ label: 'phone number', blank: 3 })
    ).toThrowError('"blank" should be a boolean, received: 3');

    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => new Field({ label: 'phone number', readOnly: {} })
    ).toThrowError('"readOnly" should be a boolean, received: [object Object]');

    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => new Field({ label: 'phone number', writeOnly: 'no' })
    ).toThrowError('"writeOnly" should be a boolean, received: no');

    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => new Field({ label: 'phone number', choices: 3 })
    ).toThrowError('"choices" should be Iterable, received: 3');

    expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => new Field({ label: 'phone number', snake: 'oil' })
    ).toThrowError('Received unknown option(s): snake');

    new Field({
        label: 'a',
        blank: true,
        blankAsNull: true,
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
        blank: true,
        blankAsNull: false,
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
        'blank',
        'blankAsNull',
        'helpText',
        'defaultValue',
        'choices',
        'readOnly',
        'writeOnly',
    ]) {
        expect(f2[prop]).toEqual(f1[prop]);
    }
});

test('boundRecord', () => {
    class A extends viewModelFactory(
        {
            id: new Field<number>(),
            field1: new Field(),
            field2: new Field(),
        },
        { pkFieldName: 'id' }
    ) {}
    const record = new A({ id: 1, field1: 'normal', field2: 'special' });
    const mockWarn = jest.spyOn(global.console, 'warn');
    mockWarn.mockImplementation(() => undefined);
    expect(A.fields.field1.boundRecord).toBeUndefined();
    expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Accessed value on unbound field - this will never return a value')
    );
    mockWarn.mockClear();
    expect(record._f.field1.boundRecord).toBe(record);
    expect(mockWarn).not.toHaveBeenCalled();
});
