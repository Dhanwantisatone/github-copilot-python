# Instructions for Copilot: Sudoku Refactoring

## Architecture & Code Standards
- **Backend**: Python 3.10+ using Flask. Adhere to PEP 8 standards. Keep core board-solving algorithms and puzzle generation isolated in `sudoku_engine.py`.
- **Frontend**: Vanilla JavaScript (ES6+), responsive CSS Grid layout, and custom CSS variables to provide native Light and Dark theme toggling.
- **State & Storage**: Store the top 10 fastest game records in browser `localStorage`.
- **Puzzle Integrity**: Generated puzzles must be checked using a backtracking solver to ensure exactly one unique solution. All initial clue cells must remain read-only. 
