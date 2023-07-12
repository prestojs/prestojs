import {
    Context,
    Converter,
    DeclarationReflection,
    ReflectionKind,
    SignatureReflection,
    TypeScript as ts,
    UnknownType,
} from 'typedoc';

export function load({ application }) {
    const printer = ts.createPrinter();

    const typeOverrides: Map<DeclarationReflection, UnknownType> = new Map();
    const returnTypeOverrides: Map<DeclarationReflection, UnknownType> = new Map();
    const paramTypeOverrides: Map<SignatureReflection, [string, UnknownType]> = new Map();

    function handleReturntypeName(context: Context, reflection: DeclarationReflection) {
        const tag = reflection.comment?.getTag('@returntypename');
        if (tag) {
            reflection.comment?.removeTags('@returntypename');
            returnTypeOverrides.set(
                reflection,
                new UnknownType(
                    tag.content
                        .map(({ text }) => text)
                        .join('')
                        .trim()
                )
            );
        }
    }

    function handleTypenameTag(context: Context, reflection: DeclarationReflection) {
        const tag = reflection.comment?.getTag('@typename');
        if (tag) {
            reflection.comment?.removeTags('@typename');
            typeOverrides.set(
                reflection,
                new UnknownType(
                    tag.content
                        .map(({ text }) => text)
                        .join('')
                        .trim()
                )
            );
        }
    }

    function handleParamtypenameTag(context: Context, reflection: SignatureReflection) {
        const tag = reflection.comment?.getTag('@paramtypename');
        if (tag) {
            reflection.comment?.removeTags('@paramtypename');
            const tagText = tag.content
                .map(({ text }) => text)
                .join('')
                .trim();
            const [paramName, ...text] = tagText.split(' ');
            paramTypeOverrides.set(reflection, [paramName, new UnknownType(text.join(' '))]);
        }
    }
    application.converter.on(Converter.EVENT_CREATE_SIGNATURE, handleReturntypeName);
    application.converter.on(Converter.EVENT_CREATE_DECLARATION, handleTypenameTag);
    application.converter.on(Converter.EVENT_CREATE_SIGNATURE, handleTypenameTag);
    application.converter.on(Converter.EVENT_CREATE_SIGNATURE, handleParamtypenameTag);
    application.converter.on(
        Converter.EVENT_CREATE_DECLARATION,
        (context: Context, reflection: DeclarationReflection) => {
            const node = context.project.getSymbolFromReflection(reflection)?.declarations?.[0];
            if (!node) {
                return;
            }

            if (reflection.kind === ReflectionKind.TypeAlias) {
                if (reflection.comment?.getTag('@quickinfo')) {
                    reflection.comment.removeTags('@quickinfo');

                    const type = context.checker.getTypeAtLocation(node);
                    const typeNode = context.checker.typeToTypeNode(
                        type,
                        node.getSourceFile(),
                        ts.NodeBuilderFlags.InTypeAlias
                    );
                    if (!typeNode) {
                        return;
                    }

                    typeOverrides.set(
                        reflection,
                        new UnknownType(
                            printer.printNode(
                                ts.EmitHint.Unspecified,
                                typeNode,
                                node.getSourceFile()
                            )
                        )
                    );
                }
            }
        }
    );

    application.converter.on(Converter.EVENT_RESOLVE_END, () => {
        for (const [refl, type] of typeOverrides) {
            refl.type = type;
        }
        typeOverrides.clear();

        for (const [refl, type] of returnTypeOverrides) {
            refl.type = type;
        }
        typeOverrides.clear();

        for (const [refl, [paramName, type]] of paramTypeOverrides) {
            const param = refl.parameters?.find(p => p.name === paramName);
            if (param) {
                param.type = type;
            }
        }
        typeOverrides.clear();
    });
}
