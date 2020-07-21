import { UrlPattern } from '@prestojs/routing';
import { CharField, viewModelFactory } from '@prestojs/viewmodel';
import { FetchMock } from 'jest-fetch-mock';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { recordEqualTo } from '../../../../../js-testing/matchers';
import ViewModelEndpoint from '../ViewModelEndpoint';

const fetchMock = fetch as FetchMock;

beforeEach(() => {
    fetchMock.resetMocks();
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createData() {
    const User = viewModelFactory({
        firstName: new CharField(),
        lastName: new CharField(),
    });

    const Food = viewModelFactory({
        name: new CharField(),
    });

    const users = [
        {
            id: 1,
            firstName: 'Bilbo',
            lastName: 'Baggins',
        },
        {
            id: 2,
            firstName: 'Frodo',
            lastName: 'Baggins',
        },
        {
            id: 3,
            firstName: 'Gandalf',
            lastName: '',
        },
    ];

    const foodItems = [
        {
            id: 1,
            name: 'Bagel',
        },
        {
            id: 2,
            name: 'Sausage',
        },
        {
            id: 3,
            name: 'Cheese',
        },
    ];

    const bilbo = new User(users[0]);
    const frodo = new User(users[1]);
    const gandalf = new User(users[2]);
    const bagel = new Food(foodItems[0]);
    const sausage = new Food(foodItems[1]);
    const cheese = new Food(foodItems[2]);

    return { User, users, Food, foodItems, bilbo, frodo, gandalf, bagel, sausage, cheese };
}

function mockJsonResponse(data): void {
    fetchMock.mockResponseOnce(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

test('should support single ViewModel as mapping for standard single/list responses', async () => {
    const { User, users, bilbo, frodo, gandalf } = createData();
    const endpoint = new ViewModelEndpoint(new UrlPattern('/user/'), User);
    mockJsonResponse(users[0]);
    expect((await endpoint.execute()).result).toBeEqualToRecord(bilbo);
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);

    mockJsonResponse(users.slice(0, 3));
    expect((await endpoint.execute()).result).toBeEqualToRecord(
        users.slice(0, 3).map(u => new User(u))
    );
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);
    expect(User.cache.get(2, ['firstName', 'lastName'])).toBeEqualToRecord(frodo);
    expect(User.cache.get(3, ['firstName', 'lastName'])).toBeEqualToRecord(gandalf);
});

test('should support object mapping', async () => {
    const {
        User,
        Food,
        users,
        foodItems,
        sausage,
        cheese,
        bagel,
        bilbo,
        frodo,
        gandalf,
    } = createData();
    const endpoint = new ViewModelEndpoint(new UrlPattern('/combined/'), {
        user: User,
        food: Food,
    });
    mockJsonResponse({ user: users[0] });
    expect((await endpoint.execute()).result).toEqual({ user: recordEqualTo(bilbo) });
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);

    mockJsonResponse({ user: users[1], food: foodItems[0] });
    expect((await endpoint.execute()).result).toEqual({
        user: recordEqualTo(frodo),
        food: recordEqualTo(bagel),
    });
    expect(User.cache.get(2, ['firstName', 'lastName'])).toBeEqualToRecord(frodo);
    expect(Food.cache.get(1, ['name'])).toBeEqualToRecord(bagel);

    mockJsonResponse({ user: users.slice(0, 3), food: foodItems.slice(0, 3) });
    expect((await endpoint.execute()).result).toEqual({
        user: [bilbo, frodo, gandalf],
        food: [bagel, sausage, cheese],
    });
});

test('should support nested object mapping', async () => {
    const { User, Food, users, foodItems, sausage, bagel, bilbo } = createData();
    const endpoint = new ViewModelEndpoint(new UrlPattern('/combined/'), {
        'records.user': User,
        'records.food': Food,
    });
    mockJsonResponse({ records: { user: users[0], food: foodItems.slice(0, 2) } });
    expect((await endpoint.execute()).result).toEqual({
        records: {
            user: recordEqualTo(bilbo),
            food: [bagel, sausage],
        },
    });
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);

    expect(Food.cache.get(1, ['name'])).toBeEqualToRecord(bagel);
    expect(Food.cache.get(2, ['name'])).toBeEqualToRecord(sausage);
});

test('extra keys should be retained', async () => {
    const { User, Food, users, foodItems, sausage, bagel, bilbo } = createData();
    const endpoint = new ViewModelEndpoint(new UrlPattern('/combined/'), {
        'records.user': User,
        'records.food': Food,
    });
    mockJsonResponse({
        records: { user: users[0], food: foodItems.slice(0, 2), numbers: [1, 2, 3] },
        other: true,
    });
    expect((await endpoint.execute()).result).toEqual({
        records: {
            user: recordEqualTo(bilbo),
            food: [bagel, sausage],
            numbers: [1, 2, 3],
        },
        other: true,
    });
});

test('should support defining mapping as a function/promise', async () => {
    const { User, Food, users, foodItems, sausage, bagel, bilbo } = createData();
    const endpoint = new ViewModelEndpoint(new UrlPattern('/combined/'), () =>
        Promise.resolve({
            'records.user': User,
            'records.food': Food,
        })
    );
    mockJsonResponse({ records: { user: users[0], food: foodItems.slice(0, 2) } });
    expect((await endpoint.execute()).result).toEqual({
        records: {
            user: recordEqualTo(bilbo),
            food: [bagel, sausage],
        },
    });
    expect(User.cache.get(1, ['firstName', 'lastName'])).toBeEqualToRecord(bilbo);

    expect(Food.cache.get(1, ['name'])).toBeEqualToRecord(bagel);
    expect(Food.cache.get(2, ['name'])).toBeEqualToRecord(sausage);
});
