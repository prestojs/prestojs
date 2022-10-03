/**
 * Basic usage
 */
import { NumberFormatter } from '@prestojs/ui';
import React from 'react';

export default function Basic() {
    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <NumberFormatter value={5000} />
            <hr />
            <strong>
                Specify{' '}
                <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString#using_options">
                    localOptions
                </a>{' '}
                to customise display
            </strong>
            <NumberFormatter value={5000} localeOptions={{ style: 'currency', currency: 'USD' }} />
            <strong>
                Specify <code>blankLabel</code> to control rendering when no value provided
            </strong>
            <NumberFormatter value={null} blankLabel={<em>None</em>} />
            <hr />
            <strong>
                Specify <code>invalidValueLabel</code> to change what is rendered when an invalid
                number is passed
            </strong>
            <NumberFormatter value="abc" invalidValueLabel={<em>Bad Value</em>} />
        </div>
    );
}
