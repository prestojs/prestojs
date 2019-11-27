import NumberField from './NumberField';

export default class IntegerField extends NumberField<number> {
    parse(value: any): number {
        if (value === '' || value == null) {
            return null;
        }
        if (Number.isNaN(Number(value))) {
            return value;
        }
        return parseInt(value, 10);
    }
}
