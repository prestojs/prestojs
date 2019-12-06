import React from 'react';

export default function DateTimeFormatter({ value }: { value: Date }): string {
    return value.toLocaleString();
}
