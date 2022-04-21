export interface RichDescription {
    short?: string;
    long?: string;
    returns?: string;
}

export interface FunctionPage {
    pageType: 'function';
    name: string;
    signatures: Signature[];
    description?: RichDescription;
    sourceLocation?: SourceLocation;
    typeParameters?: TypeParameter[];
}

export interface ClassConstructor {
    signatures: Signature[];
}

export interface PageSection {
    title: string;
    anchorId: string;
    showEmpty?: boolean;
    links: { title: string; anchorId: string; isInherited?: boolean }[];
}

export interface ClassPage {
    pageType: 'class';
    pageSections: PageSection[];
    name: string;
    description?: RichDescription;
    constructorDefinition?: ClassConstructor;
    methods: MethodType[];
    properties: VariableNode[];
    staticMethods: MethodType[];
    staticProperties: VariableNode[];
    sourceLocation?: SourceLocation;
    typeParameters?: TypeParameter[];
    hierarchy: {
        parent: ReferenceLinkType | ExternalReferenceType | null;
        children: (ReferenceLinkType | ExternalReferenceType)[];
    };
}

export type Page = FunctionPage | ClassPage;

export interface DocNode {
    anchorId: string;
    flags: Flags;
    name: string;
    description?: RichDescription;
    sourceLocation?: SourceLocation;
    isInherited?: boolean;
}
export interface VariableNode extends DocNode {
    type: DocType;
}

export interface TypeParameter {
    name: string;
    type?: DocType;
    default?: DocType;
    description?: RichDescription;
}

export interface SignatureParameter {
    description?: RichDescription;
    name: string;
    type: DocType;
    flags: Flags;
}

export interface Flags {
    isOptional?: boolean;
    isRestArg?: boolean;
    isDeprecated?: boolean;
    isForwardRef?: boolean;
    expandProperties?: boolean;
    deprecatedReason?: string;
}

export interface Signature extends DocNode {
    parameters: SignatureParameter[];
    returnType?: DocType;
    typeParameters?: TypeParameter[];
    sourceLocation?: SourceLocation;
}

// Types

export interface UnionType {
    typeName: 'union';
    types: DocType[];
}

export interface ArrayType {
    typeName: 'array';
    elementType: DocType;
}

export interface TupleType {
    typeName: 'tuple';
    elements: DocType[];
}

export interface IntrinsicType {
    typeName: 'intrinsic';
    name: string;
}

export interface LiteralType {
    typeName: 'literal';
    value: string | number | boolean | null | bigint | { value: string; negative: boolean };
}

export interface SourceLocation {
    fileName: string;
    line: number;
}

export interface ReferenceLinkType {
    typeName: 'referenceLink';
    name: string;
    url: string;
}

export interface TypeArgumentReference {
    typeName: 'typeArgument';
    name: string;
    id: number;
    description?: RichDescription;
}

export interface MethodType {
    typeName: 'methodType';
    name: string;
    signatures: Signature[];
}

export interface ContainerType {
    typeName: 'container';
    name?: string;
    children: {
        flags: Flags;
        name: string;
        type: DocType;
        description?: RichDescription;
    }[];
}

export interface UnknownType {
    typeName: 'unknown';
    name: string;
}
export interface ExternalReferenceType {
    typeName: 'externalReference';
    name: string;
    url: string;
}

export interface PropertiesFromReference {
    typeName: 'propertiesFrom';
    type: DocType;
}
export interface MappedType {
    typeName: 'mapped';
    // TODO: How?
}
export interface IndexedAccessType {
    typeName: 'indexedAccess';
    objectType: DocType;
    indexType: DocType;
}

export interface PredicateType {
    typeName: 'predicate';
    // TODO: For now we'll just show return as boolean but maybe in future care more
}
export type DocType =
    | UnknownType
    | PropertiesFromReference
    | ExternalReferenceType
    | UnionType
    | ArrayType
    | MethodType
    | TupleType
    | IntrinsicType
    | LiteralType
    | ReferenceLinkType
    | TypeArgumentReference
    | MappedType
    | IndexedAccessType
    | PredicateType
    | ContainerType;

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

export type PageMetaData = {
    packageName: string;
    permaLink: string;
    menuGroup: string;
    examples: DocExample[];
};
