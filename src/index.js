import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'font-awesome/css/font-awesome.min.css';

function Square(props) {
    let className;
    if (props.value === 'X') {
        className = 'fa fa-circle bg-white';
    } else if (props.value === 'O') {
        className = 'fa fa-circle-thin bg-white';
    }
    return (
        <button className={props.class} onClick={props.onClick}>
            <i className={className}>{}</i>
        </button>
    );
}

class Board extends React.Component {
    renderSquare(i) {
        let className = this.props.winningBlocks && this.props.winningBlocks.length && this.props.winningBlocks.find(block => block === i) >= 0 ?
            'square winning-block' :
            'square';
        return (<Square
            class={className}
            key={i}
            value={this.props.squares[i]}
            onClick={() => this.props.onClick(i)}
        />);
    }

    render() {
        const size = Math.sqrt(this.props.squares.length);
        let squareIndex = -1;
        return (
            <div>
                {
                    [...Array(size).keys()].map((val, i) => {
                        return <div key={i} className="board-row">{
                            [...Array(size).keys()].map(() => {
                                squareIndex++;
                                return this.renderSquare(squareIndex);
                            })
                        }</div>
                    })
                }
            </div>
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        const size = 15;
        this.state = {
            history: [{
                squares: Array(Math.pow(size, 2)).fill(null),
                location: {
                    id: null,
                    row: null,
                    col: null
                }
            }],
            stepNumber: 0,
            xIsNext: true,
            movesDesc: true,
        }
    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();

        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? 'X' : 'O';
        this.setState({
            history: history.concat([{
                squares: squares,
                location: calculateLocation(i, squares)
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
        });
    }

    handleToggleMovesBtnClick() {
        this.setState({
            movesDesc: !this.state.movesDesc
        })
    }

    handleGameRestart() {
        this.setState({
            stepNumber: 0,
            history: this.state.history.slice(0, 1),
            xIsNext: true,
        })
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
        })
    }

    renderNextPlayerColor() {
        if (this.state.xIsNext) {
            return (
                <span className="text-lg">{'Next Player: '}<i className="fa fa-circle bg-white">{}</i></span>
            )
        } else {
            return (
                <span className="text-lg">{'Next Player: '}<i className="fa fa-circle-thin bg-white">{}</i></span>
            )
        }
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const result = calculateWinner(current.squares);

        // calculate moves
        // Array.props.map((value, index) => {})
        const moves = history.map((step, move) => {
            const location = step.location;
            const isSelected = this.state.stepNumber === move;
            const desc = move ?
                'Go to move #' + move + ': (' + location.row + ', ' + location.col + ')' :
                'Go to game start';
            return (
                <li key={move}>
                    <button className={'btn btn-secondary' + (isSelected ? ' selected' : '')}
                            onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            )
        }).sort((a, b) => {
            return this.state.movesDesc ? a.key - b.key : b.key - a.key
        });

        let status;

        if (result && result.winner) {
            status = 'Winner: ' + result.winner;
        } else if (result && result.draw) {
            status = 'Draw!!'
        } else {
            status = this.renderNextPlayerColor();
        }

        return (
            <div className="game">
                <div className="game-board">
                    <div className="mb-3">
                        <button className="btn btn-danger" onClick={() => this.handleGameRestart()}>
                            Restart Game
                        </button>
                    </div>
                    <Board
                        squares={current.squares}
                        winningBlocks={result && result.blocks}
                        onClick={(i) => this.handleClick(i)}
                    />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <div>
                        <button className="btn btn-primary mt-3" onClick={() => this.handleToggleMovesBtnClick()}>
                            Toggle Moves
                        </button>
                    </div>
                    <ol className="moves">
                        <li>
                            <hr/>
                        </li>
                        {moves}
                    </ol>
                </div>
            </div>
        );
    }
}

function calculateWinner(squares) {
    let currentLocation;
    // let prevLocation = null;
    // let locations = [];
    let size = Math.sqrt(squares.length);
    let diagonal = {'X': 0, 'O': 0,},
        invDiagonal = {'X': 0, 'O': 0},
        vertical = Array(size).fill().map(() => Object({'X': 0, 'O': 0})),
        horizontal = Array(size).fill().map(() => Object({'X': 0, 'O': 0}));

    let result = {}, winner;

    squares.forEach((square, index) => {
        if (squares[index]) {
            currentLocation = calculateLocation(index, squares);
            // vertical
            vertical[currentLocation.col - 1][squares[index]]++;
            winner = checkWhoWins(vertical[currentLocation.col - 1], size);

            // horizontal
            horizontal[currentLocation.row - 1][squares[index]]++;
            if (!winner) winner = checkWhoWins(horizontal[currentLocation.row - 1], size);

            // diagonal
            if (currentLocation.row === currentLocation.col) {
                diagonal[squares[index]]++;
                if (!winner) winner = checkWhoWins(diagonal, size);
            }
            // inverse diagonal
            if (currentLocation.row === (size + 1 - currentLocation.col)) {
                invDiagonal[squares[index]]++;
                if (!winner) winner = checkWhoWins(invDiagonal, size);
            }

            if (winner) {
                result = {
                    winner: winner,
                };
                return;
            }

        }
    });

    if (result && result.winner) {
        return result
    }

    let numEmptySquare = 0;
    squares.forEach(s => {
        if (!s) {
            numEmptySquare++
        }
    });
    // if no empty square and no one is winning, mark as draw
    if (!numEmptySquare) {
        return {
            draw: true
        }
    }
    // no winner yet, game continues
    return null;
}

function calculateLocation(i, squares) {
    let size = Math.sqrt(squares.length);
    let row = Math.ceil((i + 1) / size);
    let col = (i + 1) % size || size;
    return {
        id: i,
        row: row,
        col: col
    }
}

function checkWhoWins(count, size) {
    if (count['X'] === size) {
        return 'X'
    } else if (count['O'] === size) {
        return 'O'
    } else {
        return null
    }
}

// ========================================

ReactDOM.render(
    <Game/>,
    document.getElementById('root')
);