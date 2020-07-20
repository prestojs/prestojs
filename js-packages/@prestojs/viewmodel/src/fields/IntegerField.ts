import NumberField from './NumberField';

/**
 * @extract-docs
 * @menu-group Fields
 */
export default class IntegerField extends NumberField<number> {
    static fieldClassName = 'IntegerField';
    parse(value: any): number | null {
        if (value === '' || value == null) {
            return null;
        }
        if (Number.isNaN(Number(value))) {
            return value;
        }
        return parseInt(value, 10);
    }
}
