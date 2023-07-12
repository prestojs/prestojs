import { FormItemProps } from '@prestojs/ui';
import { Form } from 'antd';
import React from 'react';

/**
 * FormItem component that can be passed to UiProvider.
 *
 * See [UiProvider](/api/@prestojs/ui/UiProvider.html) for how to set this as the default
 * form item component for use with [Form.Item](/api/@prestojs/final-form/FormItem.html).
 *
 * @extractdocs
 * @menugroup Form
 */
export default function FormItemWrapper({
    // Don't pass this through to the underlying ant Form.Item
    fieldName,
    ...props
}: FormItemProps): React.ReactElement {
    return <Form.Item {...props} />;
}
