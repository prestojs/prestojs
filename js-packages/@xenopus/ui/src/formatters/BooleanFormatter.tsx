export default function BooleanFormatter({
    value,
    blankLabel = '',
}: {
    value?: boolean;
    blankLabel: string;
}): string {
    return value ? 'Yes' : value === false ? 'No' : blankLabel;
}
