from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# In-memory store for the active game session
CURRENT = {
    'puzzle': None,
    'solution': None,
    'difficulty': 'medium'
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    difficulty = request.args.get('difficulty', 'medium').lower()
    puzzle, solution = sudoku_logic.generate_puzzle(difficulty)
    
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    CURRENT['difficulty'] = difficulty
    
    return jsonify({
        'puzzle': puzzle,
        'difficulty': difficulty
    })

@app.route('/check', methods=['POST'])
def check_solution():
    data = request.get_json() or {}
    board = data.get('board')
    solution = CURRENT.get('solution')
    
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400
    
    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            val = board[i][j]
            # Flag user-entered numbers that do not match the answer
            if val != 0 and val != solution[i][j]:
                incorrect.append([i, j])
                
    return jsonify({'incorrect': incorrect})

@app.route('/hint', methods=['POST'])
def get_hint():
    data = request.get_json() or {}
    board = data.get('board')
    solution = CURRENT.get('solution')
    
    if solution is None or not board:
        return jsonify({'error': 'No game in progress'}), 400
    
    # Locate empty positions
    empty_cells = [
        (r, c)
        for r in range(sudoku_logic.SIZE)
        for c in range(sudoku_logic.SIZE)
        if board[r][c] == 0
    ]
    
    if not empty_cells:
        return jsonify({'message': 'Board is full'}), 200
    
    import random
    r, c = random.choice(empty_cells)
    return jsonify({
        'row': r,
        'col': c,
        'value': solution[r][c]
    })

@app.route('/validate-move', methods=['POST'])
def validate_move():
    data = request.get_json() or {}
    board = data.get('board')
    row = data.get('row')
    col = data.get('col')
    val = data.get('value')
    
    if None in (board, row, col, val):
        return jsonify({'valid': False, 'error': 'Missing data'}), 400
    
    if val == 0:
        return jsonify({'valid': True})
    
    return jsonify({'valid': sudoku_logic.is_safe(board, row, col, val)})


if __name__ == '__main__':
    app.run(debug=True, port=5000)