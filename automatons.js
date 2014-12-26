var GUIStatus = {
	mouseDown: false,
	settingsOpen: true,
	paused: true,
	pauseInterval: null
};

var automatonGrid = null;
var mainTable = null;
var rate = 0;
//WINDOW FUNCTIONS

function init() {
	//Add event listeners
	//Tabs
	document.getElementById("tabGrid").addEventListener("click", selectTab);
	document.getElementById("tabRules").addEventListener("click", selectTab);
	document.getElementById("tabAdvanced").addEventListener("click", selectTab);
	document.getElementById("buttonExitSettings").addEventListener("click", toggleSettings);
	//Controls
	document.getElementById("buttonPause").addEventListener("click", pauseGrid);
	document.getElementById("buttonPlay").addEventListener("click", playGrid);
	document.getElementById("buttonStep").addEventListener("click", stepGrid);
	document.getElementById("buttonSettings").addEventListener("click", toggleSettings);
	document.getElementById("buttonClear").addEventListener("click", clearGrid);
	document.getElementById("buttonRandomRules").addEventListener("click", randomizeRules);
	//Settings - Grid
	document.getElementById("inputGridWidth").addEventListener("input", validateGridSize);
	document.getElementById("inputGridHeight").addEventListener("input", validateGridSize);
	document.getElementById("buttonUpdateGridSize").addEventListener("click", resizeGrid);
	document.getElementById("buttonCheckerGrid").addEventListener("click", checkerGrid);
	document.getElementById("buttonScrambleGrid").addEventListener("click", scrambleGrid);
	document.getElementById("buttonClearGrid").addEventListener("click", clearGrid);
	document.getElementById("inputUpdateRate").addEventListener("input", validateUpdateRate);
	document.getElementById("buttonUpdateRate").addEventListener("click", updateRate);
	//Settings - Rules
	document.getElementById("buttonRuleset").addEventListener("click", readRulesetFromFile);
	document.getElementById("buttonRandomizeRuleset").addEventListener("click", randomizeRules);
	
	//Get the update rate
	rate = document.getElementById("inputUpdateRate").value;
	
	//Pause everything
	pauseGrid();
	
	//Set the size of the tab item text
	resizeTabText();
	
	//Create the grid
	var defaultWidth = document.getElementById("inputGridWidth").value;
	var defaultHeight = document.getElementById("inputGridHeight").value;
	automatonGrid = new AutomatonGrid(defaultWidth, defaultHeight, null);
	automatonGrid.scramble();
	displayGridFromScratch(automatonGrid);
}

function resizeWindow() {
	resizeTabText();
}

//GRID FUNCTIONS

function resizeGrid() {
	var inputGridWidth = document.getElementById("inputGridWidth");
	var inputGridHeight = document.getElementById("inputGridHeight");
	if (inputGridWidth.value === "") {
		inputGridWidth.value = 1;
	}
	if (inputGridHeight.value === "") {
		inputGridHeight.value = 1;
	}
	automatonGrid.setWidth(inputGridWidth.value);
	automatonGrid.setHeight(inputGridHeight.value);
	displayGridFromScratch(automatonGrid);
}

function updateRate() {
	var inputUpdateRate = document.getElementById("inputUpdateRate");
	if (inputUpdateRate.value == "") {
		inputUpdateRate.value = 0;
	}
	rate = inputUpdateRate.value;
	if (!GUIStatus.paused) {
		clearInterval(GUIStatus.pauseInterval);
		GUIStatus.pauseInterval = setInterval(stepGrid, rate);
	}
}

function playGrid(event) {
	GUIStatus.paused = false;
	document.getElementById("buttonPlay").style.display = "none";
	document.getElementById("buttonPause").style.display = "block";
	GUIStatus.pauseInterval = setInterval(stepGrid, rate);
}

function pauseGrid(event) {
	GUIStatus.paused = true;
	document.getElementById("buttonPause").style.display = "none";
	document.getElementById("buttonPlay").style.display = "block";
	clearInterval(GUIStatus.pauseInterval);
	GUIStatus.pauseInterval = null;
	
}

function stepGrid() {
	displayGridFromChanges(mainTable, automatonGrid.tick());
}

function checkerGrid() {
	automatonGrid.checker();
	displayGridFromScratch(automatonGrid);
}

function scrambleGrid() {
	automatonGrid.scramble();
	displayGridFromScratch(automatonGrid);
}

function clearGrid() {
	automatonGrid.clear();
	displayGridFromScratch(automatonGrid);
}

function cellMouseDown(event) {
	if (event.button == 0) {
		GUIStatus.draggingClass = event.target.className;
	}
	cellClicked(event);
}

function cellMouseUp() {
	if (event.button == 0) {
		GUIStatus.draggingClass = null;
	}
}

