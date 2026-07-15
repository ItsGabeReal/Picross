let tileRows = 10;
let tileColumns = 10;
let tiles;
let rowNumbers;
let columnNumbers;
let rowNumberDivs;
let columnNumberDivs;
let initialGrid;
let boardContainer;
let hoveredTile;
let lastHovered; // This is only useful for when the mouse leaves the screen while we're drag selecting
let selectingTiles = false;
let firstSelected; // The starting point when drag selecting
let selectedTiles = []; // All tiles currently selected by drag selecting
let selectionGuess; // Used to keep track of what our guess is when drag selecting
let seed = Date.now(); // seed 36 in a 10x10 is useful for wildcard testing
let visualizeSolution = false;

// For some stupid reason you aren't outright told what button has just been pressed. You're told which buttons are being pressed
let buttonsBeingPressed = { left: false, right: false, middle: false };

// We only want to check a row / column if it needs to be checked (either in the beginning or if one if their tiles are updated)
let rowNeedsChecking;
let columnNeedsChecking;


// -------------------- FUNCTIONAL --------------------
function onLoad() {
    boardContainer = document.getElementById('boardContainer');

    document.getElementById('board-rows-input').value = tileRows;
    document.getElementById('board-columns-input').value = tileColumns;
    // document.getElementById('seed-input').value = seed;

    NewGame();
}

function mousePressed(event) {
    let buttonsPressed = DecodeButtonPressedEvent(event);

    if (hoveredTile != null && !selectingTiles) {

        if (buttonsPressed.left) {
            selectionGuess = true;
        }
        else if (buttonsPressed.right) {
            selectionGuess = false;
        }
        else {
            return;
        }

        selectingTiles = true;
        firstSelected = hoveredTile;
        hoveredTile.SetSelected(true);
        selectedTiles = [hoveredTile];
    }
}

function mouseReleased(event) {
    let buttonsReleased = DecodeButtonReleasedEvent(event);

    if (selectingTiles && ((selectionGuess == true && buttonsReleased.left) || (selectionGuess == false && buttonsReleased.right))) {
        ApplySelection();
    }
}

// If the cursor leaves the window, reset mouse buttons and apply selection
function mouseLeave(event) {
    buttonsBeingPressed = {
        left: false,
        right: false,
        middle: false
    };

    if (selectingTiles) {
        ApplySelection();
    }
}

// Applies guess to selected tiles
function ApplySelection() {
    selectingTiles = false;

    selectedTiles.forEach((tile) => {
        tile.SetSelected(false);
        tile.GuessTile(selectionGuess);
    });

    selectedTiles = [];

}

// Convert button code into button object
function GetButtonStates(ButtonNumber) {
    return {
        left: ButtonNumber == 1 || ButtonNumber == 3 || ButtonNumber == 5 || ButtonNumber == 7,
        right: ButtonNumber == 2 || ButtonNumber == 3 || ButtonNumber == 6 || ButtonNumber == 7,
        middle: middleButton = ButtonNumber == 4 || ButtonNumber == 5 || ButtonNumber == 6 || ButtonNumber == 7
    };
}

// Returns an object with the buttons that have just been pressed
function DecodeButtonPressedEvent(Event) {
    let newStates = GetButtonStates(Event.buttons);

    let output = {
        left: newStates.left && newStates.left != buttonsBeingPressed.left,
        right: newStates.right && newStates.right != buttonsBeingPressed.right,
        middle: newStates.middle && newStates.middle != buttonsBeingPressed.middle
    }

    buttonsBeingPressed = newStates;

    return output;
}

// Returns an object with the buttons that have just been released
function DecodeButtonReleasedEvent(Event) {
    let newStates = GetButtonStates(Event.buttons);

    let output = {
        left: !newStates.left && newStates.left != buttonsBeingPressed.left,
        right: !newStates.right && newStates.right != buttonsBeingPressed.right,
        middle: !newStates.middle && newStates.middle != buttonsBeingPressed.middle
    }

    buttonsBeingPressed = newStates;

    return output;
}

// Shuffles an array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

function OnNewGameButtonClicked() {
    tileRows = parseInt(document.getElementById('board-rows-input').value);
    tileColumns = parseInt(document.getElementById('board-columns-input').value);

    // let seedInput = parseInt(document.getElementById('seed-input').value);
    // if (isNaN(seedInput))
    //     seed = 0;
    // else
    //     seed = seedInput;


    seed = Date.now();
    NewGame();
}


