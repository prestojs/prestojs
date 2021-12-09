import { ViewModelConstructor, ViewModelInterface } from '../ViewModelFactory';
import { AsyncChoicesInterface } from './AsyncChoices';

/**
 * @expand-properties
 */
export interface FieldProps<ValueT, SingleValueT = ValueT> {
    /**
     * Is this field allowed to be assigned a blank (null, undefined, "") value?
     *
     * Defaults to false
     */
    blank?: boolean;
    /**
     * Frontend values are often stored as strings even if they are not stored like that
     * in a backend (eg. database). Depending on your backend implementation it may expect
     * empty values to be represented as `null` rather than an empty string. Setting
     * `blankAsNull` to `true` indicates that empty strings should be converted to `null`
     * when being sent to the backend.
     */
    blankAsNull?: boolean;
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
    defaultValue?: ValueT | null | (() => Promise<ValueT | null> | ValueT | null);
    // A field can have choices regardless of it's type.
    // eg. A CharField and IntegerField might both optionally have choices
    // TODO: Best way to handle remote choices? Should this be part of this
    // interface, eg. make it async?
    // In djrad we had: choiceRefinementUrl
    /**
     * Choices for this field. Should be a mapping of value to the label for the choice.
     */
    choices?: Map<SingleValueT, string> | [SingleValueT, string][];
    /**
     * Asynchronous choices for this field.
     *
     * Only one of `asyncChoices` and `choices` should be passed.
     */
    asyncChoices?: AsyncChoicesInterface<any, SingleValueT>;
    /**
     * True if field should be considered read only (eg. excluded from forms)
     */
    readOnly?: boolean;
    /**
     * True if field should be considered write only (eg. excluded from detail views)
     */
    writeOnly?: boolean;
}

class UnboundFieldError<T, ParsableType, SingleType> extends Error {
    constructor(field: Field<T, ParsableType, SingleType>) {
        const msg = `Field ${field} has not been bound to it's model. Check that the fields of the associated class are defined on the static '_fields' property and not 'fields'.`;
        super(msg);
    }
}

/**
 * Base Field
 *
 * @extract-docs
 * @menu-group Fields
 * @template ValueType The type of the value for this field.
 * @template ParsableType The type this field knows how to parse into the ValueType
 * @template SingleType The type of a single value for this field. This is only different from `ValueType` if `ValueType` is eg. an array type
 */
export default class Field<ValueT, ParsableValueT extends any = ValueT, SingleValueT = ValueT> {
    // These are just for internal usage with typescript
    /**
     * @private
     */
    __fieldValueType: ValueT;
    /**
     * @private
     */
    __parsableValueType: ParsableValueT;

    private _model: ViewModelConstructor<any, any>;
    public set model(viewModel: ViewModelConstructor<any, any>) {
        this._model = viewModel;
    }

    /**
     * The [ViewModel](doc:viewModelFactory) class this field is attached to.
     *
     * This will throw an error if the field is not attached to a model.
     */
    public get model(): ViewModelConstructor<any, any> {
        if (!this._model) {
            throw new UnboundFieldError<ValueT, ParsableValueT, SingleValueT>(this);
        }
        return this._model;
    }

    private _name: string;
    public set name(name: string) {
        this._name = name;
    }

    /**
     * The name of this field.
     *
     * This will throw an error if the field is not attached to a model.
     */
    public get name(): string {
        if (!this._name) {
            throw new UnboundFieldError<ValueT, ParsableValueT, SingleValueT>(this);
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

    /**
     * Is this field required when saving a record?
     */
    public blank: boolean;
    /**
     * If true an empty string value should be converted to a null value
     */
    public blankAsNull: boolean;
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
    public choices?: Map<SingleValueT, string>;
    /**
     * Async choices for this field.
     */
    public asyncChoices?: AsyncChoicesInterface<any, SingleValueT>;
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
    protected _defaultValue?: ValueT | null | (() => Promise<ValueT | null> | ValueT | null);

    constructor(values: FieldProps<ValueT, SingleValueT> = {}) {
        const {
            blank = false,
            blankAsNull = false,
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
        if (blank !== undefined && typeof blank !== 'boolean') {
            throw new Error(`"blank" should be a boolean, received: ${blank}`);
        }
        if (blankAsNull !== undefined && typeof blankAsNull !== 'boolean') {
            throw new Error(`"blankAsNull" should be a boolean, received: ${blankAsNull}`);
        }
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
                    'blank',
                    'blankAsNull',
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

        this.blank = blank;
        this.blankAsNull = blankAsNull;
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
    public format(value: ValueT): any {
        return value;
    }

    /**
     * Parse a value received from a form widget `onChange` call. eg. This could convert a localized date string
     * into a `Date`.
     * @param value
     */
    public parse(value: ParsableValueT | null): ValueT | null {
        return value as unknown as ValueT;
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
    public normalize(value: ParsableValueT): ValueT | null {
        return value as unknown as ValueT;
    }

    /**
     * Convert value to plain JS representation useful for things like passing to a form or posting to
     * a backend API
     * @param value
     */
    toJS(value: ValueT): string | number | null | {} {
        return value;
    }

    /**
     * Get the default value for this field.
     */
    get defaultValue(): Promise<ValueT | null | undefined> | ValueT | null | undefined {
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
    public isEqual(value1: ValueT, value2: ValueT): boolean {
        return value1 === value2;
    }

    /**
     * Returns a clone of the field that should be functionally equivalent
     */
    public clone(): Field<ValueT> {
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
    public get value(): undefined | ValueT {
        console.warn('Accessed value on unbound field - this will never return a value');
        return undefined;
    }

    /**
     * When accessed on a [bound field](doc:viewModelFactory#var-_f) will return the current instance of the ViewModel
     * the field is bound to.
     *
     * If called on an unbound field then this will always be undefined and a warning will be raised.
     */
    public get boundRecord(): undefined | ViewModelInterface<any, any> {
        console.warn('Accessed value on unbound field - this will never return a value');
        return undefined;
    }

    /**
     * Called once after fields are attached to a ViewModel. This occurs the first time `.fields` is
     * accessed on the ViewModel.
     *
     * By default this does nothing but can be used by fields to attach extra properties or validate
     * against the final view model (for example checking that another field does / does not exist).
     *
     * NOTE: This is called for every distinct ViewModel class; so if class A is extended by class B
     * then it will be called on both A and B.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public contributeToClass(viewModel: ViewModelConstructor<any, any>): void {
        // Do nothing by default
    }
}

export interface RecordBoundField<ValueT, ParsableType extends any = ValueT, SingleValueT = ValueT>
    extends Field<ValueT, ParsableType, SingleValueT> {
    readonly value: ValueT;
    readonly isBound: true;
    readonly boundRecord: ViewModelInterface<any, any>;
}
