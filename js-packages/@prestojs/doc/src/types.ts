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
            isForwardRef?: boolean;
        };
        anchorId: string;
        slug?: string;
        inPageLinks?: { title: string; links: { id: string; title: string }[] }[];
    }
}

export type DeclarationReflection = JSONOutput.DeclarationReflection;

export type DocExample = {
    code: {
        js: string;
        ts: string;
    };
    header: {
        title: string;
        description?: string;
    };
    name: string;
    url: string;
};

export type DocMetaData = {
    packageName: string;
    permaLink: string;
    menuGroup: string;
    examples: DocExample[];
};

export type DocNode = {
    declaration: DeclarationReflection;
    meta: DocMetaData;
};
