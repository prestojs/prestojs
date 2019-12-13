import { ViewModel } from '@prestojs/viewmodel';
import { useEffect, useState } from 'react';

// Placeholder until proper version written in @prestojs
export default function useConnected(data) {
    const [record, setRecord] = useState(() => {
        if (data instanceof ViewModel) {
            return data._model.cache.get(data._pk, data._assignedFields);
        }
        if (Array.isArray(data)) {
            const { _model, _assignedFields } = data[0];
            return _model.cache.getList(
                data.map(r => r._pk),
                _assignedFields
            );
        }
        return null;
    });

    useEffect(() => {
        if (data instanceof ViewModel) {
            setRecord(data);
            return data._model.cache.addListener(
                data._pk,
                data._assignedFields,
                (previous, next) => {
                    setRecord(next);
                }
            );
        } else if (Array.isArray(data)) {
            setRecord(data);
            if (data.length > 0) {
                const { _model, _assignedFields } = data[0];
                return _model.cache.addListenerList(
                    data.map(r => r._pk),
                    _assignedFields,
                    (previous, next) => {
                        setRecord(next);
                    }
                );
            }
        }
        return undefined;
    }, [data]);
    return record;
}
