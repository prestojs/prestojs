import startCase from 'lodash/startCase';
import Field from './fields/Field';
import { freezeObject } from './util';

export type FieldsMapping = { [key: string]: Field<any> };

/**
 * Generate a label for a field based on its name
 */
function generateFieldLabel(name: string): string {
    // Inner startCase splits into words and lowercases it:
    // EMAIL_ADDRESS => email address
    // Outer one converts first letter of each word:
    // email address => Email Address
    return startCase(startCase(name).toLowerCase());
}

/**
 * Class that contains field definitions that get bound to that class
 *
 * On bind the following happens:
 * - The field has it's `model` property set to point to the containing class
 * - The field has it's `name` property set to the name used on the containing class object definition
 * - If label is not set it is generated from the name
 *
 * To define fields on a class implementing this use `_fields`:
 *
 * ```js
 * class UserFilterSet extends FieldBinder {
 *     static _fields = {
 *         name: new Field(),
 *         emailAddress: new Field(),
 *     }
 * }
 * ```
 *
 * You can then access the fields via the `fields` prop:
 *
 * ```
 * UserFilterSet.fields.email.name
 * // 'emailAddress'
 * UserFilterSet.fields.email.label
 * // 'Email Address'
 * ```
 */
export default abstract class FieldBinder {
    /**
     * This should be a mapping from the field name to an instance of `Field`.
     *
     * To access fields use `<model>.fields` which will return the field instance with a link back
     * to the `model` and it's `name` property set.
     */
    public static _fields: FieldsMapping = {};

    // This is a copy of _fields taken when fields is first accessed. This is only needed so that
    // a setter/getter can be added on _fields to forbid changes after 'fields' has been accessed.
    // The copy is needed for any descendant classes that could be defined after 'fields' has been
    // accessed. See fields getter below.
    private static __fieldsCopy: null | FieldsMapping = null;

    // This tracks the fields as they are bound to specific FieldBinder classes in the inheritance
    // hierarchy For example if you have a base class A and descendants B and C then they all
    // should get their own copy of the fields with a 'model' property pointing to A, B and
    // C respectively
    protected static __boundFields: Map<typeof FieldBinder, FieldsMapping> = new Map();

    protected static bindFields(fields: FieldsMapping, bindTo: typeof FieldBinder): FieldsMapping {
        const newFields = Object.entries(fields).reduce((acc, [fieldName, field]) => {
            acc[fieldName] = field.clone();
            acc[fieldName].model = bindTo;
            acc[fieldName].name = fieldName;
            if (acc[fieldName].label === undefined) {
                acc[fieldName].label = generateFieldLabel(fieldName);
            }
            return acc;
        }, {});
        return freezeObject(newFields);
    }

    /**
     * Get the unbound fields. Use this instead of accessing _fields directly. Accessing _fields after binding
     * results in an error to avoid accidentally retrieving the unbound version when the intention was to retrieve
     * the bound versions from `fields`.
     */
    public static get unboundFields(): FieldsMapping {
        if (this.__fieldsCopy) {
            return this.__fieldsCopy;
        }
        return this._fields;
    }

    public static set fields(fields: FieldsMapping) {
        throw new Error('fields cannot be set directly - use _fields instead');
    }

    public static get fields(): FieldsMapping {
        let boundFields = this.__boundFields.get(this);
        if (!boundFields) {
            // We always pass through a copy of fields as `bindFields` is allowed to modify the
            // object in place to add new fields (eg. see ViewModel.bindFields)
            boundFields = this.bindFields({ ...(this.__fieldsCopy || this._fields) }, this);
            if (!this.__fieldsCopy) {
                this.__fieldsCopy = this._fields;
                // Add getter/setter to catch misuse of _fields after fields have be bound
                Object.defineProperty(this, '_fields', {
                    set(v: FieldsMapping): void {
                        if (!this.__boundFields.get(this)) {
                            // This will happen if a descendant class sets _fields after the
                            // model class has already bound fields.
                            this.__fieldsCopy = v;
                            return;
                        }
                        throw new Error(
                            `Fields for ${this} have already been bound - no further changes can be made`
                        );
                    },
                    get(): FieldsMapping {
                        if (!this.__boundFields.get(this)) {
                            // This will happen if a descendant class sets _fields after the
                            // model class has already bound fields.
                            return this.__fieldsCopy;
                        }
                        throw new Error(
                            "To access fields use the 'fields' property instead of '_fields'. '_fields' is only used for defining the fields. If you are extending this class and wish to copy the unbound fields use '.unboundFields' instead."
                        );
                    },
                });
            }
            this.__boundFields.set(this, boundFields);
        }
        return boundFields;
    }
}