// -------------------- TILES --------------------
function Tile(Div, Row, Column) {
    this.correctState = false;
    this.guessed = false;
    this.correctlyGuessed = false;
    this.row = Row;
    this.column = Column;
    this.selected = false;

    // A wildcard is a tile with multiple solutions
    this.isWildcard = false;

    this.div = Div;
    Div.onmouseover = this.OnMouseOver.bind(this);
    Div.onmouseout = this.OnMouseLeave.bind(this);
    Div.classList.add('tile');
}
Tile.prototype.SetState = function (State) {
    if (this.isWildcard) {
        this.div.classList.remove('tile_unguessed_wildcard');
    }

    switch (State) {
        case 1:
            this.correctState = true;
            this.isWildcard = false;

            // debugging
            if (visualizeSolution) {
                this.div.classList.add('tile_unguessed_filled');
                this.div.classList.remove('tile_unguessed_empty');
            }

            break;

        case 0:
            this.correctState = false;
            this.isWildcard = false;

            // debugging
            if (visualizeSolution) {
                this.div.classList.add('tile_unguessed_empty');
                this.div.classList.remove('tile_unguessed_filled');
            }

            break;

        case -1:
            this.isWildcard = true;

            // debugging
            if (visualizeSolution) {
                this.div.classList.add('tile_unguessed_wildcard');
            }

            break;
    }
}
Tile.prototype.GuessTile = function (Guess) {
    if (this.guessed) {
        return;
    }

    // Wildcard stuff
    if (this.isWildcard) {
        this.SetState(Guess == true ? 1 : 0);
        OnWildcardGuessed(this);
    }

    // Update tile state
    this.guessed = true;
    this.correctlyGuessed = Guess == this.correctState;

    // Update the visuals
    this.div.classList.remove('tile_hover');
    this.div.classList.add(this.correctState ? 'tile_filled' : 'tile_empty');
    if (!this.correctlyGuessed) {
        let faliureMark = document.createElement('div');
        faliureMark.classList.add('faliure_mark');
        this.div.appendChild(faliureMark);
    }

    // Update the line number visuals
    UpdateRowNumberVisuals(this.row);
    UpdateColumnNumberVisuals(this.column);
}
Tile.prototype.OnMouseOver = function () {
    changeHoveredTile(this);
    if (!this.guessed) {
        this.div.classList.add('tile_hover');
    }
}
Tile.prototype.OnMouseLeave = function () {
    if (hoveredTile == this) {
        hoveredTile = null;
    }
    if (!this.guessed) {
        this.div.classList.remove('tile_hover');
    }
}
Tile.prototype.SetSelected = function (Selected) {
    if (this.guessed) {
        return;
    }

    if (Selected && !this.selected) {
        this.selected = true;
        this.div.classList.add(selectionGuess ? 'tile_selected_filled' : 'tile_selected_empty');
    }
    else if (!Selected && this.selected) {
        this.selected = false;
        this.div.classList.remove(selectionGuess ? 'tile_selected_filled' : 'tile_selected_empty');
    }
}

function changeHoveredTile(NewHoveredTile) {
    lastHovered = hoveredTile;
    hoveredTile = NewHoveredTile;

    if (selectingTiles && NewHoveredTile != null) {
        let rowOffset = NewHoveredTile.row - firstSelected.row; // How how many rows between the first selcted tile and the new hovered tile
        let columnOffset = NewHoveredTile.column - firstSelected.column; // How how many columns between the first selcted tile and the new hovered tile

        let newSelectionList = [];

        // We're selecting along a row
        if (Math.abs(rowOffset) > Math.abs(columnOffset)) {
            let rowStart = rowOffset < 0 ? NewHoveredTile.row : firstSelected.row;
            let rowEnd = rowOffset < 0 ? firstSelected.row : NewHoveredTile.row;
            for (let i = rowStart; i < rowEnd + 1; i++) {
                newSelectionList.push(GetTile(i, firstSelected.column));
            }
        }
        // We're selecting along a column
        else {
            let columnStart = columnOffset < 0 ? NewHoveredTile.column : firstSelected.column;
            let columnEnd = columnOffset < 0 ? firstSelected.column : NewHoveredTile.column;

            for (let i = columnStart; i < columnEnd + 1; i++) {
                newSelectionList.push(GetTile(firstSelected.row, i));
            }
        }

        for (let i = 0; i < newSelectionList.length; i++) {
            // Check if this tile is already selected
            let tileAlreadySelected = false;
            for (let j = 0; j < selectedTiles.length; j++) {
                if (newSelectionList[i] == selectedTiles[j]) {
                    tileAlreadySelected = true;
                    break;
                }
            }

            if (!tileAlreadySelected) {
                selectedTiles.push(newSelectionList[i]);
                newSelectionList[i].SetSelected(true);
            }
        }

        // Deleselect tiles that are no longer bein' selected
        for (let i = 0; i < selectedTiles.length; i++) {
            if (newSelectionList.indexOf(selectedTiles[i]) == -1) {
                selectedTiles[i].SetSelected(false);
                selectedTiles.splice(i, 1);
                i--;
            }
        }

        selectedTiles = newSelectionList;
    }
}

