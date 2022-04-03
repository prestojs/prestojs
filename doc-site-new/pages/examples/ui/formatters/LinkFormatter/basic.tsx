import { LinkFormatter } from '@prestojs/ui';
import { Button } from 'antd';
import React from 'react';

export default function Basic() {
    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <LinkFormatter value="https://prestojs.com">Presto</LinkFormatter>
            <hr />
            <strong>
                Specify <code>blankLabel</code> to control rendering when no value provided
            </strong>
            <LinkFormatter value={null} blankLabel={<em>None</em>} />
            <hr />
            <strong>
                Specify <code>linkComponent</code> to change what component is used to render the
                link
            </strong>
            <LinkFormatter linkComponent={Button} value="https://prestojs.com">
                Presto
            </LinkFormatter>
        </div>
    );
}
