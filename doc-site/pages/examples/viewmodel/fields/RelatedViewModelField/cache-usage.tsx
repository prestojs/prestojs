/**
 * Simple usage
 *
 * Shows how to define a ViewModel with relations and retrieve data from the cache
 */
import { NumberFormatter } from '@prestojs/ui';
import {
    CharField,
    DecimalField,
    EmailField,
    IntegerField,
    RelatedViewModelField,
    useViewModelCache,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { Table } from 'antd';
import 'antd/dist/antd.min.css';
import React from 'react';

class User extends viewModelFactory(
    {
        id: new IntegerField(),
        name: new CharField(),
        emailAddress: new EmailField(),
    },
    { pkFieldName: 'id' }
) {}

class Invoice extends viewModelFactory(
    {
        id: new IntegerField(),
        invoiceNumber: new CharField(),
        amount: new DecimalField(),
        userId: new IntegerField(),
        user: new RelatedViewModelField({ to: User, sourceFieldName: 'userId' }),
    },
    { pkFieldName: 'id' }
) {}

User.cache.addList([
    { id: 1, name: 'Dave', emailAddress: 'dave@example.com' },
    { id: 2, name: 'Sarah', emailAddress: 'sarah@example.com' },
    { id: 3, name: 'Jen', emailAddress: 'jen@example.com' },
]);
Invoice.cache.add([
    { id: 1, userId: 3, invoiceNumber: '12345678', amount: '100' },
    { id: 2, userId: 1, invoiceNumber: '22345678', amount: '53.90' },
    { id: 3, userId: 2, invoiceNumber: '32345678', amount: '150.12' },
    { id: 4, userId: 2, invoiceNumber: '42345678', amount: '1500.01' },
    { id: 5, userId: 3, invoiceNumber: '52345678', amount: '99.99' },
]);

export default function CacheUsage() {
    const invoices = useViewModelCache(Invoice, cache =>
        cache.getAll(['invoiceNumber', 'amount', ['user', 'name']])
    );
    return (
        <Table
            rowKey="_key"
            pagination={false}
            dataSource={invoices}
            columns={[
                { title: 'User', dataIndex: ['user', 'name'] },
                { title: 'Invoice Number', dataIndex: 'invoiceNumber' },
                {
                    title: 'Amount',
                    dataIndex: 'amount',
                    render(value) {
                        return (
                            <NumberFormatter
                                value={value}
                                localeOptions={{ style: 'currency', currency: 'AUD' }}
                            />
                        );
                    },
                },
            ]}
        />
    );
}
