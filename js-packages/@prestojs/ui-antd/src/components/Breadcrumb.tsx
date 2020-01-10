import { Breadcrumb as BreadAnt } from 'antd';
import { Breadcrumb as BreadPresto } from '@prestojs/ui';
import React from 'react';

/**
 * See [Breadcrumb](https://ant.design/components/breadcrumb/) for props available
 *
 * @extract-docs
 */
export default function Breadcrumb(props): React.ReactElement {
    return (
        <BreadAnt {...props}>
            <BreadPresto Crumb={BreadAnt.Item} />
        </BreadAnt>
    );
}
