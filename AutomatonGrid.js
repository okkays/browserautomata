/*
Represents a two-dimensional grid of cells.
The grid can be fed a ruleset, and can update based on that ruleset.
*/

//Initializes a new AutomatonGrid of given width, height and ruleset.
//A null ruleset creates a ruleset where the cells never change.
function AutomatonGrid(width, height, ruleset) {
	this.width = parseInt(width);
	this.height = parseInt(height);
	this.innerArray2D = init_2D_array(width, height, false);
	this.ruleset = (ruleset == null ? new Ruleset(null) : ruleset);
}

//Gets the value at rowIndex, colIndex
//Wraps if necessary to avoid index out of bounds.
AutomatonGrid.prototype.get = function(rowIndex, colIndex) {
	if (rowIndex < 0) {
		rowIndex = this.height + rowIndex;
	}
	if (colIndex < 0) {
		colIndex = this.width + colIndex;
	}
	return this.innerArray2D[rowIndex % this.height][colIndex % this.width];
}

//Toggles the value at rowIndex, colIndex
//Wraps if necessary to avoid index out of bounds.
AutomatonGrid.prototype.toggle = function(rowIndex, colIndex) {
	if (rowIndex < 0) {
		rowIndex = this.height + rowIndex;
	}
	if (colIndex < 0) {
		colIndex = this.width + colIndex;
	}
	this.innerArray2D[rowIndex % this.height][colIndex % this.width] = 
		!this.innerArray2D[rowIndex % this.height][colIndex % this.width];
}

//Advances the automatonGrid to its next state.
//Returns a 2D array of the changes made to the grid in the format:
//[[rowIndex, colIndex], [rowIndex, colIndex], ...]
AutomatonGrid.prototype.tick = function() {
	changes = new Array();
	//Calculate the changes.
	for (var rowIndex = 0; rowIndex < this.height; rowIndex++) {
		for (var colIndex = 0; colIndex < this.width; colIndex++) {
			var value = this.ruleset.evaluate_cell(this, rowIndex, colIndex);
			if (this.get(rowIndex, colIndex) != value) {
				changes.push([rowIndex, colIndex]);
			}
		}
	}
	//Apply the changes.
	for (var changeIndex in changes) {
		this.toggle(changes[changeIndex][0], changes[changeIndex][1]);
	}
	//Return the changes.
	return changes;
}

AutomatonGrid.prototype.setWidth = function(width) {
	width = parseInt(width);
	if (width < this.width) { //We need to truncate rows.
		for (var rowIndex = 0; rowIndex < this.height; rowIndex++) {
			this.innerArray2D[rowIndex] = this.innerArray2D[rowIndex].slice(0, width);
		}
	} else if (width > this.width) { //We need to expand rows.
		for (var rowIndex = 0; rowIndex < this.height; rowIndex++) {
			for (var diffCount = 0; diffCount < width - this.width; diffCount++) {
				this.innerArray2D[rowIndex].push(false); //Default to false.
			}
		}
	}
	this.width = width;
}

AutomatonGrid.prototype.setHeight = function(height) {
	height = parseInt(height);
	if (height < this.height) { //We need to remove rows.
		this.innerArray2D = this.innerArray2D.slice(0, height);
	} else if (height > this.height) { //We need to add more rows.
		for (var diffCount = 0; diffCount < height - this.height; diffCount++) {
			var row = new Array();
			for (var colIndex = 0; colIndex < this.width; colIndex++) {
				row.push(false); //Make a width-size array of false.
			}
			this.innerArray2D.push(row);
		}
	}
	this.height = height;
}

//Considers each cell in the grid for a random toggle.
AutomatonGrid.prototype.scramble = function() {
	for (var rowIndex = 0; rowIndex < this.height; rowIndex++) {
		for (var colIndex = 0; colIndex < this.width; colIndex++) {
			if (Math.floor(Math.random() * 2) == 1) {
				this.toggle(rowIndex, colIndex);
			}
		}
	}
}

//Makes a checkerboard pattern on the grid.
AutomatonGrid.prototype.checker = function() {
	var prev = false;
	for (var rowIndex = 0; rowIndex < this.height; rowIndex++) {
		for (var colIndex = 0; colIndex < this.width; colIndex++) {
			if ((prev && this.get(rowIndex, colIndex)) || (!prev && !this.get(rowIndex, colIndex))) {
				this.toggle(rowIndex, colIndex);
			}
			prev = !prev;
		}
		prev = !prev;
	}
}

AutomatonGrid.prototype.clear = function() {
	for (var rowIndex = 0; rowIndex < this.height; rowIndex++) {
		for (var colIndex = 0; colIndex < this.width; colIndex++) {
			if (this.get(rowIndex, colIndex)) {
				this.toggle(rowIndex, colIndex);
			}
		}
	}
}

//Initialize a new 2D array of width and height with value.
function init_2D_array(width, height, value) {
	retArray = new Array();
	for (var i = 0; i < height; i++) { //Row array contains column cells.
		row = new Array();
		for (var j = 0; j < width; j++) { //Column contains true/false.
			row.push(value);
		}
		retArray.push(row); //Add row to array of rows.
	}
	return retArray;
}