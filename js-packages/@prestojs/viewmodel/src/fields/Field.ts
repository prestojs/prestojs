import { ViewModelConstructor, ViewModelInterface } from '../ViewModelFactory';
import { AsyncChoicesInterface } from './AsyncChoices';

export interface DefaultValueFunction<ValueT> {
    /**
     * A function that returns the default value to use
     *
     * ```js
     * new DateField({
     *    // Default to current date
     *    defaultValue: () => new Date(),
     * });
     * ```
     *
     * @returns The function can either return the default value directly or a `Promise` that resolves to the default value
     */
    (): Promise<ValueT | null> | ValueT | null;
}

/**
 * @expandproperties
 */
export interface FieldProps<ValueT, SingleValueT = ValueT> {
    /**
     * Is this field allowed to be assigned a blank (null, undefined, "") value?
     *
     * This isn't currently used by anything in PrestoJS but is useful if you are creating
     * generic validators for form values.
     *
     * Defaults to `false`
     */
    blank?: boolean;
    /**
     * Frontend values are often stored as strings even if they are not stored like that
     * in a backend (eg. database). Depending on your backend implementation it may expect
     * empty values to be represented as `null` rather than an empty string. Setting
     * `blankAsNull` to `true` indicates that empty strings should be converted to `null`
     * when being sent to the backend.
     *
     * This isn't currently used by anything inPrestoJS but is useful if you are writing generic
     * data transformations.
     */
    blankAsNull?: boolean;
    /**
     * Label for this field. If not specified will be generated from the name.
     *
     * This is rendered by [FormItem](doc:FormItem) as the label for a form input.
     */
    label?: string;
    /**
     * Optional help text for this field that might be shown on a form
     *
     * This rendered by [FormItem](doc:FormItem) under the field widget.
     */
    helpText?: string;
    /**
     * Default value for this field. This can either be a function that returns a value or the value directly.
     */
    defaultValue?: ValueT | null | DefaultValueFunction<ValueT>;
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
     * Asynchronous choices for this field. [AsyncChoices](doc:AsyncChoices) can be used to define
     * how choices for a field can be retrieved asynchronously (eg. from a REST endpoint on a remote
     * server) and handle things like pagination.
     *
     * Only one of `asyncChoices` and `choices` should be passed.
     *
     * In the Alliance Platform this is usually codegenerated for classes that have been decorated
     * with the `@server_choices` decorator.
     */
    asyncChoices?: AsyncChoicesInterface<any, SingleValueT>;
    /**
     * True if field should be considered read only (eg. excluded from forms)
     *
     * This isn't used by anything in PrestoJS but is useful if generating forms from a ViewModel (eg. you could exclude
     * `readOnly` fields from a form).
     */
    readOnly?: boolean;
    /**
     * True if field should be considered write only (eg. excluded from detail views)
     *
     * This isn't used by anything in PrestoJS but is useful if rendering values from ViewModel generically (eg. you
     * could exclude `writeOnly` fields from display).
     */
    writeOnly?: boolean;
    /**
     * Any arbitrary props that should be passed to widget components
     *
     * These props are included in [Field.getWidgetProps](doc:Field#Method-getWidgetProps) and are
     * passed to components by [getWidgetForField](doc:getWidgetForField).
     *
     * It's up to the component implementations to make use of them. By default the `@prestojs/ui-antd` components
     * should support any of the underlying `antd` component props via this option.
     *
     * ```js
     * new Field({ widgetProps: { placeholder: 'Enter you name' }})
     * ```
     */
    widgetProps?: Record<string, any>;
    /**
     * Any arbitrary props that should be passed to formatter components
     *
     * These props are included in [Field.getFormatterProps](doc:Field#Method-getFormatterProps) and are
     * passed to components by [getFormatterForField](doc:getFormatterForField).
     *
     * It's up to the component implementations to make use of them.
     *
     * ```js
     * new BooleanField({ formatterProps: { trueLabel: '✅', falseLabel: '❌' }})
     * ```
     */
    formatterProps?: Record<string, any>;
}

