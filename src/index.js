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
            winners: [null],
            draw: false,
        }
    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        const winners = this.state.winners.slice(0, this.state.stepNumber + 1);
        const winner = winners[winners.length - 1];
        const draw = this.state.draw;

        // if the game already has a winner or the game is draw or square is already filled, no change to game board
        if (winner && winner.winner || squares[i] || draw) {
            return;
        }

        // else check if user will win after the move
        squares[i] = this.state.xIsNext ? 'X' : 'O';
        const calculatedWinner = calculateWinner(squares, i);
        this.setState({
            history: history.concat([{
                squares: squares,
                location: calculateLocation(i, squares)
            }]),
            winners: winners.concat({
                winner: calculatedWinner && calculatedWinner.winner,
                blocks: calculatedWinner && calculatedWinner.blocks || []
            }),
            stepNumber: history.length,
            draw: !!(calculatedWinner && calculatedWinner.draw),
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
            winners: [null],
            draw: false,
        })
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
        })
    }

    renderGameInfo(text, val) {
        if (val === 'X') {
            return (
                <span className="text-lg">{text}<i className="fa fa-circle bg-white">{}</i></span>
            )
        } else {
            return (
                <span className="text-lg">{text}<i className="fa fa-circle-thin bg-white">{}</i></span>
            )
        }
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = this.state.winners[this.state.stepNumber];

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

        // construct stats info
        let status;

        if (winner) {
            status = this.renderGameInfo('Winner: ', winner.winner)
        } else if (this.state.draw) {
            status = 'Draw!!'
        } else {
            status = this.renderGameInfo('Next Player: ', this.state.xIsNext ? 'X' : 'O')
        }

        // render component
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
                        winningBlocks={winner && winner.blocks}
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

function calculateWinner(squares, i) {
    // let prevLocation = null;
    // let locations = [];
    let size = Math.sqrt(squares.length);
    const WINNING_SIZE = 5;
    const currentLocation = calculateLocation(i, squares);

    let map = {
        vertical: {
            count: 0,
            valid: [true, true],
            blocks: [i]
        },
        horizontal: {
            count: 0,
            valid: [true, true],
            blocks: [i]
        },
        diagonal: {
            count: 0,
            valid: [true, true],
            blocks: [i]
        },
        invDiagonal: {
            count: 0,
            valid: [true, true],
            blocks: [i]
        }
    };

    let row = currentLocation.row, col = currentLocation.col;
    for (let j = 1; j < WINNING_SIZE; j++) {
        // find index of neighbors
        let north = (row - j > 0) ? calculateIndex(row - j, col, size) : undefined;
        let south = (row + j < size) ? calculateIndex(row + j, col, size) : undefined;
        let east = (col + j < size) ? calculateIndex(row, col + j, size) : undefined;
        let west = (col - j > 0) ? calculateIndex(row, col - j, size) : undefined;
        let northeast = (row - j > 0 && col + j < size) ? calculateIndex(row - j, col + j, size) : undefined;
        let southwest = (row + j < size && col - j > 0) ? calculateIndex(row + j, col - j, size) : undefined;
        let northwest = (row - j > 0 && col - j > 0) ? calculateIndex(row - j, col - j, size) : undefined;
        let southeast = (row + j < size && col + j < size) ? calculateIndex(row + j, col + j, size) : undefined;

        registerCountOnDirection(north, south, i, squares, map.vertical);
        registerCountOnDirection(east, west, i, squares, map.horizontal);
        registerCountOnDirection(northeast, southwest, i, squares, map.invDiagonal);
        registerCountOnDirection(northwest, southeast, i, squares, map.diagonal);
    }

    let result = {};
    for (let key in map) {
        if (map[key].count === WINNING_SIZE - 1) {
            result.winner = squares[i];
            result.blocks = map[key].blocks;
            break;
        }
    }

    if (result.winner) {
        return result;
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

function registerCountOnDirection(direction1, direction2, curr, squares, register) {
    // console.log(direction1Val, direction2Val, currVal, type, register.valid[0], register.valid[1]);
    if (squares[curr] && squares[direction1] && (squares[direction1] === squares[curr]) && register.valid[0]) {
        register.count++;
        register.blocks.push(direction1);
    } else {
        register.valid[0] = false;
    }
    if (squares[curr] && squares[direction2] && (squares[direction2] === squares[curr]) && register.valid[1]) {
        register.count++;
        register.blocks.push(direction2);
    } else {
        register.valid[1] = false;
    }
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

function calculateIndex(row, col, size, startWith = 0) {
    return startWith + (row - 1) * size + (col - 1);
}


ReactDOM.render(
    <Game/>,
    document.getElementById('root')
);