import React from 'react';

export default function CharFormatter({ value }: { value?: string }): string {
    return value || '';
}
