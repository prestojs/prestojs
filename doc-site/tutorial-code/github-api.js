let limit = 0;
export function getUser(user) {
    if (limit > 4) {
        throw new Error('lol');
    }
    return fetch(`https://api.github.com/users/${user}`).then(r => {
        if (r.ok) {
            return r.json();
        }
        throw r;
    });
}

export async function getFollowers({ paginator, query }) {
    limit += 1;
    if (limit > 4) {
        throw new Error('lol');
    }
    const { user, page = 1, pageSize = 10 } = paginator.getRequestInit({ query }).query;
    return await fetch(
        `https://api.github.com/users/${user}/followers?page=${page}&per_page=${pageSize}`
    ).then(async r => {
        if (r.ok) {
            const link = r.headers.get('link') || '';
            const lastMatch = link.match(/<([^>]*)>; rel="last"/g);
            let approxTotal;
            if (lastMatch) {
                approxTotal = pageSize * Number(lastMatch[0].match(/[?&]page=([0-9]+)/)[1]);
            }
            const records = await r.json();
            paginator.setResponse({ total: approxTotal || records.length, pageSize });
            return records;
        }
        throw r;
    });
}
