import { Form } from 'antd';
import React, { ComponentProps } from 'react';

/**
 * Form component that can be passed to UiProvider.
 *
 * See [UiProvider](/api/@prestojs/ui/UiProvider.html) for how to set this as the default
 * form component for use with [Form](/api/@prestojs/final-form/Form.html).
 *
 * @extract-docs
 * @menu-group Form
 */
export default function FormWrapper(
    props: ComponentProps<typeof Form> & {
        onSubmit: (data: Record<string, any>, ...args: any[]) => Promise<unknown>;
    }
): React.ReactElement {
    const { layout = 'horizontal', ...rest } = props;
    const formItemLayout =
        layout === 'horizontal'
            ? {
                  labelCol: {
                      xs: { span: 24 },
                      sm: { span: 6 },
                  },
                  wrapperCol: {
                      xs: { span: 24 },
                      sm: { span: 18 },
                  },
              }
            : null;
    return <Form layout={layout} {...formItemLayout} {...rest} onFinish={rest.onSubmit} />;
}
