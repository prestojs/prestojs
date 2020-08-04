import { getClassDetails, getTypeArguments } from '../../util';
import ApiDocHeader from '../ApiDocHeader';
import Article from '../Article';
import TypeArgProvider from '../TypeArgProvider';
import ClassDetails from './ClassDetails';

export default function UnionInterface({ doc }) {
    const typeArguments = getTypeArguments(doc);
    const unionDetails = doc.type.types.map(type => {
        const resolvedType = type.referencedType();
        return [resolvedType, getClassDetails(resolvedType)];
    });
    return (
        <TypeArgProvider typeArguments={typeArguments}>
            <Article>
                <ApiDocHeader doc={doc} isType={true} />
                {doc.mdx && <div className="mb-20" dangerouslySetInnerHTML={{ __html: doc.mdx }} />}
                <p className="text-2xl mb-10">An interface that matches one of the following:</p>
                {unionDetails.map(([interfaceDoc, details], i) => {
                    return (
                        <React.Fragment key={i}>
                            <h3 className="text-5xl">{interfaceDoc.name}</h3>
                            {interfaceDoc.mdx && (
                                <div
                                    className="mb-20"
                                    dangerouslySetInnerHTML={{ __html: interfaceDoc.mdx }}
                                />
                            )}
                            <ClassDetails {...details} />
                            {i !== unionDetails.length - 1 && <hr className="my-10" />}
                        </React.Fragment>
                    );
                })}
            </Article>
        </TypeArgProvider>
    );
}
