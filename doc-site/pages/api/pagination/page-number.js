// Fake users data
import users from '../users.json';

export default function handler(req, res) {
    const { filter } = req.query;
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const start = (page - 1) * pageSize;
    let filteredUsers = users;
    if (filter) {
        filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(filter.toLowerCase())
        );
    }
    res.status(200).json({
        total: filteredUsers.length,
        results: filteredUsers.slice(start, start + pageSize),
        pageSize,
    });
}
