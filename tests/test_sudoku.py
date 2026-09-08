import sys
import os
import unittest

# Ensure Python can locate modules inside the starter directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'starter')))

import sudoku_logic


class TestSudokuLogic(unittest.TestCase):
    def test_row_col_safe(self):
        board = sudoku_logic.create_empty_board()
        board[0][0] = 5
        self.assertFalse(sudoku_logic.is_safe(board, 0, 4, 5))
        self.assertTrue(sudoku_logic.is_safe(board, 1, 4, 5))

    def test_box_safe(self):
        board = sudoku_logic.create_empty_board()
        board[0][0] = 7
        self.assertFalse(sudoku_logic.is_safe(board, 1, 1, 7))

    def test_unique_solution_guarantee(self):
        puzzle, _ = sudoku_logic.generate_puzzle("easy")
        test_board = sudoku_logic.deep_copy(puzzle)
        self.assertEqual(sudoku_logic.count_solutions(test_board, limit=2), 1)

    def test_count_solutions_stops_at_two(self):
        board = sudoku_logic.create_empty_board()

        self.assertEqual(sudoku_logic.count_solutions(board, limit=2), 2)


if __name__ == "__main__":
    unittest.main()