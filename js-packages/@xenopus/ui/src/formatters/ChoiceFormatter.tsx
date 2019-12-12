export default function ChoiceFormatter<T>({
    value,
    choices,
}: {
    value: T;
    choices: Array<[T, string]>;
}): string {
    const choiceValue = choices.find(choice => choice[0] === value);
    if (choiceValue === null || choiceValue === undefined) {
        console.warn(
            `Expected to find value choice label with value ${value} but no such choice option exists among `,
            choices
        );
        return (value as any).toString();
    }
    return (value as any).toString();
}
