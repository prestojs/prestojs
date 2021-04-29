import { Form } from '@prestojs/final-form';
import { Button } from 'antd';
import AllFieldsModel from './models/AllFieldsModel';

export default function AllFieldsForm(props) {
    return (
        <Form {...props}>
            {Object.values(AllFieldsModel.fields)
                .filter(field => field.name !== AllFieldsModel.pkFieldName)
                .map(field => (
                    <Form.Item field={field} key={field.name} />
                ))}
            <Form.Item wrapperCol={{ span: 12, offset: 6 }}>
                <Button htmlType="submit" type="primary">
                    Submit
                </Button>
            </Form.Item>
        </Form>
    );
}
