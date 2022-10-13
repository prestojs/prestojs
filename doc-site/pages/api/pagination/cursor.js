// Fake users data
import users from '../users.json';

export default function handler(req, res) {
    const { filter, cursor } = req.query;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const limit = pageSize + 1;
    let filteredUsers = users;
    if (filter) {
        filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(filter.toLowerCase())
        );
    }
    let previousId = null;
    if (cursor) {
        const { id } = JSON.parse(Buffer.from(cursor, 'base64').toString('ascii'));
        const index = filteredUsers.findIndex(user => user.id === id);
        if (filteredUsers[index - pageSize]) {
            previousId = filteredUsers[index - pageSize].id;
        }
        filteredUsers = filteredUsers.slice(index, index + limit);
    } else {
        filteredUsers = filteredUsers.slice(0, limit);
    }
    let nextId = null;
    if (filteredUsers.length === limit) {
        nextId = filteredUsers.pop().id;
    }
    const cursorify = id =>
        id == null ? null : Buffer.from(JSON.stringify({ id })).toString('base64');
    res.status(200).json({
        results: filteredUsers,
        pageSize,
        previousCursor: cursorify(previousId),
        nextCursor: cursorify(nextId),
    });
}
