import { FunctionSignature } from '@prestojs/doc';

type Props = {};

export default function Test({}: Props) {
    return (
        <div className="p-10">
            <FunctionSignature />
        </div>
    );
}