function GetTile(Row, Col) {
    if (Row < 0 || Row >= tileRows || Col < 0 || Col >= tileColumns) {
        return null;
    }
    else {
        return tiles[Row * tileColumns + Col];
    }
}

function GetLineNumbers(LineTiles) {
    let numbers = [];
    let groupStart;
    let countingGroup = false;
    for (let i = 0; i < LineTiles.length; i++) {
        if (!countingGroup && LineTiles[i] == 1) {
            countingGroup = true;
            groupStart = i;
        }
        else if (countingGroup && LineTiles[i] != 1) {
            countingGroup = false;
            numbers.push(i - groupStart);
        }
    }

    // If it was still counting a group when the loop ended then add it to the output
    if (countingGroup) {
        numbers.push(LineTiles.length - groupStart);
    }

    return numbers;
}

function GetLine(Grid, Type, Index) { // Type is either [row] or [column]
    let outputLine = [];
    if (Type == 'row') {
        for (let col = 0; col < tileColumns; col++) {
            outputLine.push(Grid[Index * tileColumns + col]);
        }
    }
    else if (Type == 'column') {
        for (let row = 0; row < tileRows; row++) {
            outputLine.push(Grid[row * tileColumns + Index]);
        }
    }

    return outputLine;
}

function GetQueueElementIndex(Queue, Type, Index) { // Takes the type ('row' or 'column') and it's index and returns where in the queue array it is
    for (let i = 0; i < Queue.length; i++) {
        if (Queue[i].type == Type && Queue[i].index == Index) {
            return i;
        }
    }
}

function SolveGrid(InputGrid, RowNumbers, ColumnNumbers) {
    let width = ColumnNumbers.length;
    let height = RowNumbers.length;
    let solvedGrid = [...InputGrid]; // Store a copy if InputGrid in solvedGrid

    /* Instead of calculating every row, then every column and reapeating until the board is solved, calculate the lines in order of how high their number clues are (eg: '5 4' would be processed before '1 2')
    * Type: [row || column] - Is this a row or a column
    * Index: int - Which row or column is this
    * Value: int - The sum of the line numbers plus 1 for each space (eg: 1_1_2 = 6)
    * PossiblePerms: int[][] - A list of every possible permutation which gets generated at the beginning of the solving process
    * UpdatedTiles: int[] - A list if tile indexes for any tile that was updated since this line was last processed
    */
    let queue = [];

    // Fill the queue with row and column data
    for (let row = 0; row < height; row++) {
        let queuePriority = 0;
        for (let num = 0; num < RowNumbers[row].length; num++) {
            if (num > 0) { queuePriority += 0.5 } // Count each space as a half point

            queuePriority += RowNumbers[row][num];
        }

        queue.push({
            type: 'row',
            index: row,
            value: queuePriority
        });
    }
    for (let col = 0; col < width; col++) {
        let queuePriority = 0;
        for (let num = 0; num < ColumnNumbers[col].length; num++) {
            if (num > 0) { queuePriority += 0.5 } // Count each space as a half point

            queuePriority += ColumnNumbers[col][num];
        }

        queue.push({
            type: 'column',
            index: col,
            value: queuePriority
        });
    }

    shuffle(queue); // Rows and columns can still be bunched up a bit after sorting which isn't as efficient, so this breaks them up a bit

    queue.sort((a, b) => { return b.value - a.value; }); // Sort queue so that lines with the most clues are processed first

    let updatesMade;
    do {
        updatesMade = false;

        for (let i = 0; i < queue.length; i++) {
            let lineNeedsChecking = queue[i].type == 'row' ? rowNeedsChecking[queue[i].index] : columnNeedsChecking[queue[i].index];
            if (lineNeedsChecking) {
                let line = GetLine(solvedGrid, queue[i].type, queue[i].index); // Assemble line
                let lineNumbers = queue[i].type == 'row' ? RowNumbers[queue[i].index] : ColumnNumbers[queue[i].index]; // Get the line numbers

                let updatedLine = CalculateLine(line, lineNumbers); // Solve line

                if (updatedLine == null) { return null; } // Line doesn't have a solution. The input grid is invalid

                // Update solved grid
                if (queue[i].type == 'row') { // This is a row
                    for (let col = 0; col < updatedLine.length; col++) {
                        let gridIndex = queue[i].index * width + col;
                        if (solvedGrid[gridIndex] != updatedLine[col]) { // Check if this is new information
                            solvedGrid[gridIndex] = updatedLine[col];
                            columnNeedsChecking[col] = true; // Mark column to be updated
                            updatesMade = true; // Continue the loop
                        }
                    }
                    rowNeedsChecking[queue[i].index] = false;
                }
                else { // This is a column
                    for (let row = 0; row < updatedLine.length; row++) {
                        let gridIndex = row * width + queue[i].index;
                        if (solvedGrid[gridIndex] != updatedLine[row]) { // Check if this is new information
                            solvedGrid[gridIndex] = updatedLine[row];
                            rowNeedsChecking[row] = true; // Mark row to be updated
                            updatesMade = true; // Continue the loop
                        }
                    }
                    columnNeedsChecking[queue[i].index] = false;
                }
            }
        }
    } while (updatesMade == true);

    return solvedGrid;
}

