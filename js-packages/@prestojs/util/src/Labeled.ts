/**
 * Interface for items that provide a plain text label. Implementing this can save you having to pass
 * explicit functions to label an item in other parts of the system (eg. for [AsyncChoices](doc:AsyncChoices))
 *
 * See [isPlainLabeled](doc:isPlainLabeled) and [getPlainLabel](doc:getPlainLabel).
 *
 * @extract-docs
 * @menu-group Labeled
 */
export interface PlainLabeled {
    /**
     * Return the plain text label for this item. This must return a string
     *
     * See [isPlainLabeled](doc:isPlainLabeled) to test for support and [getPlainLabel](doc:getPlainLabel) for easiest way
     * to get the label.
     */
    getLabel(): string;
}

/**
 * Interface for items that provide a rich label (anything that React can render). Implementing this can save you having to pass
 * explicit functions to label an item in other parts of the system (eg. for [AsyncChoices](doc:AsyncChoices))
 *
 * See [isRichLabeled](doc:isRichLabeled) and [getRichLabel](doc:getRichLabel).
 *
 * @extract-docs
 * @menu-group Labeled
 */
export interface RichLabeled {
    /**
     * Return the rich label for this item. This can be anything renderable by React.
     *
     * See [isRichLabeled](doc:isRichLabeled) to test for support and [getRichLabel](doc:getRichLabel) for easiest way
     * to get the label.
     */
    getRichLabel(): React.ReactNode;
}

/**
 * Check if a value conforms to PlainLabeled
 * @menu-group Labeled
 */
export function isPlainLabeled(item: any): item is PlainLabeled {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return typeof item.getLabel === 'function';
}

/**
 * Check if a value conforms to RichLabeled
 * @extract-docs
 * @menu-group Labeled
 */
export function isRichLabeled(item: any): item is RichLabeled {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return typeof item.getRichLabel === 'function';
}

/**
 * Check if item supports either plain or rich labels
 * @extract-docs
 * @menu-group Labeled
 */
export function isLabeled(item: any): item is PlainLabeled | RichLabeled {
    return isPlainLabeled(item) || isRichLabeled(item);
}

/**
 * Get a rich label from an item
 *
 * If item implements `getRichLabel` that will be used otherwise `getLabel` will be used.
 *
 * If neither are defined an error is thrown. To conditional call this check if labeled first
 * with `isLabeled`.
 *
 * @extract-docs
 * @menu-group Labeled
 */
export function getRichLabel(item: any): React.ReactNode {
    if (isRichLabeled(item)) {
        return item.getRichLabel();
    }
    if (isPlainLabeled(item)) {
        return item.getLabel();
    }
    throw new Error(
        'getRichLabel is only supported on objects that implement getRichLabel or getLabel'
    );
}

/**
 * Get a plain text label from an item
 *
 * If does not implement PlainLabeled an error is thrown. To conditional call this check if labeled first
 * with `isPlainLabeled`.
 *
 * @extract-docs
 * @menu-group Labeled
 */
export function getPlainLabel(item: any): string {
    if (isPlainLabeled(item)) {
        return item.getLabel();
    }
    throw new Error(
        'getRichLabel is only supported on objects that implement getRichLabel or getLabel'
    );
}
