/**
 * Interface for items that provide a plain text label. Implementing this can save you having to pass
 * explicit functions to label an item in other parts of the system (eg. for [AsyncChoices](doc:AsyncChoices))
 *
 * See [isTextLabeled](doc:isTextLabeled) and [getTextLabel](doc:getTextLabel).
 *
 * @extract-docs
 * @menu-group Labeled
 */
export interface TextLabeled {
    /**
     * Return the plain text label for this item. This must return a string
     *
     * See [isTextLabeled](doc:isTextLabeled) to test for support and [getTextLabel](doc:getTextLabel) for easiest way
     * to get the label.
     */
    getLabel(): string;
}

/**
 * Interface for items that provide a React node label (anything that React can render). Implementing this can save you having to pass
 * explicit functions to label an item in other parts of the system (eg. for [AsyncChoices](doc:AsyncChoices))
 *
 * See [isNodeLabeled](doc:isNodeLabeled) and [getNodeLabel](doc:getNodeLabel).
 *
 * @extract-docs
 * @menu-group Labeled
 */
export interface NodeLabeled {
    /**
     * Return the node label for this item. This can be anything renderable by React.
     *
     * See [isNodeLabeled](doc:isNodeLabeled) to test for support and [getNodeLabel](doc:getNodeLabel) for easiest way
     * to get the label.
     */
    getNodeLabel(): React.ReactNode;
}

/**
 * Check if a value conforms to TextLabeled
 * @menu-group Labeled
 */
export function isTextLabeled(item: any): item is TextLabeled {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return typeof item.getLabel === 'function';
}

/**
 * Check if a value conforms to NodeLabeled
 * @extract-docs
 * @menu-group Labeled
 */
export function isNodeLabeled(item: any): item is NodeLabeled {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return typeof item.getNodeLabel === 'function';
}

/**
 * Check if item supports either text or React node labels
 * @extract-docs
 * @menu-group Labeled
 */
export function isLabeled(item: any): item is TextLabeled | NodeLabeled {
    return isTextLabeled(item) || isNodeLabeled(item);
}

/**
 * Get a React node label from an item
 *
 * If item implements `getNodeLabel` that will be used otherwise `getLabel` will be used.
 *
 * If neither are defined an error is thrown. To conditional call this check if labeled first
 * with `isLabeled`.
 *
 * @extract-docs
 * @menu-group Labeled
 */
export function getNodeLabel(item: any): React.ReactNode {
    if (isNodeLabeled(item)) {
        return item.getNodeLabel();
    }
    if (isTextLabeled(item)) {
        return item.getLabel();
    }
    throw new Error(
        'getNodeLabel is only supported on objects that implement getNodeLabel or getLabel'
    );
}

/**
 * Get a plain text label from an item
 *
 * If does not implement TextLabeled an error is thrown. To conditional call this check if labeled first
 * with `isTextLabeled`.
 *
 * @extract-docs
 * @menu-group Labeled
 */
export function getTextLabel(item: any): string {
    if (isTextLabeled(item)) {
        return item.getLabel();
    }
    throw new Error(
        'getNodeLabel is only supported on objects that implement getNodeLabel or getLabel'
    );
}
