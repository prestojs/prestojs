interface Props<T> {
    required?: boolean;
    name: string;
    label: string;
    helpText?: string;
    defaultValue?: T | (() => Promise<T>);
    // A field can have choices regardless of it's type.
    // eg. A CharField and IntegerField might both optionally have choices
    // TODO: Best way to handle remote choices? Should this be part of this
    // interface, eg. make it async?
    // In djrad we had: choiceRefinementUrl
    choices?: Map<T, string>;
    readOnly?: boolean;
    writeOnly?: boolean;
}
export default class Field<T> {
    public required: boolean;
    public name: string;
    public label: string;
    public helpText?: string;
    // A field can have choices regardless of it's type.
    // eg. A CharField and IntegerField might both optionally have choices
    // TODO: Best way to handle remote choices? Should this be part of this
    // interface, eg. make it async?
    // In djrad we had: choiceRefinementUrl
    public choices?: Map<T, string>;
    public readOnly: boolean;
    public writeOnly: boolean;

    protected _defaultValue?: T | (() => Promise<T>);

    constructor(values: Props<T>) {
        const {
            required = false,
            name,
            label,
            helpText,
            defaultValue,
            choices,
            readOnly = false,
            writeOnly = false,
        } = values;
        this.required = required;
        this.name = name;
        this.label = label;
        this.helpText = helpText;
        this._defaultValue = defaultValue;
        this.choices = choices;
        this.readOnly = readOnly;
        this.writeOnly = writeOnly;
    }

    public format(value: T): any {
        return value;
    }

    public parse(value: any): T {
        return value;
    }

    get defaultValue(): Promise<T | null> {
        if (this._defaultValue instanceof Function) {
            return this._defaultValue();
        }
        return Promise.resolve(this._defaultValue);
    }
}
