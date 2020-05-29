import Link from 'next/link';
import React from 'react';
import Popover from '../Popover';
import MdxWrapper from './MdxWrapper';
import SignatureDoc from './SignatureDoc';

function Union({ type, isArray = false }) {
    const l = type.types.length;
    if (l === 2 && type.types.filter(t => t.name === 'undefined').length === 1) {
        return <TypeDesc type={type.types.filter(t => t.name !== 'undefined')[0]} />;
    }
    return (
        <>
            {isArray && '('}
            {type.types.map((type, i) => (
                <React.Fragment key={i}>
                    <TypeDesc type={type} />
                    {i < l - 1 && <span className="text-gray-400">|</span>}
                </React.Fragment>
            ))}
            {isArray && ')'}
        </>
    );
}

export default function TypeDesc({ doc, type, isArray, isReturnType }) {
    if (!type) {
        type = doc.type;
    }
    if (!type) {
        return '';
    }
    if (doc?.comment?.tagsByName?.['type-name']) {
        return <span className="text-blue-400">{doc.comment.tagsByName['type-name']}</span>;
    }
    if (type.comment?.tagsByName?.['type-name']) {
        return <span className="text-blue-400">{type.comment.tagsByName['type-name']}</span>;
    }
    const referenceSlug = type.referenceSlug || type.constraint?.referenceSlug;
    if (referenceSlug) {
        return (
            <Link href={`/docs/${referenceSlug}`}>
                <a className="text-blue-400 hover:text-blue-600 underline">
                    {type.constraint?.name || type.name}
                </a>
            </Link>
        );
    }
    if (type.type?.declaration?.indexSignature) {
        const sig = type.type.declaration.indexSignature[0];
        const { type: keyType, name } = sig.parameters[0];
        return (
            <span className="text-gray-600">
                {`{[ ${name}: `}
                <TypeDesc type={keyType} /> {']: '}
                <TypeDesc type={sig.type} />
                {'}'}
            </span>
        );
    }
    const referencedType = type.constraint?.referencedType || type.referencedType;
    if (referencedType) {
        const t = referencedType();
        return <TypeDesc type={t} doc={doc || { type: t }} />;
    }
    if (type.type === 'array') {
        return (
            <span className="text-blue-400">
                <TypeDesc type={type.elementType} isArray />
                []
            </span>
        );
    }
    if (type.type === 'union') {
        return <Union doc={doc} type={type} isArray={isArray} />;
    }
    if (type.constraint?.type === 'union') {
        return <Union doc={doc} type={type.constraint} isArray={isArray} />;
    }
    if (type.type === 'stringLiteral') {
        return <span className="text-green-400">"{type.value}"</span>;
    }
    const t = type.type?.type ? type.type : type;
    if (t.type === 'reflection' && t.declaration) {
        return <TypeDesc type={t.declaration} doc={doc} isReturnType={isReturnType} />;
    }
    if (type.signatures) {
        const content = (
            <>
                {doc?.mdx && <MdxWrapper mdx={doc.mdx} />}
                <p className="mt-2 border-t-2 pt-4">
                    {isReturnType
                        ? 'The function accepts the following parameters'
                        : 'The function will be passed the following parameters'}
                    :
                </p>
                <SignatureDoc
                    bordered={false}
                    signature={type.signatures[0]}
                    hideName
                    className="border-t-0"
                />
            </>
        );
        return (
            <Popover content={content} title={doc?.name || 'Function'}>
                <span className="text-orange-400">Function</span>
            </Popover>
        );
    }
    if (type.type === 'intrinsic' && type.name === 'boolean') {
        return <span className="text-red-400">{type.name}</span>;
    }
    let { name } = type;
    if (name === '__type' && doc?.type?.name) {
        name = doc.type.name;
    }

    return <span className="text-blue-400">{name}</span>;
}
