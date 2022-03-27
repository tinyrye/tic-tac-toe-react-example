import React from 'react';
import some from 'core-js-pure';

class Square extends React.Component {
	constructor(props) {
		super(props);
		this.position = props.position;
		this.board = props.board;
	}
	placeToken() {
		if (this.board.isPlayOpenOn(this.position)) {
			this.board.playOn(this.position);
		}
	}
    render() {
        return (
            <button className={this.props.highlight ? "highlight square" : "square"} onClick={() => this.placeToken()}>{this.props.value ? this.props.value : this.position}</button>
        );
    }
}

class GameBoard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			gameState: props.gameState,
		};
	}

	isPlayOpenOn(position) {
		return this.state.gameState.isPlayOpenOn(position);
	}
	isPlayOpen() {
		return this.state.gameState.isPlayOpen();
	}
	playOn(position) {
		if (!this.isPlayOpen()) {
			return null;
		} else {
			const play = {played: false, player: null};
			if (this.isPlayOpenOn(position)) {
				play.player = this.state.gameState.tallyOn(position);
				play.played = true;
			}
			this.setState(this.state);
			return play;
		}
	}

	statusLine(chickenDinner) {
		if (chickenDinner != null) {
			return `${chickenDinner.player} is the Winner with the line, ${chickenDinner.winLine}!`;
		} else {
			if (this.state.gameState.isPlayOpen()) {
				return `${this.state.gameState.activeState.player}'s Turn`;
			} else {
				return `The Real Winner was the Moves we had all along.`
			}
		}
	}
	formatPositionCoordinates(squarePosition) {
		const row = Math.floor((squarePosition - 1) / 3) + 1;
		const column = (squarePosition - 1) % 3 + 1;
		return `(${row}, ${column})`;
	}
	renderSquaresRow(rowNumber, chickenDinner) {
		// console.log(`renderSquaresRow(${rowNumber})`);
		return (
			<div className="board-row">
				{this.renderSquare(rowNumber, 1, chickenDinner)}
				{this.renderSquare(rowNumber, 2, chickenDinner)}
				{this.renderSquare(rowNumber, 3, chickenDinner)}
			</div>
		);
	}
	renderSquare(rowNumber, columnNumber, chickenDinner) {
		const position = (rowNumber - 1) * 3 + columnNumber;
		const isWinnerSquare = chickenDinner?.winLine?.some((winPoint) => position - 1 == winPoint);
		// console.log(`renderSquare(${rowNumber}, ${columnNumber}, ${JSON.stringify(chickenDinner)}) = ${isWinnerSquare}`)
		return (
			<Square board={this} position={position} value={this.state.gameState.placedValueAt(position)} highlight={isWinnerSquare}/>
		);
	}
	showGameAt(snapshotIndex) {
		this.setState({
			gameState: snapshotIndex >= 0 ? this.state.gameState.restoreTo(snapshotIndex) : new GameState(),
		});
	}
	renderResetToBeginning() {
		return (
			<li key="-1"><button onClick={() => this.showGameAt(-1)}>Reset to Beginning</button></li>
		);
	}
	renderMoveSnapshot(snapshot, moveOrder) {
		return (
			<li key={moveOrder}>{snapshot.move.playedPlayer} placed on {this.formatPositionCoordinates(snapshot.move.squarePosition)} <button onClick={() => this.showGameAt(moveOrder)}>restore</button></li>
		);
	}
	render() {
		const chickenDinner = this.state.gameState.winnerWinner();
		return (
			<div className="game">
				<div className="game-board">
					{Array.from({length: 3}, (_, idx) => idx + 1).map((rowNum) => this.renderSquaresRow(rowNum, chickenDinner))}
				</div>
				<div className="game-info">
					<div className="status">{this.statusLine(chickenDinner)}</div>
					<ol>
						{this.renderResetToBeginning()}
						{this.state.gameState.moveSnapshots.map((move, moveOrder) => this.renderMoveSnapshot(move, moveOrder))}
					</ol>
				</div>
			</div>
		);
	}
}

class GameState {
	constructor(props) {
		this.activeState = props?.activeState ? props?.activeState : {
			player: 'X',
			squarePlacements: Array(9).fill({placed: false}),
		};
		this.snapshotIndex = props?.snapshotIndex ? props?.snapshotIndex : 0;
		this.moveSnapshots = props?.moveSnapshots ? props?.moveSnapshots : [];
	}

	winLines = {
		0: [[0, 1, 2], [0, 3, 6], [0, 4, 8]],
		1: [[1, 4, 7]],
		2: [[2, 5, 8], [2, 4, 6]],
		3: [[3, 4, 5]],
		6: [[6, 7, 8]],
	};

	placedValueAt(position) {
		return this.activeState.squarePlacements[position - 1].player;
	}

	isPlayOpenOn(position) {
		// console.log(`isPlayOpenOn(${position}): placement=${JSON.stringify(this.activeState.squarePlacements[position - 1])}`);
		return !this.activeState.squarePlacements[position - 1].placed;
	}
	isPlayOpen() {
		return this.activeState.squarePlacements.some((plc) => !plc.placed);
	}
	winnerWinner() {
		const winLinesCheck = this.activeState.squarePlacements.map((plc, idx) => {
			return this.winLines[idx]?.find((winLine) => this.isLinePlacedBySinglePlayer(winLine));
		});
		const winLine = winLinesCheck.find((wl) => wl != null);
		if (winLine != null) {
			return {
				winLine: winLine,
				player: this.activeState.squarePlacements[winLine[0]].player,
			};
		} else {
			return null;
		}
	}
	isLinePlacedBySinglePlayer(winLineIndices) {
		const lineSquares = winLineIndices.map((winLineIndex) => this.activeState.squarePlacements[winLineIndex]);
		// console.log(`isLinePlacedBySinglePlayer: lineSquares(${winLineIndices})=${JSON.stringify(lineSquares)}`)
		return (
			lineSquares.every((sq) => sq.placed)
			&& ((lineSquares[0].player == lineSquares[1].player) && (lineSquares[1].player == lineSquares[2].player))
		);
	}

	restoreTo(snapshotIndex) {
		return new GameState({
			activeState: this.moveSnapshots[snapshotIndex].activeState,
			snapshotIndex: snapshotIndex,
			moveSnapshots: this.moveSnapshots.slice(0, snapshotIndex + 1),
		});
	}

	tallyOn(position) {
		const playedPlayer = this.activeState.player;
		const squarePlacement = {};
		squarePlacement.placed = true;
		squarePlacement.player = playedPlayer;
		this.activeState.squarePlacements[position - 1] = squarePlacement;
		this.snapshotIndex++;
		this.switchPlayer();
		this.moveSnapshots = this.moveSnapshots.slice(0, this.snapshotIndex).concat({
			activeState: {
				player: this.activeState.player,
				squarePlacements: this.activeState.squarePlacements.slice(),
			},
			move: {
				squarePosition: position,
				playedPlayer: playedPlayer,
			}
		});
		return playedPlayer;
	}
	switchPlayer() {
		if (this.activeState.player == 'X') {
			this.activeState.player = 'O';
		} else {
			this.activeState.player = 'X';
		}
	}
}

class TheGame extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			gameState: new GameState(),
		};
	}
	resetTally() {
		this.state.gameState = new GameState();
	}
	render() {
		return (
			<GameBoard gameState={this.state.gameState}/>
		);
	}
}

export default TheGame;
