import { ChoiceFormatter } from '@prestojs/ui';
import { ChoicesWidget } from '@prestojs/ui-antd';
import { Button } from 'antd';
import 'antd/es/radio/style/index.css';
import React, { useState } from 'react';

const choices: [string, string][] = [
    ['kiwi', '🥝'],
    ['strawberry', '🍓'],
    ['lemon', '🍋'],
    ['mango', '🥭'],
    ['peach', '🍑'],
    ['pineapple', '🍍'],
];

export default function Basic() {
    const [value, setValue] = useState<string | null>('kiwi');
    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <div>
                <ChoicesWidget
                    choices={choices}
                    input={{ value, onChange: ({ target: { value } }) => setValue(value) }}
                    widgetType="radio"
                />
                <Button type="link" onClick={() => setValue(null)}>
                    Clear
                </Button>
            </div>
            <p>
                {value || <em>none</em>}: <ChoiceFormatter choices={choices} value={value} />
            </p>
            <hr />
            <strong>
                Specify <code>blankLabel</code> to adjust rendering when no value provided
            </strong>
            <p>
                {value || <em>none</em>}:{' '}
                <ChoiceFormatter
                    choices={choices}
                    value={value}
                    blankLabel={<em>Not selected</em>}
                />
            </p>
            <hr />
            <strong>
                Specify <code>invalidChoiceLabel</code> to adjust rendering when invalid choice
                selected
            </strong>
            <ChoiceFormatter
                choices={choices}
                value="invalid_choice"
                invalidChoiceLabel={<em style={{ color: 'red' }}>Invalid value</em>}
            />
        </div>
    );
}
