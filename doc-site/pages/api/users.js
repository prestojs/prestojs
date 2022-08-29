// Fake users data
import users from './users.json';

export default function handler(req, res) {
    const { filter } = req.query;
    let filteredUsers = users.slice(0, 10);
    if (filter) {
        filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(filter.toLowerCase())
        );
    }
    res.status(200).json(filteredUsers);
}