function CalculateLine(LineTiles, LineNumbers) {
    /*
     * Okay, here's how the line algorithm works so pay attention (there will be
     * a quiz):
     *    - We recursively check every possible line permutation.
     *    - If a permutation has the same line numbers (clues) we were provided
     *      then the results are stored in lineData.
     *    - After all permutations have been completed, check lineData to see if
     *      any tiles are only filled or only empty and use that to update the
     *      actual tile states.
     */

    // This is treated like a pointer so that we can round up all of the data from all of the CheckTiles
    let lineData = [];

    // Note: I'm using this stupid for-loop instead of lineData.fill( object ) because the latter fills the array with the SAME object, meaning if you updated one the entire array mirrored the change
    for (let i = 0; i < LineTiles.length; i++) {
        lineData.push({
            anyFilled: false,
            anyEmpty: false
        });
    }

    let requiredSpace = 0; // Saves calculation time instead of re-calculating it during every CheckTile itteration
    for (let i = 0; i < LineNumbers.length; i++) {
        if (i > 0) { requiredSpace++; } // Add 1 for each space between numbers
        requiredSpace += LineNumbers[i];
    }
    // Start the permutation at the beginning (index 0) and provide an empty array to store data as it works it's way down the tree
    // and provide the line data thing to store the results into when it finds a successful permutation
    CheckTile(LineTiles, LineNumbers, 0, new Array(LineTiles.length), lineData, 0, requiredSpace);

    let solvedLine = [];

    // Now proccess the data we've collected and return the updated line
    for (let i = 0; i < lineData.length; i++) {
        if (LineTiles[i] == -1) {
            if (lineData[i].anyFilled == true && lineData[i].anyEmpty == false) { // Definitely filled
                solvedLine.push(1);
            }
            else if (lineData[i].anyFilled == false && lineData[i].anyEmpty == true) { // Definitely empty
                solvedLine.push(0);
            }
            else if (lineData[i].anyFilled == true && lineData[i].anyEmpty == true) { // Could be empty or filled
                solvedLine.push(-1);
            }
            else { // Tile doesn't have a valid solution (usually because we selected a wildcard that shouldn't have been a wildcard in the first palce)
                console.log('Error: Found a tile without a correct solution');
                console.log('Line data \\/');
                console.log(lineData);
                return null;
            }
        }
        else {
            solvedLine.push(LineTiles[i]);
        }
    }

    return solvedLine;
}

/*
 * ----- NECESARY DATA -----
 * LineTiles: bool[] - The input line which main already contain difinite states
 * LineNumbers: int[] - The clues used to solve the line
 * Index: int - The current tile in the permutation
 * CurrentPermutation: bool[] - The values that tiles higher up the permutation tree are testing
 * LineData: { tiles[ {anyFilled, anyEmpty} ], possiblePerms[ [], [], ... ] } - Update the values in here if we find a permutation that is valid
 * ----- OPTOMIZATION -----
 * GroupsCounted: int - The number of groups that have already been counted
 * RequiredSpace: int - The amount of space we have to take up to create a valid permutation
 */
