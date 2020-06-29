export function expandProperties(param, force, hideProperties = []) {
    if (param.type === 'reference' && param.name === 'Pick' && param.typeArguments?.length === 2) {
        const fieldNames = param.typeArguments[1].types.map(t => t.value);
        const [name, c] = expandProperties(param.typeArguments[0], force, hideProperties) || [];
        if (c) {
            return [
                name || param.name,
                c.filter(t => fieldNames.includes(t.name) && !hideProperties.includes(t.name)),
            ];
        }
    }
    if (param.type === 'intersection') {
        const x = param.types
            .map(t => expandProperties(t, force, hideProperties))
            .reduce((acc, pair) => {
                const [, c] = pair || [];
                if (c) {
                    const names = c
                        .filter(t => !hideProperties.includes(t.name))
                        .map(({ name }) => name);
                    acc = acc.filter(({ name }) => !names.includes(name));
                    acc.push(...c);
                }
                return acc;
            }, []);
        return [param.name, x];
    }
    const paramType = param.type && typeof param.type == 'object' ? param.type : param;
    if (force && paramType.declaration?.children) {
        return [
            param.name,
            paramType.declaration.children.filter(t => !hideProperties.includes(t.name)),
        ];
    }

    if (
        paramType?.referencedType?.()?.comment?.tagsByName?.['expand-properties'] ||
        (force && param.referencedType?.())
    ) {
        const t = paramType?.referencedType?.() || param.referencedType?.();
        const desc = t.comment?.tagsByName?.['expand-properties']?.mdx;
        const hideProperties = t.comment?.tagsByName?.['hide-properties'] || [];
        if (t.type?.type === 'intersection') {
            const children = [];
            for (const type of t.type.types) {
                const [, c] = expandProperties(type, true, hideProperties) || [];
                if (c) {
                    children.push(...c);
                }
            }
            return [param.name, children.filter(t => !hideProperties.includes(t.name)), desc];
        }
        if (!t.children) {
            const [, c] = expandProperties(t, true, hideProperties) || [];
            return [param.name, c?.filter(t => !hideProperties.includes(t.name))];
        }
        return [param.name, (t.children || []).filter(t => !hideProperties.includes(t.name))];
    }
    if (param.name === '__namedParameters' && paramType.declaration) {
        return [
            'props',
            paramType.declaration.children.filter(t => !hideProperties.includes(t.name)),
        ];
    }
}

export function transformParameters(p) {
    return {
        ...p,
        // Don't show __namedParameters which is just a spread element extracted by typedoc
        name: p.name === '__namedParameters' ? 'params' : p.name,
    };
}

export function getTypeArguments(doc) {
    const types = {};
    for (const t of doc.extendedTypes || []) {
        const type = t.referencedType?.() || t;
        if (type.extendedTypes) {
            Object.assign(types, getTypeArguments(type));
        }
        if (t.typeArguments) {
            const x = t.typeArguments.reduce((acc, item, i) => {
                if (type.typeParameter?.[i]) {
                    acc[type.typeParameter[i].name] = item;
                }
                return acc;
            }, {});
            Object.assign(types, x);
        }
    }
    return types;
}

function getMethods(methods, isStatic) {
    const direct = [];
    const inherited = [];
    for (const method of methods.filter(m => !!m.flags?.isStatic === isStatic)) {
        if (method.signatures[0].inheritedFrom) {
            inherited.push(method);
        } else {
            direct.push(method);
        }
    }
    return { direct, inherited, total: direct.length + inherited.length };
}

function getProperties(properties, isStatic) {
    const direct = [];
    const inherited = [];
    for (const property of properties.filter(m => !!m.flags?.isStatic === isStatic)) {
        if (property.inheritedFrom) {
            inherited.push(property);
        } else {
            direct.push(property);
        }
    }
    return { direct, inherited, total: direct.length + inherited.length };
}

export function getClassDetails(doc) {
    const groups = doc.groups.reduce((acc, group) => {
        acc[group.title] = group;
        return acc;
    }, {});
    const children = doc.children.reduce((acc, child) => {
        acc[child.id] = child;
        return acc;
    }, {});
    const constructor = groups.Constructors && children[groups.Constructors.children[0]];
    const methods =
        (groups.Methods &&
            groups.Methods.children
                .map(id => children[id])
                .filter(method => !method.flags.isPrivate)) ||
        [];
    const properties =
        (groups.Properties &&
            groups.Properties.children
                .map(id => children[id])
                .filter(prop => !prop.flags.isPrivate && !prop.name.startsWith('__'))) ||
        [];

    return {
        constructor,
        methods: getMethods(methods, false),
        staticMethods: getMethods(methods, true),
        properties: getProperties(properties, false),
        staticProperties: getProperties(properties, true),
    };
}
