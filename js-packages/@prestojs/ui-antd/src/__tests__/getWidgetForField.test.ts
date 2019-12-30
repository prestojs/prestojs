import NumberWidget from '../widgets/NumberWidget';
import getWidgetForField from '../getWidgetForField';
import { NumberField } from '@prestojs/viewmodel';

test('getWidgetForField should return widget for field', () => {
    const fieldArgs = { label: 'b' };
    class CustomDecimal extends NumberField {}
    expect(getWidgetForField(new NumberField(fieldArgs))).toBe(NumberWidget);
    // Descendant classes should map to same type
    expect(getWidgetForField(new CustomDecimal(fieldArgs))).toBe(NumberWidget);
});