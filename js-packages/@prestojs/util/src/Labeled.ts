/**
 * Interface for items that provide a plain text label. Implementing this can save you having to pass
 * explicit functions to label an item in other parts of the system (eg. for [AsyncChoices](doc:AsyncChoices))
 *
 * See [isTextLabeled](doc:isTextLabeled) and [getTextLabel](doc:getTextLabel).
 *
 * @extractdocs
 * @menugroup Labeled
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
 * @extractdocs
 * @menugroup Labeled
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
 * Check if an object implements [getLabel](doc:TextLabeled#Method-getLabel)
 *
 * @param item The item to check if implements `getLabel`
 * @menugroup Labeled
 */
export function isTextLabeled(item: any): item is TextLabeled {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return typeof item.getLabel === 'function';
}

/**
 * Check if an object implements [getNodeLabel](doc:NodeLabeled#Method-getNodeLabel)
 *
 * @param item The item to check if implements `getNodeLabel`
 * @extractdocs
 * @menugroup Labeled
 */
export function isNodeLabeled(item: any): item is NodeLabeled {
    if (!item || typeof item !== 'object') {
        return false;
    }
    return typeof item.getNodeLabel === 'function';
}

/**
 * Check if item supports either [text labels](doc:TextLabeled) or [React node labels](doc:NodeLabeled)
 *
 * @param item The item to check if implements `getLabel` or `getNodeLabel`
 *
 * @extractdocs
 * @menugroup Labeled
 */
export function isLabeled(item: any): item is TextLabeled | NodeLabeled {
    return isTextLabeled(item) || isNodeLabeled(item);
}

/**
 * Get a label for an item suitable for rendering with React. If you want a plain text label use [getTextLabel](doc:getTextLabel).
 *
 * If item implements [getNodeLabel](doc:NodeLabeled#Method-getNodeLabel) that will be used otherwise [getLabel](doc:TextLabeled#Method-getLabel) will be used.
 *
 * If neither method is defined an error will be thrown. To conditionally call this check if labeled first
 * with [isLabeled](doc:isLabeled).
 *
 * ```js
 * function ItemHeader({ item, defaultTitle }) {
 *     const title = isLabeled(item) ? getNodeLabel(item) : defaultTitle;
 *     return <h2>{title}</h2>;
 * }
 * ```
 *
 * @param item The item to get the label from
 *
 * @extractdocs
 * @menugroup Labeled
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
 * Get a plain text label from an item.
 *
 * If `item` does not implement [TextLabeled](doc:TextLabeled) an error is thrown. To conditionally call this check
 * if `items` is labeled first with [isTextLabeled](doc:isTextLabeled).
 *
 * ```js
 * const label = isTextLabeled(item) ? getTextLabel(item) : 'Item';
 * alert(`${label} saved`);
 * ```
 *
 * See also [getNodeLabeled](doc:getNodeLabel).
 *
 * @param item The item to get the label from
 *
 * @extractdocs
 * @menugroup Labeled
 */
export function getTextLabel(item: any): string {
    if (isTextLabeled(item)) {
        return item.getLabel();
    }
    throw new Error(
        'getNodeLabel is only supported on objects that implement getNodeLabel or getLabel'
    );
}
