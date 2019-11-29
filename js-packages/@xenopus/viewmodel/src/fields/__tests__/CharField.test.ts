import CharField from '../CharField';

test('CharField options validation', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(
        () => new CharField({ name: 'phoneNumber', label: 'phone number', maxLength: 'yes' })
    ).toThrowError('Field phoneNumber: "maxLength" should be a number, received: yes');

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(
        () => new CharField({ name: 'phoneNumber', label: 'phone number', maxLength: -5 })
    ).toThrowError('Field phoneNumber: "maxLength" should be a positive number, received: -5');

    new CharField({
        name: 'a',
        label: 'a',
        maxLength: 7,
    });
});
