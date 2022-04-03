import { JSONOutput } from 'typedoc';

declare module 'typedoc/dist/lib/serialization/schema' {
    interface Comment {
        textMdx?: string;
        shortTextMdx?: string;
        returnsMdx?: string;
    }
    interface Reflection {
        tagsByName: Record<string, any>;
        docFlags: {
            deprecated?: string | boolean;
            expandProperties?: boolean;
        };
        anchorId: string;
    }
}

export type DeclarationReflection = JSONOutput.DeclarationReflection;

export type DocMetaData = {
    packageName: string;
    permaLink: string;
    menuGroup: string;
};

export type DocNode = {
    declaration: DeclarationReflection;
    meta: DocMetaData;
};
