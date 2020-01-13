import React from 'react';
import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import styled from 'styled-components';
import Article from '../components/Article';
import Menu from '../components/Menu';
import Sidebar from '../components/Sidebar';
import Layout from '../components/Layout';
import apiMenu from '../../data/apiMenu';

const menuItems = Object.entries(apiMenu).map(([name, children]) => ({
    title: name,
    children,
}));

function CommentBlock({ comment }) {
    if (!comment) {
        return null;
    }
    return (
        <>
            {comment.shortText && <MDXRenderer>{comment.shortText.body}</MDXRenderer>}
            {comment.text && <MDXRenderer>{comment.text.body}</MDXRenderer>}
        </>
    );
}

function Signature({ signature }) {
    const parameters = (signature.parameters && signature.parameters.filter(p => p.comment)) || [];
    console.log(parameters);
    return (
        <>
            <h4>
                {signature.name}(
                {signature.parameters && signature.parameters.map(param => param.name).join(', ')})
            </h4>
            <br />
            <CommentBlock comment={signature.comment} />
            {parameters.length > 0 && (
                <dl>
                    {parameters.map(param => (
                        <>
                            <dt>{param.name}</dt>
                            <dd>
                                <CommentBlock comment={param.comment} />
                            </dd>
                        </>
                    ))}
                </dl>
            )}
        </>
    );
}

const MethodWrapper = styled.div`
    border-bottom: 1px solid #ececec;
    > h4 {
        font-size: 2em;
        margin: 0;
    }
    padding: 10px 0;
    margin-bottom: 10px;
`;

function MethodDoc({ method }) {
    return (
        <MethodWrapper>
            {method.signatures.map(sig => (
                <Signature signature={sig} />
            ))}
        </MethodWrapper>
    );
}

function ClassDoc({ doc }) {
    const groups = doc.groups.reduce((acc, group) => {
        acc[group.title] = group;
        return acc;
    }, {});
    const children = doc.childNodes.reduce((acc, child) => {
        acc[child.id] = child;
        return acc;
    }, {});
    const constructor = groups.Constructors && children[groups.Constructors.children[0]];
    const methods =
        (groups.Methods &&
            groups.Methods.children
                .map(id => children[id])
                .filter(method => !method.flags.isPrivate)) ||
        [];
    const direct = [];
    const inherited = [];
    for (const method of methods) {
        if (method.signatures[0].inheritedFrom) {
            inherited.push(method);
        } else {
            direct.push(method);
        }
    }

    return (
        <>
            <CommentBlock comment={doc.comment} />
            {constructor && (
                <>
                    <h3>Constructor</h3>
                    {constructor.signatures[0].parameters &&
                        constructor.signatures[0].parameters
                            .filter(p => p.comment)
                            .map(p => (
                                <p>
                                    <strong>{p.name}</strong> <CommentBlock comment={p.comment} />
                                </p>
                            ))}
                    {methods.length > 0 && (
                        <>
                            <h3>Methods</h3>
                            {direct.map(method => (
                                <MethodDoc method={method} />
                            ))}
                            {inherited.length > 0 && (
                                <>
                                    <h3>Inherited Methods</h3>
                                    {inherited.map(method => (
                                        <MethodDoc method={method} />
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </>
            )}
        </>
    );
}

function FunctionDoc({ doc }) {
    return (
        <>
            {doc.signatures.map(sig => (
                <CommentBlock comment={sig.comment} />
            ))}
        </>
    );
}

function VariableDoc({ doc }) {
    return <CommentBlock comment={doc.comment} />;
}

const kindComponents = {
    Function: FunctionDoc,
    Class: ClassDoc,
    Variable: VariableDoc,
};

const ImportString = styled.code`
    padding: 5px;
    margin-bottom: 10px;
    display: block;
`;

const ArticleWrapper = styled(Article)`
    h3 {
        font-size: 2.5em;
    }
`;

const Api = props => {
    const {
        // if mdx is set that's considered an override (ie. there exists a file in data/ with same slug as this)
        data: { typeDocsJson: doc, mdx },
    } = props;
    const DocComponent = kindComponents[doc.kindString];
    return (
        <Layout>
            <Sidebar>
                <Menu items={menuItems} />
            </Sidebar>
            <ArticleWrapper>
                <h1>{doc.name}</h1>
                <ImportString>
                    {`import { ${doc.name} } from "@prestojs/${doc.packageName}";`}
                </ImportString>
                {mdx ? <MDXRenderer>{mdx.body}</MDXRenderer> : <DocComponent doc={doc} />}
            </ArticleWrapper>
        </Layout>
    );
};

export const pageQuery = graphql`
    query APIDocs($slug: String) {
        mdx(frontmatter: { slug: { eq: $slug } }) {
            body
        }
        typeDocsJson(slug: { eq: $slug }) {
            kindString
            name
            id
            comment {
                shortText {
                    body
                }
                text {
                    body
                }
            }
            groups {
                title
                children
            }
            slug
            packageName
            signatures {
                name
                comment {
                    shortText {
                        body
                    }
                    text {
                        body
                    }
                }
            }
            childNodes {
                id
                flags {
                    isPrivate
                }
                signatures {
                    name
                    comment {
                        shortText {
                            body
                        }
                        text {
                            body
                        }
                    }
                    parameters {
                        id
                        name
                        comment {
                            shortText {
                                body
                            }
                            text {
                                body
                            }
                        }
                    }
                    inheritedFrom {
                        name
                    }
                }
            }
        }
    }
`;

export default Api;