class UnboundFieldError<T, ParsableType, SingleType> extends Error {
    constructor(field: Field<T, ParsableType, SingleType>) {
        const msg = `Field ${field} has not been bound to it's model. Check that the fields of the associated class are defined on the static '_fields' property and not 'fields'.`;
        super(msg);
    }
}

/**
 * Props that are exposed by a specific [Field](doc:Field) for use by widget components
 *
 * @expandproperties
 */
export interface ViewModelFieldWidgetProps {
    /**
     * Any props passed through to the `Field` under the `widgetProps` option.
     */
    [propName: string]: any;
}

/**
 * Props that are exposed by a specific [Field](doc:Field) for use by formatter components
 *
 * @expandproperties
 */
export interface ViewModelFieldFormatterProps {
    /**
     * Any props passed through to the `Field` under the `widgetProps` option.
     */
    [propName: string]: any;
}

/**
 * The base class all fields extend from.
 *
 * > This field can be instantiated directly but won't have any special handling for the types of values
 * > the field can take and so in general you should choose a more specific instance. This is also desirable
 * > as it means [getWidgetForField](doc:getWidgetForField) and [getFormatterForField](doc:getFormatterForField)
 * > can choose more appropriate components for a field.
 *
 * A `Field` serves two primary purposes:
 *
 * * It handles parsing a value as it comes in (eg. converting from a string to a `Date`).
 *
 * * Stores some properties that can be used elsewhere to generate UI. For example, based on the field type,
 *   [FieldFormatter](doc:FieldFormatter) can choose the appropriate formatter class to render the value. Or a
 *   generic view for a [ViewModel](doc:viewModelFactory) instance can show the `label` or `helpText` relevant to
 *   each field.
 *
 * You can create an instance of a field in isolation and access some of its attributes:
 *
 * ```js
 * const email = new EmailField({ label: 'Email Address' });
 * email.label === 'Email Address';
 * // This will throw an error as it's not 'bound' to a view model
 * // yet and the name can't be inferred.
 * email.name
 * ```
 *
 * but mostly you use fields in the context of a `ViewModel`. You do this by passing an object keyed by the field name
 * with values being the corresponding field instances to [viewModelFactory](doc:viewModelFactory):
 *
 * ```js
 * const fields = {
 *     id: new Field(),
 *     email: new EmailField(),
 * }
 * class User extends viewModelFactory(fields, { pkFieldName: 'id' }) {
 * }
 * User.fields.email.name === 'email';
 * User.fields.email.label === 'Email';
 * User.fields.email.model === User;
 * ```
 *
 * Some attributes of a field will be inferred from their usage. `name` will be set to match the key name on the
 * fields object passed to `viewModelFactory`. `label` will be generated from the name (eg. `emailAddress` => `"Email Address"`)
 * if not explicitly provided. Once a field has been attached to a ViewModel you can access the ViewModel via the
 * `model` attribute.
 *
 * ### Types
 *
 * If you are instantiating `Field` directly you can specify the types it can take:
 *
 * ```js
 * const age = new Field<number>()
 * ```
 *
 * This indicates the value of `age` when used on a `ViewModel` will be of type `number`. `value` here means the type
 * when you access the field value via the record:
 *
 * ```js
 * class Person extends viewModelFactory({
 *     id: new Field(),
 *     age: new IntegerField(),
 * }, { pkFieldName: "id" }) {}
 * const jo = new Person({ id: 1, age: "33" });
 * jo.age
 * // 33 (as a number - not a string)
 * ```
 *
 * You can specify the parsable type for a field - that is the types of values the field will happily convert
 * into the value type for a field. For example [IntegerField](doc:IntegerField) is defined as something like:
 *
 * ```js
 * class IntegerField extends NumberField<number, string | number> {
 *     parse(value: any): number | null {
 *         if (value === '' || value == null) {
 *             return null;
 *         }
 *         if (Number.isNaN(Number(value))) {
 *             return value;
 *         }
 *         return parseInt(value, 10);
 *     }
 * }
 * ```
 *
 * The parseable type here is either a `string` or a `number` but the value is always a `number`.
 *
 * Finally, you can specify `SingleValueT` as well which is useful if you have a collection of values as in
 * [ListField](doc:ListField). Here it's useful to specify the value when dealing with a single item
 * in the collection. `ListField` will be an array of values of type `T` but when you access the field
 * from a model it will be of type `T[]`:
 *
 * ```js
 * class ListField<T, ParsableType = T> extends Field<T[], ParsableType[], T> {
 * }
 * ```
 *
 * ### Creating custom fields
 *
 * To create a custom field simply extend `Field` and implement the relevant methods. If you are using typescript
 * pass through the relevant types as described above.
 *
 * ```ts
 * type ImageData = { url: string; width: number; height: number }
 * class ImageDataField extends Field<ImageData> {
 *    isEqual(a: ImageData, b: ImageData) {
 *        return a.url === b.url;
 *    }
 * }
 * ```
 *
 * You can then also create a formatter and widget for it and add them to `getFormatterForField` and
 * `getWidgetForField` on [UiProvider](doc:UiProvider). This allows you to use the generic [FieldFormatter](doc:FieldFormatter)
 * and [FormItem](doc:FormItem) or [FormField](doc:FormField) components to select the appropriate component based
 * on the ViewModel being rendered.
 *
 * <Alert type="info">
 * The most common functions to override are:
 *
 * * [normalize](#Call-signature-normalize) is called when a `ViewModel` is constructed to convert the incoming
 *   value into the value stored on the record.
 * * [parse](#Call-signature-parse) is used to parse a value received from a [Form](doc:Form) (eg. this could convert
 *   a string to a `Date`).
 * * [format](#Call-signature-parse) is used to format a value to be displayed in the form (eg. this could convert
 *   a `Date` to a string)
 * * [isEqual](#Call-signature-isEqual) is used to compare two values (defaults to strict equality). This is used by
 *   [viewModelFactory.isEqual](doc:viewModelFactory#Call-signature-isEqual) to determine if two records are equivalent.
 * </Alert>
 *
 *
 * ### Field choices
 *
 * Most fields can accept choices that are used to limit the possible values the field will take. This is used
 * by widgets like [ChoicesWidget](doc:ChoicesWidget) to provide a fixed list of values to choose from on a form.
 * [ChoiceFormatter](doc:ChoiceFormatter) can be used to render the label for a choice value.
 *
 * Choices can be defined as either a [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
 * or an array of 2-tuples being the value and label for that value. For example these are equivalent:
 *
 * ```js
 * const choices: [string, string][] = [
 *     ['kiwi', '🥝'],
 *     ['strawberry', '🍓'],
 *     ['lemon', '🍋'],
 *     ['mango', '🥭'],
 *     ['peach', '🍑'],
 *     ['pineapple', '🍍'],
 * ];
 * // You can pass through the array directly
 * new Field({ choices });
 * // Or a Map
 * new Field({ choices: new Map(choices) });
 * ```
 *
 * If you access the choices via the [choices property](#Properties-choices) it will always be a `Map`.
 *
 * ### Async Choices
 *
 * Static choices are fine for many cases but for cases like a foreign key to another record the list of
 * available choices has to be loaded dynamically and may need server side filtering or pagination if there
 * could be to many records to efficiently load upfront. In these cases [AsyncChoices](doc:AsyncChoices)
 * are a good option but somewhat more complicated.
 *
 * ### RecordBoundField
 *
 * A `RecordBoundField` is a field that is bound to a specific record and can be used to access the value on the `value`
 * property. This is used by the [_f](doc:BaseViewModel#Property-_f) property on [BaseViewModel](doc:BaseViewModel). The
 * `boundRecord` attribute will also point back to the source record.
 *
 *
 * @extractdocs
 * @menugroup Fields
 * @typeParam ValueT The type of the value this field will take when used on a `ViewModel`.
 * @typeParam ParsableValueT This the type the field knows how to parse into `ValueT` when constructing a `ViewModel`.
 * @typeParam SingleValueT The type of a single value for this field. This is only different from `ValueT` if `ValueT` represents multiple values (eg. an array as in [ListField](doc:ListField)).
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
     * This is set automatically when the `ViewModel` is created based on the object `key` the
     * field was set on:
     *
     * ```js
     * // The field here will get a `name` of `id` as that matches the key in the object.
     * viewModelFactory({ id: new Field() }, { pkFieldName: 'id' })
     * ```
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
     * This exists so [getWidgetForField](doc:getWidgetForField) and [getFormatterForField](doc:getFormatterForField)
     * can select the widget or formatter for a field without needing to import all fields up front.
     * For example the following example avoids importing any code upfront that isn't needed which wouldn't
     * be possible if using `instanceof`.
     *
     * ```js
     * if (field.fieldClassName === 'ImageField') {
     *     return React.lazy(() => import('./components/ImageWidget'))
     * }
     * ```
     *
     * For custom fields this isn't required unless your implementation of `getWidgetForField` wants
     * to avoid importing the field up front.
     */
    static fieldClassName: string | null = null;

    /**
     * Is this field required when saving a record?
     *
     * This isn't currently used by anything in PrestoJS but is useful if you are creating
     * generic validators for form values.
     */
    public blank: boolean;
    /**
     * If true an empty string value should be converted to a null value
     *
     * This isn't currently used by anything inPrestoJS but is useful if you are writing generic
     * data transformations (eg. transforming a form submission to send to the server) and need
     * to know whether a value should be forced to null.
     */
    public blankAsNull: boolean;
    /**
     * Label that can be displayed as the form label for a widget
     *
     * If not specified will be generated from `name`.
     *
     * This is rendered by [FormItem](doc:FormItem) as the label for a form input.
     */
    public label?: string;
    /**
     * Help text that can be displayed with the form widget
     *
     * This rendered by [FormItem](doc:FormItem) under the field widget.
     */
    public helpText?: string;
    /**
     * The choices defined for this field (if any).
     *
     * When constructing the field you can pass in choices as either a
     * [Map]((https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)) of
     * value to label or an array of 2-tuples being the value and label for that value. When retrieved
     * from the field these are always returned as a
     * [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).
     */
    public choices?: Map<SingleValueT, string>;
    /**
     * Async choices for this field.
     *
     * This can be used with [SelectAsyncChoicesWidget](doc:SelectAsyncChoicesWidget) or
     * [useAsyncChoices](doc:useAsyncChoices) to retrieve the choices.
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
     * Any props for components that use this field that were passed through to the `Field`. Don't access this directly -
     * call `getWidgetProps` instead.
     */
    protected widgetProps: Record<string, any>;
    /**
     * Any props for components that use this field that were passed through to the `Field`. Don't access this directly -
     * call `getFormatterProps` instead.
     */
    protected formatterProps: Record<string, any>;

    /**
     * @private
     */
    protected _defaultValue?: ValueT | null | (() => Promise<ValueT | null> | ValueT | null);

    constructor(options: FieldProps<ValueT, SingleValueT> = {}) {
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
            widgetProps = {},
            formatterProps = {},
        } = options;
        this.widgetProps = widgetProps;
        this.formatterProps = formatterProps;

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
        const unknowns = Object.keys(options).filter(
            key =>
                ![
                    'widgetProps',
                    'formatterProps',
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
     * @param value The value from the `ViewModel` to format for use in a widget.
     */
    public format(value: ValueT): any {
        return value;
    }

    /**
     * Parse a value received from a form widget `onChange` call. eg. This could convert a localized date string
     * into a `Date`.
     *
     * This implementation will often match [normalize](#Call-signature-normalize) which performs a similar function
     * but processes the values received by the `ViewModel`. In general `parse` should not throw on invalid input (eg.
     * user could be part way through entering a value) whereas `normalize` should.
     *
     * @param value The value received from a form widget
     */
    public parse(value: ParsableValueT | null): ValueT | null {
        return value as unknown as ValueT;
    }

    /**
     * Normalize a value passed into a ViewModel constructor. This could do things like parse a date string to
     * a `Date`.
     *
     * This implementation will often match [parse](#Call-signature-parse) which performs a similar function
     * but for values received from a form input. In general `normalize` should throw on invalid input whereas
     * `parse` should not.
     *
     * @param value The value to normalize
     */
    public normalize(value: ParsableValueT): ValueT | null {
        return value as unknown as ValueT;
    }

    /**
     * Convert value to plain JS representation useful for things like passing to a form or posting to
     * a backend API
     *
     * @param value The value to convert
     */
    toJS(value: ValueT): string | number | null | Record<string, any> {
        return value as any;
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

    /**
     * Return a string representation of this field
     *
     * By default this will return `Field({ name: "<field name>" })` (where `Field` matches
     * the constructor name of the field class).
     */
    toString(): string {
        const className = this.constructor.name;
        return `${className}({ name: "${this._name || '<unbound - name unknown>'}" })`;
    }

    /**
     * Should two values be considered equal?
     *
     * This is used when determining if two records are equal (see [viewModelFactory.isEqual](doc:viewModelFactory#Call-signature-isEqual))
     *
     * @param value1 The value to compare
     * @param value2 The other value to compare against `value`
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
     * When [isBound](#Accessors-isBound) is true this will return the current value of this
     * field on the bound ViewModel otherwise it will always be undefined. You can get the
     * bound field using the [_f property](doc:viewModelFactory#Accessors-_f) on the `ViewModel`.
     *
     * Most of the time you would get the value for a field directly from the record:
     *
     * ```js
     * const User = viewModelFactory({ id: new Field(), name: new Field() }, { pkFieldName: 'id' })
     * const user = new User({ id: 1, name: 'Jo' });
     * user.name === 'Jo'
     * // true
     * ```
     *
     * But if you want to pass the field itself along with the value this is useful
     * (eg. see [FieldFormatter](doc:FieldFormatter)):
     *
     * ```js
     * // FieldFormatter now has access to the `Field` instance and the value
     * <FieldFormatter field={user._f.name} />
     * ```
     */
    public get value(): undefined | ValueT {
        console.warn('Accessed value on unbound field - this will never return a value');
        return undefined;
    }

    /**
     * When accessed on a [bound field](doc:viewModelFactory#Accessors-_f) will return the current
     * instance of the ViewModel the field is bound to.
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
     * For example [RelatedViewModelField](doc:RelatedViewModelField) uses this to validate the `sourceFieldName`
     * field exists.
     *
     * This is called by [viewModelFactory](doc:viewModelFactory) when the `ViewModel` class is created
     * in the order that fields are defined.
     *
     * NOTE: This is called for every distinct ViewModel class; so if class A is extended by class B
     * then it will be called on both A and B.
     *
     * > You would never call this function directly but might implement it if defining a custom `Field`
     *
     * @param viewModel The `ViewModel` class the field is attached to
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public contributeToClass(viewModel: ViewModelConstructor<any, any>): void {
        // Do nothing by default
    }

    /**
     * Return any props that may be used form widgets created for this field.
     *
     * The default implementation just returns the optional `widgetProps` [Field](doc:Field) option but
     * specific field implementations may return additional props.
     *
     * [getWidgetForField](doc:getWidgetForField) will call this method in order to generate the props that
     * should be passed to the widget.
     */
    public getWidgetProps(): ViewModelFieldWidgetProps {
        return {
            ...this.widgetProps,
        };
    }

    /**
     * Return any props that may be used form formatters created for this field.
     *
     * The default implementation just returns the optional `formatterProps` [Field](doc:Field) option but
     * specific field implementations may return additional props.
     *
     * [getFormatterForField](doc:getFormatterForField) will call this method in order to generate the props that
     * should be passed to the formatter.
     */
    public getFormatterProps(): ViewModelFieldFormatterProps {
        return {
            ...this.formatterProps,
        };
    }
}

export interface RecordBoundField<ValueT, ParsableType extends any = ValueT, SingleValueT = ValueT>
    extends Field<ValueT, ParsableType, SingleValueT> {
    readonly value: ValueT;
    readonly isBound: true;
    readonly boundRecord: ViewModelInterface<any, any>;
}
