import React from 'react';
import AnchorLinkPrefix from '../AnchorLinkPrefix';
import ApiDocHeader from '../ApiDocHeader';
import Article from '../Article';
import Sidebar from '../Sidebar';
import CodeExamples from './CodeExamples';
import MdxWrapper from './MdxWrapper';
import SignatureDefinition from './SignatureDefinition';
import SignatureDoc from './SignatureDoc';

export default function FunctionDoc({ doc, baseUrl }) {
    const excludeParameters = doc.isForwardRef ? ['ref'] : [];
    const isComponent = doc.name[0].toUpperCase() === doc.name[0];
    const showReturn = !isComponent;
    let sideLinkIds = [];
    if (doc.mdx) {
        const matches = doc.mdx.match(/data-anchorlink="([^"]*)"/g);
        if (matches) {
            sideLinkIds.push([null, matches.map(m => m.split('"')[1])]);
        }
    }
    const parametersHeading = isComponent ? 'Props' : 'Arguments';
    for (let i = 0; i < doc.signatures.length; i++) {
        const signatureSideLinkIds = [];
        const sig = doc.signatures[i];
        if (sig.mdx) {
            const matches = sig.mdx.match(/data-anchorlink="([^"]*)"/g);
            if (matches) {
                signatureSideLinkIds.push(...matches.map(m => m.split('"')[1]));
            }
        }
        if (
            (sig.parameters || []).filter(param => !excludeParameters.includes(param.name)).length >
            0
        ) {
            signatureSideLinkIds.push(`sig${i}-${parametersHeading}`);
        }
        if (showReturn) {
            signatureSideLinkIds.push(`sig${i}-Returns`);
        }
        if (signatureSideLinkIds.length) {
            if (doc.signatures.length > 1) {
                sideLinkIds.push([
                    sig.comment?.tagsByName?.['overload-desc'] || (
                        <SignatureDefinition
                            name={sig.name}
                            parameters={[{ name: '...' }]}
                            className="normal-case"
                        />
                    ),
                    signatureSideLinkIds,
                ]);
            } else {
                sideLinkIds.push([null, signatureSideLinkIds]);
            }
        }
    }
    if (doc.examples) {
        sideLinkIds.push([null, ['Examples']]);
    }
    return (
        <>
            <Article>
                <ApiDocHeader doc={doc} isComponent={isComponent} />
                {doc.mdx && <MdxWrapper mdx={doc.mdx} />}
                {doc.signatures.map((sig, i) => (
                    <AnchorLinkPrefix prefix={`sig${i}-`} key={i}>
                        <SignatureDoc
                            parametersHeading={parametersHeading}
                            // For components don't show return value - doesn't convey any useful
                            // information and can be confusing
                            showReturn={showReturn}
                            signatureDefinitionTag="div"
                            signature={sig}
                            excludeParameters={excludeParameters}
                        />
                    </AnchorLinkPrefix>
                ))}
                {doc.examples && <CodeExamples examples={doc.examples} />}
            </Article>
            {sideLinkIds.length > 0 && (
                <Sidebar currentTitle="On This Page" id="secondary-nav">
                    {sideLinkIds.map(([title, links], i) => (
                        <Sidebar.LinksSection
                            style={i === doc.signatures.length - 1 ? { marginBottom: 0 } : {}}
                            key={i}
                            title={title}
                            links={links.map(linkId => ({
                                href: `${baseUrl}#${linkId}`,
                                title: linkId
                                    .split('_')
                                    .join(' ')
                                    .replace(/sig[0-9]+-/, ''),
                            }))}
                        />
                    ))}
                </Sidebar>
            )}
        </>
    );
}
