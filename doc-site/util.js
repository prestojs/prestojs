export function expandProperties(param, force) {
    if (param.type === 'reference' && param.name === 'Pick' && param.typeArguments?.length === 2) {
        const fieldNames = param.typeArguments[1].types.map(t => t.value);
        const [name, c] = expandProperties(param.typeArguments[0], force) || [];
        if (c) {
            return [name || param.name, c.filter(t => fieldNames.includes(t.name))];
        }
    }
    if (param.type === 'intersection') {
        const x = param.types
            .map(t => expandProperties(t, force))
            .reduce((acc, pair) => {
                const [, c] = pair || [];
                if (c) {
                    const names = c.map(({ name }) => name);
                    acc = acc.filter(({ name }) => !names.includes(name));
                    acc.push(...c);
                }
                return acc;
            }, []);
        return [param.name, x];
    }
    const paramType = param.type && typeof param.type == 'object' ? param.type : param;
    if (force && paramType.declaration?.children) {
        return [param.name, paramType.declaration.children];
    }

    if (
        paramType?.referencedType?.()?.comment?.tagsByName?.['expand-properties'] ||
        (force && param.referencedType?.())
    ) {
        const t = paramType?.referencedType?.() || param.referencedType?.();
        const desc = t.comment?.tagsByName?.['expand-properties']?.mdx;
        if (t.type?.type === 'intersection') {
            const children = [];
            for (const type of t.type.types) {
                const [, c] = expandProperties(type, true) || [];
                if (c) {
                    children.push(...c);
                }
            }
            return [param.name, children, desc];
        }
        if (!t.children) {
            const [, c] = expandProperties(t, true) || [];
            return [param.name, c];
        }
        return [param.name, t.children || []];
    }
    if (param.name === '__namedParameters' && paramType.declaration) {
        return ['props', paramType.declaration.children];
    }
}
