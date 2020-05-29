export function expandProperties(param, force) {
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
