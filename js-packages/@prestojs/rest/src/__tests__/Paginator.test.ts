import Paginator from '../Paginator';

test('pagination setState should change state', () => {
    const paginator = new Paginator({});
    paginator.setState(() => ({ page: 1 }));
    expect(paginator.currentState).toEqual({ page: 1 });
    const prevState = paginator.currentState;
    // Don't change state if new state is the same
    paginator.setState(() => ({ page: 1 }));
    expect(paginator.currentState).toEqual(prevState);
    paginator.setState(() => ({ page: 2 }));
    expect(paginator.currentState).not.toEqual(prevState);
    expect(paginator.currentState).toEqual({ page: 2 });
});

test('pagination setState should trigger onChange', () => {
    const onChange = jest.fn();
    const paginator = new Paginator({}, onChange);
    paginator.setState(() => ({ page: 1 }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    // Don't change state if new state is the same
    paginator.setState(() => ({ page: 1 }));
    expect(onChange).toHaveBeenCalledTimes(1);
    paginator.setState(() => ({ page: 2 }));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
});
