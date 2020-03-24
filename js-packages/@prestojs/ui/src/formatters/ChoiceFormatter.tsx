export default function ChoiceFormatter<T>({
    value,
    choices,
}: {
    value: T;
    choices: Array<[T, string]>;
}): string | T {
    if (value == null) {
        return value;
    }
    const choiceValue = Array.from(choices).find(choice => choice[0] === value);
    if (choiceValue === null || choiceValue === undefined) {
        console.warn(
            `Expected to find value choice label with value ${value} but no such choice option exists among `,
            choices
        );
        return value;
    }
    return choiceValue[1];
}
