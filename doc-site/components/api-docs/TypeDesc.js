import Link from 'next/link';
import React from 'react';

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

export default function TypeDesc({ doc, type, isArray }) {
    if (!type) {
        type = doc.type;
    }
    if (!type) {
        return '';
    }
    if (doc?.comment?.tagsByName?.['type-name']) {
        return <span className="text-blue-400">{doc.comment.tagsByName['type-name']}</span>;
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
        return <TypeDesc type={referencedType()} />;
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
    // console.log(type);
    return <span className="text-blue-400">{type.name}</span>;
}