let lineData = [];
function CheckTile(LineTiles, LineNumbers, Index, CurrentPermutation, LineData, GroupsCounted, RequiredSpace) {
    const endOfValidPermutation = Index === LineTiles.length; // It's valid because we wouldn't reach this point if it wasn't valid.

    // Special case: No line numbers
    if (LineNumbers.length === 0) {
        for (let i = 0; i < LineTiles.length; i++) {
            LineData[i].anyFilled = false;
            LineData[i].anyEmpty = true;
        }
        return;
    }

    if (endOfValidPermutation) {
        for (let i = 0; i < LineTiles.length; i++) {
            if (CurrentPermutation[i] == 1) {
                LineData[i].anyFilled = true;
            }
            else {
                LineData[i].anyEmpty = true;
            }
        }
        return;
    }

    // Try to guess false
    const availableSpace = LineTiles.length - Index;
    const enoughSpaceToTestFalse = availableSpace > RequiredSpace;

    if (enoughSpaceToTestFalse) {
        const tileAlreadyTrue = LineTiles[Index] === 1;

        if (!tileAlreadyTrue) {
            CurrentPermutation[Index] = 0;
            CheckTile(LineTiles, LineNumbers, Index + 1, CurrentPermutation, LineData, GroupsCounted, RequiredSpace);
        }
    }

    // Try to guess true
    const groupIndex = GroupsCounted;
    const groupSize = LineNumbers[groupIndex];
    const endOfGroupIndex = Index + groupSize;

    for (let i = Index; i < endOfGroupIndex; i++) {
        const tileAlreadyFalse = LineTiles[i] === 0;
        if (tileAlreadyFalse) return; // This is a conflict that makes this permutation invalid.

        CurrentPermutation[i] = 1;
    }

    const atLeastOneTileAfterGroup = endOfGroupIndex < LineTiles.length;
    if (atLeastOneTileAfterGroup) {
        const isFinalGroup = GroupsCounted + 1 === LineNumbers.length;

        if (isFinalGroup) {
            // Set the rest false
            for (let i = endOfGroupIndex; i < LineTiles.length; i++) {
                const tileAlreadyTrue = LineTiles[i] === 1;
                if (tileAlreadyTrue) return; // This is a conflict that makes this permutation invalid.

                CurrentPermutation[i] = 0;
            }

            CheckTile(LineTiles, LineNumbers, LineTiles.length, CurrentPermutation, LineData, GroupsCounted + 1, RequiredSpace - groupSize);
        }
        else {
            const tileAfterGroupAlreadyTrue = LineTiles[endOfGroupIndex] === 1;
            if (tileAfterGroupAlreadyTrue) return; // This is a conflict that makes this permutation invalid.

            CurrentPermutation[endOfGroupIndex] = 0;

            const tilesChanged = groupSize + 1;
            CheckTile(LineTiles, LineNumbers, endOfGroupIndex + 1, CurrentPermutation, LineData, GroupsCounted + 1, RequiredSpace - tilesChanged);
        }
    }
    else {
        CheckTile(LineTiles, LineNumbers, endOfGroupIndex, CurrentPermutation, LineData, GroupsCounted + 1, RequiredSpace - groupSize);
    }
}

function ArrayEqual(Array1, Array2) {
    if (Array1.length != Array2.length) {
        return false;
    }

    for (let i = 0; i < Array1.length; i++) {
        if (Array1[i] != Array2[i]) {
            return false;
        }
    }

    return true;
}

// Solves the grid with the updated wildcard guess. If the solve fails, the wildcard guess is flipped. If that fails, an impossible move was made previously.
function OnWildcardGuessed(GuessedWildcard) {
    let grid = GetGridArray();

    rowNeedsChecking[GuessedWildcard.row] = true;
    columnNeedsChecking[GuessedWildcard.column] = true;

    let solvedGrid = SolveGrid(grid, rowNumbers, columnNumbers);

    // Sometimes the solver can't detect a valid scenario so if the grid is invalid after a wildcard is selected, that means the wildcard's state should be reversed
    if (solvedGrid == null) {

        // Reverse the wildcard's state
        GuessedWildcard.SetState(GuessedWildcard.correctState == 1 ? 0 : 1);
        grid[GuessedWildcard.row * tileColumns + GuessedWildcard.column] = GuessedWildcard.correctState == 1 ? 1 : 0;

        // Reset rowNeedsChecking and columnNeedsChecking
        rowNeedsChecking.fill(false);
        columnNeedsChecking.fill(false);
        rowNeedsChecking[GuessedWildcard.row] = true;
        columnNeedsChecking[GuessedWildcard.column] = true;

        // Re-solve the grid
        solvedGrid = SolveGrid(grid, rowNumbers, columnNumbers);

        if (solvedGrid == null) {
            console.log("TRAGEDY HAS STRUCK! Somewhere down the line, an impossible move has been made and the algorithm didn't notice, which means... GG, we're screwed.");
            return;
        }
        else {
            console.log("Oops, this wasn't supposed to be a wildcard. Don't worry tough, the algorithm's got you covered!");
        }
    }

    // Update the state of existing wildcards
    for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].isWildcard && solvedGrid[i] != -1) {
            tiles[i].SetState(solvedGrid[i]);
        }
    }
}

