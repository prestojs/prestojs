import sortBy from 'lodash/sortBy';
import { JSONOutput } from 'typedoc';

function getMethod(
    method: JSONOutput.DeclarationReflection
): false | JSONOutput.DeclarationReflection {
    if (method.kindString === 'Method') {
        return method;
    }
    // See Paginator.setInternalState for example of this - it's assigned in constructor:
    // this.setInternalState = () => {...}
    if (
        method.kindString === 'Property' &&
        method.type?.type === 'reflection' &&
        method.type.declaration?.signatures
    ) {
        return method.type.declaration;
    }
    return false;
}

function getMethods(
    methods: JSONOutput.DeclarationReflection[],
    isStatic: boolean
): JSONOutput.DeclarationReflection[] {
    return methods
        .map(getMethod)
        .filter(m => m && !!m.flags?.isStatic === isStatic) as JSONOutput.DeclarationReflection[];
}

function getProperties(
    properties: JSONOutput.DeclarationReflection[],
    isStatic: boolean
): JSONOutput.DeclarationReflection[] {
    return properties.filter(m => !getMethod(m) && !!m.flags?.isStatic === isStatic);
}

export function getClassDetails(details: {
    groups: JSONOutput.ReflectionGroup[];
    children: JSONOutput.DeclarationReflection[];
}) {
    const groups = details.groups.reduce(
        (acc: Record<string, JSONOutput.ReflectionGroup>, group) => {
            acc[group.title] = group;
            return acc;
        },
        {}
    );
    const children = details.children.reduce(
        (acc: Record<string, JSONOutput.DeclarationReflection>, child) => {
            acc[child.id] = child;
            return acc;
        },
        {}
    );
    const constructor = groups.Constructors?.children && children[groups.Constructors.children[0]];
    const methods =
        groups.Methods?.children
            ?.map(id => children[id])
            .filter(method => !method.flags.isPrivate) || [];
    let groupProperties = groups.Properties?.children || [];
    if (groups['Object literals']?.children) {
        groupProperties.push(...groups['Object literals'].children);
    }
    if (groups.Accessors?.children) {
        groupProperties.push(...groups.Accessors.children);
    }
    const properties: JSONOutput.DeclarationReflection[] = sortBy(
        [...new Set(groupProperties)]
            .map(id => children[id])
            .filter(prop => !prop.flags.isPrivate && !prop.name.startsWith('__')) || [],
        'name'
    );
    return {
        constructor,
        methods: getMethods(details.children, false),
        staticMethods: getMethods(details.children, true),
        properties: getProperties(details.children, false),
        staticProperties: getProperties(details.children, true),
    };
}
