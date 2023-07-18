// Fake users data
import orderBy from 'lodash/orderBy';
import usersRaw from './users.json';

const users = orderBy(usersRaw, 'name');

export default function handler(req, res) {
    const { keywords, filter = keywords, ids } = req.query;
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const start = (page - 1) * pageSize;
    let filteredUsers = users;
    if (filter) {
        filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(filter.toLowerCase())
        );
    }
    if (ids) {
        const _ids = ids.map(Number);
        return res.status(200).json(filteredUsers.filter(u => _ids.includes(u.id)));
    }
    res.status(200).json({
        count: filteredUsers.length,
        results: filteredUsers.slice(start, start + pageSize),
        pageSize,
    });
}
