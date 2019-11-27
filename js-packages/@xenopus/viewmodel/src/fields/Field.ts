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

/**
 * Base Field
 */
export default class Field<T> {
    /** Is this field required when saving a record? */
    public required: boolean;
    public name: string;
    /**
     * Label that can be displayed as the form label for a widget
     */
    public label: string;
    /**
     * Help text that can be displayed with the form widget
     */
    public helpText?: string;
    // A field can have choices regardless of it's type.
    // eg. A CharField and IntegerField might both optionally have choices
    // TODO: Best way to handle remote choices? Should this be part of this
    // interface, eg. make it async?
    // In djrad we had: choiceRefinementUrl
    public choices?: Map<T, string>;
    /**
     * Indicates this field should only be read, not written. Not enforced but can be used by components to adjust their
     * output accordingly (eg. exclude it from a form or show it on a form with a read only input)
     */
    public readOnly: boolean;
    /**
     * Indicates this field should only be written only and is not intended to be read directly. This is not enforced
     * but can be used by components to adjust their output accordingly (eg. exclude it from a detail view on a record)
     */
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

    /**
     * Format the value for displaying in a form widget. eg. This could convert a `Date` into
     * a localized date string
     *
     * @param value
     */
    public format(value: T): any {
        return value;
    }

    /**
     * Parse a value received from a form widget `onChange` call. eg. This could convert a localized date string
     * into a `Date`.
     * @param value
     */
    public parse(value: any): T | null {
        return value;
    }

    /**
     * Normalize a value passed into a ViewModel constructor. This could do things like extract the id of a nested
     * relation and only store that, eg.
     *
     * TODO: Do we need to handle things like normalizing to multiple fields? eg. In the example below setting the
     * id to addressId and relation to address
     *
     * ```js
     * // This might become
     * {
     *     name: 'Sam',
     *     address: {
     *         id: 5,
     *         formatted: '3 Somewhere Road, Some Place',
     *     },
     * }
     * // ...this
     * {
     *     name: 'Same',
     *     address: 5,
     * }
     * ```
     *
     * @param value
     */
    public normalize(value: any): T {
        return value;
    }

    /**
     * Convert value to plain JS representation useful for things like passing to a form or posting to
     * a backend API
     * @param value
     */
    toJS(value: T): string | number | null | {} {
        return value;
    }

    /**
     * Get the default value for this field. Note that this returns a promise that resolve to the default value
     * as some default values may need to resolve data from a backend.
     */
    get defaultValue(): Promise<T | null | undefined> {
        if (this._defaultValue instanceof Function) {
            return this._defaultValue();
        }
        return Promise.resolve(this._defaultValue);
    }

    toString(): string {
        const className = this.constructor.name;
        return `${className}({ name: "${this.name}" })`;
    }

    /**
     * Should two values be considered equal?
     *
     * This is used when determining if two records are equal (see ViewModel.isEqual)
     */
    public isEqual(value1: T, value2: T): boolean {
        return value1 === value2;
    }
}
