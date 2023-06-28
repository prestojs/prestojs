/**
 * Circular References
 *
 * This example demonstrates how circular references can be handled.
 *
 * ### Typing Note
 *
 * When using circular references you may see typescript errors like:
 *
 * **TS2506: 'User' is referenced directly or indirectly in its own base expression.**
 *
 * This shows a way to work around this issue while still retaining some type information. In particular, `_Group` is
 * created as a generic `ViewModelConstructor` to be used in `_User`. `_User` is then cast to a `ViewModelConstructor`
 * with the correct field types. This gives better type information that just using `ViewModelConstructor<any, any>` or
 * ignoring type errors.
 *
 * @wide
 */
import {
    CharField,
    IntegerField,
    RelatedViewModelField,
    useViewModelCache,
    ViewModelConstructor,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { Table } from 'antd';
import 'antd/dist/antd.min.css';

class Group extends viewModelFactory(
    {
        id: new IntegerField(),
        name: new CharField(),
        ownerId: new IntegerField(),
        owner: new RelatedViewModelField({
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            to: () => User as unknown as ViewModelConstructor<any, any>,
            sourceFieldName: 'ownerId',
        }),
    },
    { pkFieldName: 'id' }
) {}
const _Group = Group as ViewModelConstructor<any, any>;
class _User extends viewModelFactory(
    {
        id: new IntegerField(),
        name: new CharField(),
        groupId: new IntegerField(),
        group: new RelatedViewModelField({
            to: () => _Group,
            sourceFieldName: 'groupId',
        }),
    },
    { pkFieldName: 'id' }
) {}
const User = _User as unknown as ViewModelConstructor<
    Omit<typeof _User['fields'], 'group'> & {
        group: RelatedViewModelField<typeof Group>;
    },
    'id'
>;

User.cache.addList([
    { id: 1, name: 'Dave', groupId: 1 },
    { id: 2, name: 'Sarah', groupId: 1 },
    { id: 3, name: 'Jen', groupId: 2 },
]);
Group.cache.add([
    { id: 1, name: 'Admins', ownerId: 2 },
    { id: 2, name: 'Sales', ownerId: 3 },
    { id: 3, name: 'Custom Support', ownerId: 1 },
]);

function MemberList({ groupId }: { groupId: number }) {
    const users = useViewModelCache(User, cache =>
        cache.getAll('*').filter(user => user.groupId === groupId)
    );

    return (
        <div>
            {users.map(user => (
                <div key={user._key}>{user.name}</div>
            ))}
        </div>
    );
}

export default function CicularReferences() {
    const groups = useViewModelCache(Group, cache => cache.getAll('*'));
    return (
        <Table
            rowKey="_key"
            pagination={false}
            dataSource={groups}
            columns={[
                { title: 'Name', dataIndex: 'name' },
                { title: 'Owner', dataIndex: ['owner', 'name'] },
                {
                    title: 'Members',
                    dataIndex: 'members',
                    render(value, record) {
                        return <MemberList groupId={record.id} />;
                    },
                },
            ]}
        />
    );
}
