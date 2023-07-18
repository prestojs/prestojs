import { BaseRelatedViewModelField } from './fields/RelatedViewModelField';
import { FieldPath, FieldPaths, InvalidFieldError, ViewModelConstructor } from './ViewModelFactory';

// Used when `includeRelations` is false
const expandedFields = new Map<ViewModelConstructor<any, any>, FieldPath<any>[]>();
// Used when `includeRelations` is true
const expandedFieldsWithRelations = new Map<ViewModelConstructor<any, any>, FieldPath<any>[]>();

/**
 * For a model expand the fields according to the rules for the '*' specification.
 *
 * This includes all field names apart from relation fields - however it does include the
 * relation `sourceFieldName`.
 */
function expandStarFields<T extends ViewModelConstructor<any, any>>(
    modelClass: T,
    includeRelations = true
): FieldPath<T>[] {
    const mapping = includeRelations ? expandedFieldsWithRelations : expandedFields;
    let fieldPaths = mapping.get(modelClass) as FieldPath<T>[];
    if (fieldPaths) {
        return fieldPaths;
    }
    fieldPaths = modelClass.allFieldNames.filter(
        subFieldName => !modelClass.relationFieldNames.includes(subFieldName)
    ) as FieldPath<T>[];
    mapping.set(modelClass, fieldPaths);
    if (includeRelations) {
        for (const fieldName of modelClass.relationFieldNames) {
            fieldPaths.push(
                ...(expandStarFields(modelClass.fields[fieldName].to).map(f => [
                    fieldName,
                    ...(Array.isArray(f) ? f : [f]),
                ]) as FieldPath<T>[])
            );
        }
    }
    return fieldPaths;
}

// Separator used to join multiple values when generating a string key, eg.
// ['a', 'b', 'c'] becomes 'a⁞b⁞c'
export const CACHE_KEY_FIELD_SEPARATOR = '⁞';

/**
 * Stores the field paths for a model in a standardised form for use in caching.
 *
 * @extractdocs
 * @menugroup Utils
 */
export class ViewModelFieldPaths<T extends ViewModelConstructor<any, any>> {
    modelClass: T;
    /**
     * The flattened path - any nested fields are joined with '.'
     */
    flattenedPath: string[];
    /**
     * The expanded paths - any nested fields are represented as an array
     */
    fieldPaths: FieldPath<T>[];
    /**
     * Names of fields that aren't relations
     */
    nonRelationFieldNames: string[];
    /**
     * Map of relation field name to the paths for that relation
     */
    relations: Record<string, FieldPath<any>[]>;
    /**
     * A key representation of this field path that can be used as a cache key
     */
    key: string;

    constructor(modelClass: T, flattenedPath: string[]) {
        this.modelClass = modelClass;
        this.flattenedPath = flattenedPath;
        this.fieldPaths = [];
        this.nonRelationFieldNames = [];
        const relations = {};
        for (const p of this.flattenedPath) {
            const path = (p.includes('.') ? p.split('.') : p) as FieldPath<T>;
            const fieldName = (Array.isArray(path) ? path[0] : path) as string;
            const field = modelClass.getField(fieldName);
            if (field instanceof BaseRelatedViewModelField) {
                if (!relations[fieldName]) {
                    relations[fieldName] = [];
                }
                if (Array.isArray(path)) {
                    // ['group', 'name'] => 'name'
                    // ['group', 'owner', 'ownerName'] => ['owner', 'ownerName']
                    relations[fieldName].push(path.length === 2 ? path[1] : path.slice(1));
                }
            } else {
                this.nonRelationFieldNames.push(fieldName);
            }
            this.fieldPaths.push(path);
        }
        this.relations = relations;
        this.key = this.flattenedPath.join(CACHE_KEY_FIELD_SEPARATOR);
    }

    /**
     * Is the specified `paths` a subset of this?
     */
    isSubset(paths: ViewModelFieldPaths<T>, ignoreNested = false): boolean {
        if (paths === this) {
            return false;
        }
        for (const p of paths.flattenedPath) {
            if (ignoreNested && p.includes('.')) {
                continue;
            }
            if (!this.flattenedPath.includes(p)) {
                return false;
            }
        }
        return true;
    }
}

/**
 * A cache of field paths for a model. This is global per ViewModel and is for internal use. This is used to always
 * return the same instance fo the same FieldPaths.
 */
class ViewModelFieldPathsCache<T extends ViewModelConstructor<any, any>> {
    modelClass: T;
    private cache = new Map<string, ViewModelFieldPaths<T>>();

