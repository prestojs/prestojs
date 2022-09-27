/**
 * TimeFormatter usage
 */
import CodeBlock from '@prestojs/doc/components/CodeBlock';
import { TimeFormatter } from '@prestojs/ui';
import React from 'react';

export default function Basic() {
    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <CodeBlock>{'<TimeFormatter value="3:55:00" />'}</CodeBlock>
            <TimeFormatter value="3:55:00" />
            <hr />
            <strong>
                Specify{' '}
                <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString#using_options">
                    localOptions
                </a>{' '}
                to customise display
            </strong>
            <CodeBlock>
                {
                    '<TimeFormatter value="03:55" locales="en-AU" localeOptions={{ timeStyle: "short" }} />'
                }
            </CodeBlock>
            <TimeFormatter value="03:55" locales="en-AU" localeOptions={{ timeStyle: 'short' }} />
            <strong>
                Specify <code>blankLabel</code> to control rendering when no value provided
            </strong>
            <CodeBlock>{'<TimeFormatter value={null} blankLabel={<em>None</em>} />'}</CodeBlock>
            <TimeFormatter value={null} blankLabel={<em>None</em>} />
            <hr />
            <strong>
                Specify <code>invalidValueLabel</code> to change what is rendered when an invalid
                time is passed
            </strong>
            <CodeBlock>
                {'<TimeFormatter value="abc" invalidValueLabel={<em>Bad Value</em>} />'}
            </CodeBlock>
            <TimeFormatter value="abc" invalidValueLabel={<em>Bad Value</em>} />
        </div>
    );
}
