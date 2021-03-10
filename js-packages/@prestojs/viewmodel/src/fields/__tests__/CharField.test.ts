import CharField from '../CharField';

test('CharField options validation', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => new CharField({ label: 'phone number', maxLength: 'yes' })).toThrowError(
        '"maxLength" should be a number, received: yes'
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => new CharField({ label: 'phone number', maxLength: -5 })).toThrowError(
        '"maxLength" should be a positive number, received: -5'
    );

    new CharField({
        label: 'a',
        maxLength: 7,
    });
});