// Prints grid to console
function PrintGrid(Grid, Rows, Columns) {
    for (let row = 0; row < Rows; row++) {
        let logString = `${row}: |`;
        for (let col = 0; col < Columns; col++) {
            if (col > 0) { logString += ' '; }
            switch (Grid[row * Columns + col]) {
                case 1: logString += '■'; break;
                case 0: logString += '_'; break;
                case -1: logString += '?'; break;
            }

        }
        logString += '|';
        console.log(logString);
    }
}

// Checks the current row and column numbers against the correct row and column numbers to tell if the game is complete
function IsGridSolved(Grid, RowNumbers, ColumnNumbers) {
    let newRowNumbers = [];
    let newColumnNumbers = [];

    // Get row numbers
    for (let row = 0; row < RowNumbers.length; row++) {

        // Assemble a row line
        let line = [];
        for (let col = 0; col < ColumnNumbers.length; col++) {
            line.push(Grid[row * ColumnNumbers.length + col]);
        }

        let numbers = GetLineNumbers(line);
        newRowNumbers.push(numbers);
    }

    // Check if the row numbers match
    for (let i = 0; i < newRowNumbers.length; i++) {
        if (!ArrayEqual(newRowNumbers[i], RowNumbers[i])) {
            return false;
        }
    }

    // Get column numbers
    for (let col = 0; col < ColumnNumbers.length; col++) {

        // Assemble a column line
        let line = [];
        for (let row = 0; row < RowNumbers.length; row++) {
            line.push(Grid[row * ColumnNumbers.length + col]);
        }

        let numbers = GetLineNumbers(line);
        newColumnNumbers.push(numbers);
    }

    // Check if the column numbers match
    for (let i = 0; i < newColumnNumbers.length; i++) {
        if (!ArrayEqual(newColumnNumbers[i], ColumnNumbers[i])) {
            return false;
        }
    }

    // Both row and column numbers match, so the grid is solved
    return true;
}

// Converts the tiles array into an array of 1, 0, or -1 for the tile state
function GetGridArray() {
    // Create grid array
    let grid = [];
    for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].isWildcard) {
            grid.push(-1);
        }
        else {
            grid.push(tiles[i].correctState == true ? 1 : 0);
        }
    }

    return grid;
}

