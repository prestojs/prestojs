import { useMemo } from 'react';

interface ObjectInspectorProps {
    value: unknown;
    label?: string;
    depth?: number;
}

function formatPrimitive(value: unknown): string {
    if (value == null) {
        return String(value);
    }
    if (typeof value === 'string') {
        return `"${value}"`;
    }
    return String(value);
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function typeLabel(value: unknown): string {
    if (Array.isArray(value)) {
        return `Array(${value.length})`;
    }
    if (isObjectLike(value)) {
        return 'Object';
    }
    return typeof value;
}

export default function ObjectInspector({
    value,
    label = 'value',
    depth = 0,
}: ObjectInspectorProps): JSX.Element {
    const openByDefault = depth < 2;
    const objectEntries = useMemo(
        () =>
            isObjectLike(value) ? Object.entries(value).sort(([a], [b]) => a.localeCompare(b)) : [],
        [value]
    );

    if (!Array.isArray(value) && !isObjectLike(value)) {
        return (
            <div className="object-node object-primitive">
                <span className="object-key">{label}</span>
                <span className="object-sep">: </span>
                <span className="object-value">{formatPrimitive(value)}</span>
            </div>
        );
    }

    if (Array.isArray(value)) {
        return (
            <details className="object-node" open={openByDefault}>
                <summary>
                    <span className="object-key">{label}</span>
                    <span className="object-sep">: </span>
                    <span className="object-type">{typeLabel(value)}</span>
                </summary>
                <div className="object-children">
                    {value.length === 0 ? (
                        <div className="object-empty">empty</div>
                    ) : (
                        value.map((item, index) => (
                            <ObjectInspector
                                key={`${label}[${index}]`}
                                label={`[${index}]`}
                                value={item}
                                depth={depth + 1}
                            />
                        ))
                    )}
                </div>
            </details>
        );
    }

    return (
        <details className="object-node" open={openByDefault}>
            <summary>
                <span className="object-key">{label}</span>
                <span className="object-sep">: </span>
                <span className="object-type">{typeLabel(value)}</span>
            </summary>
            <div className="object-children">
                {objectEntries.length === 0 ? (
                    <div className="object-empty">empty</div>
                ) : (
                    objectEntries.map(([key, child]) => (
                        <ObjectInspector
                            key={`${label}.${key}`}
                            label={key}
                            value={child}
                            depth={depth + 1}
                        />
                    ))
                )}
            </div>
        </details>
    );
}