function cellEntered(event) {
	if (GUIStatus.draggingClass === event.target.className) {
		cellClicked(event);
	}
}

function cellClicked(event) {
	var rowIndex = event.target.parentNode.rowIndex;
	var colIndex = event.target.cellIndex;
	automatonGrid.toggle(rowIndex, colIndex);
	displayGridFromChanges(mainTable, [[rowIndex, colIndex]]);
}

//Clears the displayed grid, and displays the given grid.
function displayGridFromScratch(automatonGrid) {
	var root = document.getElementById("divAutomatonGrid");
	//Remove and recreate the table.
	while (root.firstChild) {
		root.removeChild(root.firstChild);
	}
	var table = document.createElement('table');
	table.className = "automatonTable";
	//Create and add new rows/columns.
	for (var rowIndex = 0; rowIndex < automatonGrid.height; rowIndex++) {
		var row = table.insertRow(rowIndex);
		for (var colIndex = 0; colIndex < automatonGrid.width; colIndex++) {
			var value = automatonGrid.get(rowIndex, colIndex);
			var td = row.insertCell(colIndex);
			td.className = (value ? "on" : "off");
			td.addEventListener("mousedown", cellMouseDown);
			td.addEventListener("mouseup", cellMouseUp);
			td.addEventListener("mouseover", cellEntered);
		}
	}
	root.appendChild(table);
	mainTable = table;
}

//Updates the given table by toggling the given list of cells.
//Changes is formatted: [[rowIndex, colIndex], [rowIndex, colIndex], ...]
function displayGridFromChanges(table, changes) {
	for (var changeIndex in changes) {
		var rowIndex = changes[changeIndex][0];
		var colIndex = changes[changeIndex][1];
		var cell = table.rows[rowIndex].cells[colIndex];
		cell.className = (cell.className == "on" ? "off" : "on");
	}
}

//RULESET FUNCTIONS

//Reads in a ruleset from a text file.
function readRulesetFromFile() {
	var selector = document.getElementById("fileRule");
	//Make sure we have one file.
	if (!FileReader || selector.files.length != 1) {
		return;
	}
	//Read the file.
	var reader = new FileReader();
	reader.onload = function(event) {
		var contents = event.target.result;
		automatonGrid.ruleset = new Ruleset(contents.split("\n"));
	}
	reader.readAsText(selector.files[0]);
}

//Randomizes the rules.
function randomizeRules() {
	automatonGrid.ruleset = new Ruleset(random_rules(3));
}

//SETTINGS FUNCTIONS

function toggleSettings(event) {
	//Hide blackout and settings box.
	document.getElementById("wrapperSettings").style.display = GUIStatus.settingsOpen ? "none" : "table";
	document.getElementById("divBlackout").style.display = GUIStatus.settingsOpen ? "none" : "inline";
	GUIStatus.settingsOpen = !GUIStatus.settingsOpen;
	resizeTabText();
}

function selectTab(event) {
	//Select correct tab, deselect others.
	document.getElementById("tabGrid").className = event.target.id == "tabGrid" ? "settingsTabSelected" : "settingsTab";
	document.getElementById("tabRules").className = event.target.id == "tabRules" ? "settingsTabSelected" : "settingsTab";
	document.getElementById("tabAdvanced").className = event.target.id == "tabAdvanced" ? "settingsTabSelected" : "settingsTab";
	//Select correct pane, deselect others.
	document.getElementById("paneGrid").className = event.target.id == "tabGrid" ? "settingsPaneSelected" : "settingsPane";
	document.getElementById("paneRules").className = event.target.id == "tabRules" ? "settingsPaneSelected" : "settingsPane";
	document.getElementById("paneAdvanced").className = event.target.id == "tabAdvanced" ? "settingsPaneSelected" : "settingsPane";
}

function resizeTabText() {
	if (GUIStatus.settingsOpen) {
		var rowTabs = document.getElementById("rowTabs")
		rowTabs.style.fontSize = rowTabs.clientHeight - (rowTabs.clientHeight / 4);
	}
}

function validateGridSize(event) {
	var input = event.target.value;
	if (input === "") {
		return;
	}
	if (isNaN(input)) {
		event.target.value = "";
	} else if (event.target.value < 1) {
		event.target.value = "";
	} else {
		event.target.value = Math.floor(input);
	}
}

function validateUpdateRate(event) {
	var input = event.target.value;
	if (input === "") {
		return;
	}
	if (isNaN(input)) {
		event.target.value = "";
	} else if (event.target.value < 1) {
		event.target.value = "";
	} else {
		event.target.value = Math.floor(input);
	}
}

window.onload = init;
window.onresize = resizeWindow;