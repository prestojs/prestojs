import React from 'react';

export default function TimeFormatter({ value, ...rest }: { value: Date }): string {
    return value.toLocaleTimeString();
}