    constructor(modelClass: T) {
        this.modelClass = modelClass;
    }
    add(fieldPaths: FieldPaths<T>): ViewModelFieldPaths<T> {
        const cacheKey =
            fieldPaths === '*'
                ? '*'
                : fieldPaths.reduce((acc, fieldName) => {
                      const key = Array.isArray(fieldName) ? fieldName.join('.') : fieldName;
                      if (acc) {
                          return acc + CACHE_KEY_FIELD_SEPARATOR + key;
                      }
                      return key;
                  }, '');
        let cachedItem = this.cache.get(cacheKey);
        if (cachedItem) {
            return cachedItem;
        }
        const { modelClass } = this;

        const resolvedFieldNames = new Set([...this.modelClass.pkFieldNames]);
        if (fieldPaths === '*') {
            expandStarFields(modelClass).forEach(fieldName => resolvedFieldNames.add(fieldName));
        } else {
            for (const fieldPath of fieldPaths) {
                if (fieldPath === '*') {
                    expandStarFields(modelClass).forEach(fieldName =>
                        resolvedFieldNames.add(fieldName)
                    );
                } else if (Array.isArray(fieldPath)) {
                    const [relatedFieldName, ...rest] = fieldPath;
                    const field = modelClass.getField(relatedFieldName);
                    if (!(field instanceof BaseRelatedViewModelField)) {
                        throw new InvalidFieldError(
                            `Field '${modelClass.name}.${relatedFieldName}' does not extend BaseRelatedViewModelField.`
                        );
                    }
                    resolvedFieldNames.add(field.sourceFieldName);
                    // If 'rest' is 1 element then pass it through otherwise we need to wrap it in an array. This
                    // is because a single element means a single field (eg. ['user', 'name']) whereas multiple
                    // means that were are traversing multiple relations and need to wrap it in an array so that
                    // normalizeFields treats it as single FieldPath (normalizeFields gets passed _multiple_)
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    normalizeFields(field.to, rest.length === 1 ? rest : [rest]).fieldPaths.forEach(
                        nestedFieldName => {
                            if (Array.isArray(nestedFieldName)) {
                                resolvedFieldNames.add(
                                    [relatedFieldName, ...nestedFieldName].join('.')
                                );
                            } else {
                                resolvedFieldNames.add(
                                    [relatedFieldName, nestedFieldName].join('.')
                                );
                            }
                        }
                    );
                } else {
                    const field = modelClass.getField(fieldPath);
                    if (field instanceof BaseRelatedViewModelField) {
                        // If the name of a related field is passed we need to expand that to a list of all
                        // that models non-relation fields
                        resolvedFieldNames.add(field.sourceFieldName);
                        expandStarFields(field.to, false).forEach(subFieldName => {
                            resolvedFieldNames.add(
                                [
                                    fieldPath,
                                    ...(Array.isArray(subFieldName)
                                        ? subFieldName
                                        : [subFieldName]),
                                ].join('.')
                            );
                        });
                    } else {
                        resolvedFieldNames.add(fieldPath);
                    }
                }
            }
        }
        const f = [...resolvedFieldNames].map(f => (Array.isArray(f) ? f.join('.') : f));
        f.sort();
        // See if it already exists
        const key = f.join(CACHE_KEY_FIELD_SEPARATOR);
        for (const viewModelFieldPaths of this.cache.values()) {
            if (viewModelFieldPaths.key === key) {
                this.cache.set(cacheKey, viewModelFieldPaths);
                return viewModelFieldPaths;
            }
        }
        const normalizedPath = new ViewModelFieldPaths(modelClass, f);
        this.cache.set(cacheKey, normalizedPath);
        return normalizedPath;
    }
}

const viewModelNormalizedFieldPathCache = new Map<
    ViewModelConstructor<any, any>,
    ViewModelFieldPathsCache<any>
>();

/**
 * Takes an array of field paths for a model class and returns a normalized version in the form of `ViewModelFieldPaths`.
 *
 * Note that `ViewModelFieldPaths` can be compared with normal equality operators - they are cached internally so a single
 * instance exists for each unique `fieldNames`
 *
 * Normalization means:
 * * Id fields are always included
 * * Expands a related field to include all it's subfields
 * * If a related field is referenced ensures the related field sourceFieldName is included
 * * Sorts field names consistently
 *
 * @param modelClass The ViewModel class the fields are from
 * @param fieldNames The array of field paths to normalize
 *
 * @extractdocs
 * @menugroup Utils
 */
export function normalizeFields<T extends ViewModelConstructor<any, any>>(
    modelClass: T,
    fieldNames: FieldPaths<T>
): ViewModelFieldPaths<T> {
    let cache = viewModelNormalizedFieldPathCache.get(modelClass);
    if (!cache) {
        cache = new ViewModelFieldPathsCache(modelClass);
        viewModelNormalizedFieldPathCache.set(modelClass, cache);
    }
    return cache.add(fieldNames);
}
