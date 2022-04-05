import { DeclarationReflection, getClassDetails } from '@prestojs/doc';
import { DocProvider } from '@prestojs/doc/';
import AnchorLink, { generateId } from '@prestojs/doc/AnchorLink';
import ClassDetails from '@prestojs/doc/ClassDetails';
import DocHeader from '@prestojs/doc/DocHeader';
import SignatureDoc from '@prestojs/doc/SignatureDoc';
import { DocNode } from '@prestojs/doc/types';
import fs from 'fs';
import Head from 'next/head';
import path from 'path';
import React, { useMemo } from 'react';

type Props = {
    viewModelFactory: DocNode & { references: Record<string, DeclarationReflection> };
    BaseViewModel: DocNode & { references: Record<string, DeclarationReflection> };
};

function SectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
    return (
        <AnchorLink
            component="h2"
            id={id || generateId(children)}
            className="group flex whitespace-pre-wrap text-2xl text-cyan-500 font-semibold"
        >
            {children}
        </AnchorLink>
    );
}

export default function ViewModelFactory(props: Props) {
    const viewModelConstructor = Object.values(props.viewModelFactory.references).find(
        r => r.name === 'ViewModelConstructor'
    );
    if (!viewModelConstructor) {
        throw new Error('Missing ViewModelConsturctor');
    }
    const { children } = viewModelConstructor;
    if (!children) {
        throw new Error('Missing values for class doc');
    }
    const classDetails = useMemo(
        () =>
            getClassDetails(
                {
                    children: [...children, ...(props.BaseViewModel.declaration.children || [])],
                },
                true
            ),
        [children, props.BaseViewModel.declaration.children]
    );
    const references = {
        ...props.viewModelFactory.references,
        ...props.BaseViewModel.references,
    };
    return (
        <DocProvider referencedTypes={references}>
            <Head>
                <title>Presto - ViewModelFactory</title>
            </Head>
            <div>
                <DocHeader node={props.viewModelFactory} />
                <div className="mdx mb-10">
                    <p>
                        A <code className="bg-yellow-100">ViewModel</code> class is created using
                        the <code className="bg-yellow-100">viewModelFactory</code> function. The
                        factory function is documented immediately below followed by the
                        documentation for the generated class.
                    </p>
                </div>
                <SectionHeading>Factory</SectionHeading>
                {props.viewModelFactory.declaration.signatures?.map((signature, i) => (
                    <div className="pt-3 mt-3 border-t-2 border-gray-200" key={i}>
                        <SignatureDoc signature={signature} />
                    </div>
                ))}
                <SectionHeading>ViewModel Class</SectionHeading>
                <div className="pt-3 mt-3 border-t-2 border-gray-200">
                    <p className="pb-5">This is the class created by the factory function.</p>
                    <ClassDetails classDetails={classDetails} />
                </div>
            </div>
        </DocProvider>
    );
}

export async function getStaticProps(context) {
    const props = {};
    for (const name of ['BaseViewModel', 'viewModelFactory']) {
        const fn = path.join(process.cwd(), `data/viewmodel/${name}.json`);
        props[name] = JSON.parse(fs.readFileSync(fn, 'utf-8'));
    }
    return {
        props,
    };
}
