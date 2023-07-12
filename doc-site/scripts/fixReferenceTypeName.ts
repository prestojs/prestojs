import {
    Context,
    Converter,
    DeclarationReflection,
    ParameterReflection,
    ReferenceType,
    SignatureReflection,
    SomeType,
    UnionType,
} from 'typedoc';

/**
 * Fixed ReferenceType that has name of 'default'
 * Fix ParameterReflection with type of `Refe
 * @param application
 */
export function load({ application }) {
    const parameterReflections = new Set<
        DeclarationReflection | ParameterReflection | SignatureReflection
    >();
    application.converter.on(
        Converter.EVENT_CREATE_PARAMETER,
        (context: Context, reflection: DeclarationReflection) => {
            parameterReflections.add(reflection);
        }
    );
    application.converter.on(
        Converter.EVENT_CREATE_DECLARATION,
        (context: Context, reflection: DeclarationReflection) => {
            parameterReflections.add(reflection);
        }
    );

    function fixType(context, type: undefined | SomeType) {
        if (!type) {
            return;
        }
        if (type instanceof UnionType) {
            const types: SomeType[] = [];
            for (const t of type.types) {
                const newType = fixType(context, t);
                types.push(newType || t);
            }
            return new UnionType(types);
        }
        if (
            type instanceof ReferenceType &&
            !type.reflection &&
            !type.refersToTypeParameter &&
            // @ts-ignore
            type._target
        ) {
            // @ts-ignore _target isn't documented, relying on internal implementation
            const fileName = type._target.fileName.replace(/\..*$/, '').replace('/build/', '/src/');
            // @ts-ignore
            let name = type._target.name;
            if (type.name === 'default') {
                name = fileName.split('/').pop();
                type.name = name;
            }
            const reflection = Object.values(context.project.reflections).find(
                (r: DeclarationReflection) =>
                    r.name === name && r.sources?.[0].fullFileName.replace(/\..*$/, '') === fileName
            );
            if (reflection) {
                return ReferenceType.createResolvedReference(
                    name,
                    reflection as DeclarationReflection,
                    context.project
                );
            }
        }
    }

    application.converter.on(Converter.EVENT_RESOLVE_END, context => {
        for (const refl of parameterReflections) {
            const newType = fixType(context, refl.type);
            if (newType) {
                refl.type = newType;
            }
        }
        parameterReflections.clear();
    });
}
