import { NumberFormatter, RangeFormatter } from '@prestojs/ui';
import React from 'react';

export default function Basic() {
    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <RangeFormatter value={{ lower: 5, upper: 10 }} />
            <hr />
            <strong>
                Specify <code>boundsFormatter</code> and <code>boundsFormatterProps</code> to
                customise how the bounds are rendered
            </strong>
            <RangeFormatter
                value={{ lower: 50, upper: 100 }}
                boundsFormatterProps={{ localeOptions: { style: 'currency', currency: 'USD' } }}
                boundsFormatter={NumberFormatter}
            />
            <strong>
                Specify <code>blankLabel</code> to control rendering when no value provided
            </strong>
            <RangeFormatter value={null} blankLabel={<em>None</em>} />
            <hr />
            <strong>
                Specify <code>lowerFormatterProps</code> or <code>upperFormatterProps</code> to
                customise the props individually for lower or upper bounds
            </strong>
            <RangeFormatter
                value={{ lower: 50, upper: 100 }}
                boundsFormatterProps={{ localeOptions: { style: 'currency', currency: 'USD' } }}
                upperFormatterProps={{
                    localeOptions: {
                        style: 'currency',
                        currency: 'USD',
                        currencyDisplay: 'narrowSymbol',
                    },
                }}
                boundsFormatter={NumberFormatter}
            />{' '}
            <strong>
                Specify <code>separator</code> - defaults to <code>~</code>
            </strong>
            <RangeFormatter
                value={{ lower: 50, upper: 100 }}
                boundsFormatterProps={{ localeOptions: { style: 'currency', currency: 'USD' } }}
                boundsFormatter={NumberFormatter}
                separator="=>"
            />
            <hr />
            <strong>
                When one of the bounds is empty it needs to be handled by the{' '}
                <code>boundsFormatter</code>. For the provided Presto formatters you can pass{' '}
                <code>blankLabel</code>.
            </strong>
            <RangeFormatter
                value={{ lower: 50, upper: null }}
                boundsFormatterProps={{
                    localeOptions: { style: 'currency', currency: 'USD' },
                    blankLabel: '∞',
                }}
                boundsFormatter={NumberFormatter}
            />
            <hr />
            <strong>Empty lower range:</strong>
            <RangeFormatter
                value={{ lower: null, upper: 50 }}
                boundsFormatterProps={{
                    localeOptions: { style: 'currency', currency: 'USD' },
                    blankLabel: '∞',
                }}
                boundsFormatter={NumberFormatter}
            />
        </div>
    );
}
