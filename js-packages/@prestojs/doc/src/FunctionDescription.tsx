import React from 'react';
import { JSONOutput } from 'typedoc';
import Modal from './Modal';
import SignatureDoc from './SignatureDoc';

type Props = {
    signatures?: JSONOutput.SignatureReflection[];
};

export default function FunctionDescription({ signatures }: Props) {
    const [showModal, setShowModal] = React.useState(false);
    if (!signatures?.length) {
        return <span className="text-orange-400">Function</span>;
    }
    return (
        <span className="text-orange-400">
            <button
                className="underline text-orange-400 hover:text-orange-600"
                onClick={() => setShowModal(true)}
            >
                Function
            </button>
            <Modal isVisible={showModal} onClose={() => setShowModal(false)}>
                <SignatureDoc signature={signatures[0]} />
            </Modal>
        </span>
    );
}
