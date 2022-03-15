import { JSONOutput } from 'typedoc';

export type AugmentedDeclarationReflection = JSONOutput.DeclarationReflection & {
    deprecated?: string;
    tagsByName?: Record<string, any>;
};