function NewGame() {
    let boardSizeSeedOffset = tileRows * 3 + tileColumns * 5; // This probably isn't necesary but I don't like how the numbers stay similar if you change the board size
    let srng = new SeededRNG(seed + boardSizeSeedOffset);

    /* -------------------- INITIALIZE VARBS -------------------- */
    initialGrid = [];
    tiles = [];
    rowNumbers = [];
    columnNumbers = [];

    /*
    * To compensate for wildcards (tiles with multiple solutions):
    * 1: Randomly generate a grid if tiles
    * 2: Calculate the line nuumbers from the grid
    * 3: Throw away the grid values we just created
    * 4: Calculate every DEFINITE move based on the line numbers
    * 5: Set any tiles that don't have a definite solution as wildcards
    * 
    * Then whenever a wildcard is guessed
    * 1: Set the wildcard's value to whatever the player guesses
    * 2: Re-solve the board
    * 3: If there are conflicts during the solve, invert the guess and try again
    * 4: If there are still conflicts, then one of our previous moves was illegal and the board is broken
    */


    // Generate initial grid and create tiles
    for (let row = 0; row < tileRows; row++) {
        let rowSpace = 0;
        for (let col = 0; col < tileColumns; col++) {

            // Column Padding
            let columnSpace = 0;
            for (let i = row - 1; i >= 0; i--) {
                if (initialGrid[i * tileColumns + col] == 0) {
                    columnSpace++;
                }
                else {
                    break;
                }
            }

            /*
               The probability of a tile being filled depends on how many empty tiles
               are above and to the left of it. This way we can make the grid easier to solve
               and less likely to break when looking for wildcards
            */
            let totalSpace = rowSpace + columnSpace;
            let filledProbability = 1 - 1 / (Math.pow(1.4, totalSpace) + 1);
            let tileState = srng.get() < filledProbability ? 1 : 0;

            // Row Padding
            if (tileState == 1) { rowSpace = 0; }
            else { rowSpace++; }

            initialGrid.push(tileState);
        }
    }


    // Get row numbers
    for (let row = 0; row < tileRows; row++) {

        // Assemble a row line
        let line = [];
        for (let col = 0; col < tileColumns; col++) {
            line.push(initialGrid[row * tileColumns + col]);
        }

        let numbers = GetLineNumbers(line);
        rowNumbers.push(numbers);
    }

    // Get column numbers
    for (let col = 0; col < tileColumns; col++) {

        // Assemble a column line
        let line = [];
        for (let row = 0; row < tileRows; row++) {
            line.push(initialGrid[row * tileColumns + col]);
        }

        let numbers = GetLineNumbers(line);
        columnNumbers.push(numbers);
    }

    // Solve the board
    rowNeedsChecking = Array(rowNumbers.length).fill(true); // Mark all the rows as needing to be checked
    columnNeedsChecking = Array(columnNumbers.length).fill(true); // Mark all the columns as needing to be checked
    let emptyGridArray = Array(rowNumbers.length * columnNumbers.length).fill(-1); // Create an empty grid to store all definite moves
    let solvedGrid = SolveGrid(emptyGridArray, rowNumbers, columnNumbers); // Solve the grid

    // Create all the board's divs and create the tile objects
    CreateBoard();

    // Apply solved grid to our tiles
    for (let i = 0; i < solvedGrid.length; i++) {
        tiles[i].SetState(solvedGrid[i]);
    }
}

function CreateBoard() {
    // Ensure the board container is defined? (I have no clue why this is here)
    if (boardContainer == undefined) {
        console.log('boardContainer undefined');
        console.log(boardContainer);
    }

    // Make sure the board is empty
    while (boardContainer.hasChildNodes()) {
        boardContainer.removeChild(boardContainer.lastChild);
    }

    // Empty number div arrays
    rowNumberDivs = [];
    columnNumberDivs = [];

    // Calculate the tile size based on the percentage of the screen the grid takes up
    const gridScreenPercentage = 60;
    let tileSize = gridScreenPercentage / (tileRows > tileColumns ? tileRows : tileColumns);

    let lineNumberSize = 30 / (tileRows > tileColumns ? tileRows : tileColumns);

    for (let row = 0; row < tileRows + 1; row++) {
        let tr = document.createElement('tr');

        for (let col = 0; col < tileColumns + 1; col++) {
            // Create div
            let div = document.createElement('td');

            // Decide what the div is
            if (row == 0) {
                if (col == 0) {
                    div.id = 'empty-corner';
                }
                else {
                    columnNumberDivs.push(div);
                    div.classList.add('column-numbers');
                    div.style.fontSize = `${lineNumberSize}vmin`;
                }
            }
            else {
                if (col == 0) {
                    rowNumberDivs.push(div);
                    div.classList.add('row-numbers');
                    div.style.fontSize = `${lineNumberSize}vmin`;
                }
                else {
                    div.classList.add('tile');

                    /*if (row % 5 == 0) {
                        div.classList.add('thick-bottom-border');
                    }
                    if (col % 5 == 0) {
                        div.classList.add('thick-right-border');
                    }*/

                    div.style.width = `${tileSize}vmin`;
                    div.style.height = `${tileSize}vmin`;

                    // Create tile object while we're here
                    tiles.push(new Tile(div, row - 1, col - 1));
                }
            }

            // Add div to the board container
            tr.appendChild(div);
        }

        boardContainer.appendChild(tr);
    }

    // Set the line number visuals
    for (let i = 0; i < tileRows; i++) {
        UpdateRowNumberVisuals(i);
    }
    for (let i = 0; i < tileColumns; i++) {
        UpdateColumnNumberVisuals(i);
    }
}

