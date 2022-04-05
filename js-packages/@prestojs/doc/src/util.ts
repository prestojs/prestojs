import orderBy from 'lodash/orderBy';
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
    return orderBy(
        methods
            .map(getMethod)
            .filter(
                m => m && !!m.flags?.isStatic === isStatic
            ) as JSONOutput.DeclarationReflection[],
        'name'
    );
}

function getProperties(
    properties: JSONOutput.DeclarationReflection[],
    isStatic: boolean
): JSONOutput.DeclarationReflection[] {
    return orderBy(
        properties.filter(
            m =>
                !getMethod(m) &&
                ['Property', 'Accessor'].includes(m.kindString || '') &&
                !!m.flags?.isStatic === isStatic
        ),
        'name'
    );
}

export function getClassDetails(
    details: { children: JSONOutput.DeclarationReflection[] },
    includeInherited: boolean
) {
    const constructor = details.children.find(child => child.kindString === 'Constructor');
    const children = details.children.filter(
        child => !child.flags?.isPrivate && (includeInherited || !child.inheritedFrom)
    );
    return {
        constructor,
        methods: getMethods(children, false),
        staticMethods: getMethods(children, true),
        properties: getProperties(children, false),
        staticProperties: getProperties(children, true),
    };
}
