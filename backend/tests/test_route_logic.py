from __future__ import annotations

from app.routes.Route import _nearest_neighbour, _total_time


def test_nearest_neighbour_visits_all_and_returns_home():
    matrix = [
        [0, 10, 15, 20],
        [10, 0, 35, 25],
        [15, 35, 0, 30],
        [20, 25, 30, 0],
    ]
    path = _nearest_neighbour(matrix, start=0)
    assert path[0] == 0
    assert path[-1] == 0
    assert sorted(path[:-1]) == [0, 1, 2, 3]


def test_nearest_neighbour_handles_none_edges():
    matrix = [
        [0, None, 5],
        [None, 0, 8],
        [5, 8, 0],
    ]
    path = _nearest_neighbour(matrix, start=0)
    assert path[0] == 0 and path[-1] == 0
    assert set(path) == {0, 1, 2}


def test_total_time_sums_consecutive_legs():
    matrix = [
        [0, 10, 20],
        [10, 0, 5],
        [20, 5, 0],
    ]
    assert _total_time(matrix, [0, 1, 2, 0]) == 10 + 5 + 20