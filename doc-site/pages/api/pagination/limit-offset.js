// Fake users data
import users from '../users.json';

export default function handler(req, res) {
    const { filter } = req.query;
    const offset = Number(req.query.offset || 0);
    const limit = Number(req.query.limit || 10);
    let filteredUsers = users;
    if (filter) {
        filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(filter.toLowerCase())
        );
    }
    let nextOffset = offset + limit;
    if (nextOffset > filteredUsers) {
        nextOffset = null;
    }
    res.status(200).json({
        total: filteredUsers.length,
        results: filteredUsers.slice(offset, offset + limit),
        limit,
        nextOffset,
    });
}
