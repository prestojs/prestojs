import { DeclarationReflection, DocProvider, FunctionDoc } from '@prestojs/doc';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';
import data from '../data/util/useAsync.json';

export default {
    title: 'doc/FunctionDoc',
    component: FunctionDoc,
} as ComponentMeta<typeof FunctionDoc>;

export const Default: ComponentStory<typeof FunctionDoc> = () => (
    <DocProvider referencedTypes={referencedTypes}>
        <FunctionDoc
            node={{
                declaration: data.declaration as DeclarationReflection,
                meta: data.meta,
            }}
        />
    </DocProvider>
);

const referencedTypes = data.references as Record<string, DeclarationReflection>;
