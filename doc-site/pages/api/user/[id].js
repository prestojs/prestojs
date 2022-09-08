// Fake users data
import users from '../users.json';

export default function userHandler(req, res) {
    const {
        query: { id },
        method,
    } = req;

    const user = users.find(user => user.id === Number(id));
    if (!user) {
        res.status(404).end('Record not found');
        return;
    }

    switch (method) {
        case 'GET':
            res.status(200).json(user);
            break;
        case 'PUT':
            const data = JSON.parse(req.body);
            if (!data.name) {
                return res.status(400).json('Please enter a name');
            }
            res.status(200).json({ ...user, name: data.name });
            break;
        case 'DELETE':
            res.status(204).end();
            break;
        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
