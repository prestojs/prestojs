import React from 'react';

export default function DateFormatter({ value }: { value: Date }): string {
    return value.toLocaleDateString();
}
