import { Form } from 'antd';
import React from 'react';

/**
 * FormItem component that can be passed to UiProvider.
 *
 * See [UiProvider](/api/@prestojs/ui/UiProvider.html) for how to set this as the default
 * form item component for use with [Form.Item](/api/@prestojs/final-form/FormItem.html).
 *
 * @extract-docs
 */
export default function FormItemWrapper(props): React.ReactElement {
    return <Form.Item {...props} />;
}