function UpdateRowNumberVisuals(Row) {
    // Cross out discovered groups from the left and right sides
    let leftGroupsDiscovered = 0;
    let rightGroupsDiscovered = 0;

    // Left Groups
    let groupStart;
    let countingGroup = false;
    for (let col = 0; col < tileColumns; col++) {
        let currentTile = tiles[Row * tileColumns + col];
        if (currentTile.guessed) {
            if (!countingGroup && currentTile.correctState == true) {
                countingGroup = true;
                groupStart = col;
            }
            else if (countingGroup && currentTile.correctState == false) {
                countingGroup = false;
                leftGroupsDiscovered++;
            }
        }
        else {
            break;
        }

        if (col == tileColumns - 1 && countingGroup) {
            leftGroupsDiscovered++;
        }
    }

    // Right Groups
    if (leftGroupsDiscovered < rowNumbers[Row].length) {
        countingGroup = false;
        for (let col = tileColumns - 1; col >= 0; col--) {
            let currentTile = tiles[Row * tileColumns + col];
            if (currentTile.guessed) {
                if (!countingGroup && currentTile.correctState == true) {
                    countingGroup = true;
                    groupStart = col;
                }
                else if (countingGroup && currentTile.correctState == false) {
                    countingGroup = false;
                    rightGroupsDiscovered++;
                }
            }
            else {
                break;
            }
        }
    }

    let rowDiv = rowNumberDivs[Row];

    let lineString = '';
    for (let i = 0; i < rowNumbers[Row].length; i++) {
        if (i > 0) {
            lineString += ' ';
        }

        // Determine if this number should be crossed out
        let crossedOut = i + 1 <= leftGroupsDiscovered || i + 1 > rowNumbers[Row].length - rightGroupsDiscovered;

        if (crossedOut) {
            lineString += "<span class=\"crossed-out\">";
        }

        lineString += rowNumbers[Row][i];

        if (crossedOut) {
            lineString += "</span>";
        }
    }
    rowDiv.innerHTML = lineString;
}

function UpdateColumnNumberVisuals(Column) {
    let topGroupsDiscovered = 0;
    let bottomGroupsDiscovered = 0;

    // Top Groups
    let groupStart;
    let countingGroup = false;
    for (let row = 0; row < tileRows; row++) {
        let currentTile = tiles[row * tileColumns + Column];
        if (currentTile.guessed) {
            if (!countingGroup && currentTile.correctState == true) {
                countingGroup = true;
                groupStart = row;
            }
            else if (countingGroup && currentTile.correctState == false) {
                countingGroup = false;
                topGroupsDiscovered++;
            }
        }
        else {
            break;
        }

        if (row == tileRows - 1 && countingGroup) {
            topGroupsDiscovered++;
        }
    }

    // Bottom Groups
    if (topGroupsDiscovered < columnNumbers[Column].length) {
        countingGroup = false;
        for (let row = tileRows - 1; row >= 0; row--) {
            let currentTile = tiles[row * tileColumns + Column];
            if (currentTile.guessed) {
                if (!countingGroup && currentTile.correctState == true) {
                    countingGroup = true;
                    groupStart = row;
                }
                else if (countingGroup && currentTile.correctState == false) {
                    countingGroup = false;
                    bottomGroupsDiscovered++;
                }
            }
            else {
                break;
            }
        }
    }

    let columnDiv = columnNumberDivs[Column];

    let lineString = '';
    for (let i = 0; i < columnNumbers[Column].length; i++) {
        if (i > 0) {
            lineString += '<br>';
        }

        // Determine if this number should be crossed out
        let crossedOut = i + 1 <= topGroupsDiscovered || i + 1 > columnNumbers[Column].length - bottomGroupsDiscovered;

        if (crossedOut) {
            lineString += "<span class=\"crossed-out\">";
        }

        lineString += columnNumbers[Column][i];

        if (crossedOut) {
            lineString += "</span>";
        }
    }
    columnDiv.innerHTML = lineString;
}


// -------------------- SEEDED RNG --------------------
function SeededRNG(Seed) {
    // mulberry32: 32-bit state kept via `| 0` / `>>> 0` so large seeds never
    // hit floating point precision loss the way the old LCG did.
    this.state = Seed | 0;
}
SeededRNG.prototype.get = function () { // Outputs a random number between 0 and 1, then advances the state
    this.state |= 0;
    this.state = (this.state + 0x6D2B79F5) | 0;

    let output = this.state;
    output = Math.imul(output ^ (output >>> 15), output | 1);
    output ^= output + Math.imul(output ^ (output >>> 7), output | 61);
    return ((output ^ (output >>> 14)) >>> 0) / 4294967296;
}
