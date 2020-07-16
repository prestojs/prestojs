import FieldBinder from '../FieldBinder';
import { ViewModelConstructor } from '../ViewModelFactory';
import { AsyncChoicesInterface } from './AsyncChoices';

/**
 * @expand-properties
 */
export interface FieldProps<T> {
    /**
     * True if field is required when creating or updating a model
     */
    required?: boolean;
    /**
     * Label for this field. If not specified will be generated from the name.
     */
    label?: string;
    /**
     * Optional help text for this field that might be shown on a form
     */
    helpText?: string;
    /**
     * Default value for this field. This can either be a function that returns a value or the value directly.
     */
    defaultValue?: T | (() => Promise<T> | T);
    // A field can have choices regardless of it's type.
    // eg. A CharField and IntegerField might both optionally have choices
    // TODO: Best way to handle remote choices? Should this be part of this
    // interface, eg. make it async?
    // In djrad we had: choiceRefinementUrl
    /**
     * Choices for this field. Should be a mapping of value to the label for the choice.
     */
    choices?: Map<T, string> | [T, string][];
    /**
     * Asynchronous choices for this field.
     *
     * Only one of `asyncChoices` and `choices` should be passed.
     */
    asyncChoices?: AsyncChoicesInterface<any, T>;
    /**
     * True if field should be considered read only (eg. excluded from forms)
     */
    readOnly?: boolean;
    /**
     * True if field should be considered write only (eg. excluded from detail views)
     */
    writeOnly?: boolean;
}

class UnboundFieldError<T, K> extends Error {
    constructor(field: Field<T, K>) {
        const msg = `Field ${field} has not been bound to it's model. Check that the fields of the associated class are defined on the static '_fields' property and not 'fields'.`;
        super(msg);
    }
}

/**
 * Base Field
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class Field<T, ParsableType extends any = T> {
    // These are just for internal usage with typescript
    /**
     * @private
     */
    __fieldValueType: T;
    /**
     * @private
     */
    __parsableValueType: ParsableType;

    private _model: typeof FieldBinder;
    public set model(viewModel: typeof FieldBinder) {
        this._model = viewModel;
    }
    public get model(): typeof FieldBinder {
        if (!this._model) {
            throw new UnboundFieldError<T, ParsableType>(this);
        }
        return this._model;
    }

    private _name: string;
    public set name(name: string) {
        this._name = name;
    }
    public get name(): string {
        if (!this._name) {
            throw new UnboundFieldError<T, ParsableType>(this);
        }
        return this._name;
    }

    /**
     * Field class name
     *
     * This exists so things like [getWidgetForField](doc:getWidgetForField) can select a widget for
     * a field without needing to import all fields up front.
     *
     * For custom fields this isn't required unless your implementation of `getWidgetForField` wants
     * to do avoid importing the field up front.
     */
    static fieldClassName: string | null = null;

    /** Is this field required when saving a record? */
    public required: boolean;
    /**
     * Label that can be displayed as the form label for a widget
     *
     * If not specified will be generated from `name`.
     */
    public label?: string;
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
     * Async choices for this field.
     */
    public asyncChoices?: AsyncChoicesInterface<any, T>;
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

    /**
     * @private
     */
    protected _defaultValue?: T | (() => Promise<T> | T);

    constructor(values: FieldProps<T> = {}) {
        const {
            required = false,
            label,
            helpText,
            defaultValue,
            choices,
            asyncChoices,
            readOnly = false,
            writeOnly = false,
        } = values;

        if (choices && asyncChoices) {
            throw new Error("Only one of 'choices' and 'asyncChoices' should be provided");
        }

        if (required !== undefined && typeof required !== 'boolean')
            throw new Error(`"required" should be a boolean, received: ${required}`);
        if (choices !== undefined && !(Symbol.iterator in Object(choices)))
            throw new Error(`"choices" should be Iterable, received: ${choices}`);
        if (readOnly !== undefined && typeof readOnly !== 'boolean')
            throw new Error(`"readOnly" should be a boolean, received: ${readOnly}`);
        if (writeOnly !== undefined && typeof writeOnly !== 'boolean')
            throw new Error(`"writeOnly" should be a boolean, received: ${writeOnly}`);

        // disallow any option other than those included in the list
        // eslint-disable-next-line
        const unknowns = Object.keys(values).filter(
            key =>
                ![
                    'required',
                    'label',
                    'helpText',
                    'defaultValue',
                    'choices',
                    'asyncChoices',
                    'readOnly',
                    'writeOnly',
                ].includes(key)
        );

        if (unknowns.length) {
            throw new Error(`Received unknown option(s): ${unknowns.join(', ')}`);
        }

        this.required = required;
        this.label = label;
        this.helpText = helpText;
        this._defaultValue = defaultValue;
        this.asyncChoices = asyncChoices;
        if (choices) {
            this.choices = !(choices instanceof Map) ? new Map(choices) : choices;
        }
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
    public parse(value: ParsableType): T | null {
        return (value as unknown) as T;
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
    public normalize(value: ParsableType): T | null {
        return (value as unknown) as T;
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
     * Get the default value for this field.
     */
    get defaultValue(): Promise<T | null | undefined> | T | null | undefined {
        if (this._defaultValue instanceof Function) {
            return this._defaultValue();
        }
        return this._defaultValue;
    }

    toString(): string {
        const className = this.constructor.name;
        return `${className}({ name: "${this._name || '<unbound - name unknown>'}" })`;
    }

    /**
     * Should two values be considered equal?
     *
     * This is used when determining if two records are equal (see ViewModel.isEqual)
     */
    public isEqual(value1: T, value2: T): boolean {
        return value1 === value2;
    }

    /**
     * Returns a clone of the field that should be functionally equivalent
     */
    public clone(): Field<T> {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    /**
     * Returns true if field is bound to a ViewModel instance. When a field is bound to a instance
     * the value for that field is accessible on the 'value' property.
     */
    public get isBound(): boolean {
        // See ViewModel._f for implementation of when this will be true
        return false;
    }

    /**
     * When `isBound` is true this will return the current value of this field on the bound ViewModel.
     * Otherwise will always be undefined.
     */
    public get value(): undefined | T {
        console.warn('Accessed value on unbound field - this will never return a value');
        return undefined;
    }

    /**
     * Called after fields are attached to a ViewModel.
     *
     * By default this does nothing but can be used by fields to attach extra properties or validate
     * against the final view model (for example checking that another field does / does not exist).
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public contributeToClass(viewModel: ViewModelConstructor<any>): void {
        // Do nothing by default
    }
}

export interface RecordBoundField<T, ParsableType extends any = T> extends Field<T, ParsableType> {
    readonly value: T;
    readonly isBound: true;
}
