//Contains GUI state information.
var GUIStatus = {
	mouseDown: false,
	settingsOpen: true,
	paused: true,
	pauseInterval: null,
	prevGridWidthInput: "",
	prevGridHeightInput: "",
	prevUpdateRateInput: ""
};

//Contains user-specified information about the grid.
var Settings = {
	updateRate: 0
};

//The data model grids.
var automatonGrid = null;
var ruleMaskGrid = null; //Note: This grid treats "enabled" as off, and "disabled" as on.
var ruleBuildGrid = null;

//WINDOW FUNCTIONS

function init() {
	//Add event listeners
	//General
	document.body.addEventListener("mouseup", cellMouseUp);
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
	document.getElementById("inputGridWidth").addEventListener("input", validateGridWidth);
	document.getElementById("inputGridHeight").addEventListener("input", validateGridHeight);
	document.getElementById("buttonUpdateGridSize").addEventListener("click", resizeMainGrid);
	document.getElementById("buttonCheckerGrid").addEventListener("click", checkerGrid);
	document.getElementById("buttonScrambleGrid").addEventListener("click", scrambleGrid);
	document.getElementById("buttonClearGrid").addEventListener("click", clearGrid);
	document.getElementById("inputUpdateRate").addEventListener("input", validateUpdateRate);
	document.getElementById("buttonUpdateRate").addEventListener("click", updateRate);
	//Settings - Rules
	document.getElementById("buttonFileRuleset").addEventListener("click", readRulesetFromFile);
	document.getElementById("buttonRuleset").addEventListener("click", updateRuleset);
	document.getElementById("buttonFormatString").addEventListener("click", updateFormatString);
	document.getElementById("buttonRandomizeRuleset").addEventListener("click", randomizeRules);
	document.getElementById("ruleControlMinus").addEventListener("click", decrementRuleLength);
	document.getElementById("ruleControlPlus").addEventListener("click", incrementRuleLength);
	//Settings - Advanced
	
	//Populate settings variables from default GUI.
	Settings.updateRate = document.getElementById("inputUpdateRate").value;
	GUIStatus.prevGridHeightInput = document.getElementById("inputGridHeight").value;
	GUIStatus.prevGridWidthInput = document.getElementById("inputGridWidth").value;
	GUIStatus.prevUpdateRateInput =  document.getElementById("inputUpdateRate").value;
	var defaultWidth = document.getElementById("inputGridWidth").value;
	var defaultHeight = document.getElementById("inputGridHeight").value;
	
	//Pause everything
	pauseGrid();
	
	//Set the size of the tab item text
	resizeSettingsText();
	
	//Create the grids
	automatonGrid = new AutomatonGrid(defaultWidth, defaultHeight, null);
	automatonGrid.scramble();
	automatonGrid.ruleset.length = Number(document.getElementById("ruleControlLength").innerHTML);
	ruleMaskGrid = new AutomatonGrid(automatonGrid.ruleset.length, automatonGrid.ruleset.length, null);
	ruleBuildGrid = new AutomatonGrid(automatonGrid.ruleset.length, automatonGrid.ruleset.length, null);
	displayGridFromScratch(automatonGrid, document.getElementById("divAutomatonGrid"), "on", "off");
	displayGridFromScratch(ruleMaskGrid, document.getElementById("divRuleMask"), "disabled", "on");
	displayGridFromScratch(ruleBuildGrid, document.getElementById("divRuleBuild"), "on", "off");
	
	//Create the ruleset and format string.
	automatonGrid.ruleset.formatString = generate_format_string(automatonGrid.ruleset.length);
	randomizeRules();
	updateRulesetTextarea();
	updateRulesetFormatString();
}

function resizeWindow() {
	resizeSettingsText();
}

//Resize all of the variable size settings texts
function resizeSettingsText() {
	resizeElementText("rowTabs");
	resizeElementText("ruleControlMinus");
	resizeElementText("ruleControlLength");
	resizeElementText("ruleControlPlus");
	resizeClassText("ruleHeader");
	resizeClassText("ruleSubheader");
}

//GRID FUNCTIONS

function resizeMainGrid() {
	resizeGrid(document.getElementById("inputGridWidth").value,
				document.getElementById("inputGridHeight").value,
				automatonGrid,
				document.getElementById("divAutomatonGrid"),
				"on",
				"off");
}

function resizeGrid(width, height, grid, root, onClass, offClass) {
	if (width === "") {
		width = 1;
	}
	if (height === "") {
		height = 1;
	}
	grid.setWidth(width);
	grid.setHeight(height);
	displayGridFromScratch(grid, root, onClass, offClass);
}

function updateRate() {
	var inputUpdateRate = document.getElementById("inputUpdateRate");
	if (inputUpdateRate.value == "") {
		inputUpdateRate.value = 0;
	}
	Settings.updateRate = inputUpdateRate.value;
	if (!GUIStatus.paused) {
		clearInterval(GUIStatus.pauseInterval);
		GUIStatus.pauseInterval = setInterval(stepGrid, Settings.updateRate);
	}
}

function playGrid(event) {
	GUIStatus.paused = false;
	document.getElementById("buttonPlay").style.display = "none";
	document.getElementById("buttonPause").style.display = "block";
	GUIStatus.pauseInterval = setInterval(stepGrid, Settings.updateRate);
}

function pauseGrid(event) {
	GUIStatus.paused = true;
	document.getElementById("buttonPause").style.display = "none";
	document.getElementById("buttonPlay").style.display = "block";
	clearInterval(GUIStatus.pauseInterval);
	GUIStatus.pauseInterval = null;
	
}

function stepGrid() {
	displayGridFromChanges(document.getElementById("divAutomatonGrid").firstChild, automatonGrid, automatonGrid.tick(), "on", "off");
}

function checkerGrid() {
	automatonGrid.checker();
	displayGridFromScratch(automatonGrid, document.getElementById("divAutomatonGrid"), "on", "off");
}

function scrambleGrid() {
	automatonGrid.scramble();
	displayGridFromScratch(automatonGrid, document.getElementById("divAutomatonGrid"), "on", "off");
}

function clearGrid() {
	automatonGrid.clear();
	displayGridFromScratch(automatonGrid, document.getElementById("divAutomatonGrid"), "on", "off");
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

function cellClicked(event, grid) {
	var rowIndex = event.target.parentNode.rowIndex;
	var colIndex = event.target.cellIndex;
	//Find our parent table
	var tableClicked = event.target.parentNode;
	while (tableClicked.tagName != "TABLE") {
		tableClicked = tableClicked.parentNode;
	}
	//TODO: Find a better (more generic) way to do this.
	if (tableClicked.parentNode.id == "divAutomatonGrid") {
		mainGridCellClicked(tableClicked, rowIndex, colIndex);
	} else if (tableClicked.parentNode.id == "divRuleMask") {
		ruleMaskCellClicked(tableClicked, rowIndex, colIndex);
	} else if (tableClicked.parentNode.id == "divRuleBuild") {
		ruleBuildCellClicked(tableClicked, rowIndex, colIndex);
	}
}

function mainGridCellClicked(tableClicked, rowIndex, colIndex) {
	automatonGrid.toggle(rowIndex, colIndex);
	displayGridFromChanges(tableClicked, automatonGrid, [[rowIndex, colIndex]], "on", "off");
}

function ruleMaskCellClicked(tableClicked, rowIndex, colIndex) {
	var ruleBuildTable = document.getElementById("divRuleBuild").firstChild;
	//Disable/enable the cell on the rulemask.
	ruleMaskGrid.toggle(rowIndex, colIndex);
	displayGridFromChanges(tableClicked, ruleMaskGrid, [[rowIndex, colIndex]], "disabled", "on");
	if (ruleMaskGrid.get(rowIndex, colIndex)) { //IF DISABLING:
		//Disable the cell on the rule builder table.
		displayGridFromChanges(ruleBuildTable, ruleBuildGrid, [[rowIndex, colIndex]], "disabled", "disabled");
	} else {
		//IF ENABLING:
		//Enable the cell on the rule builder table
		displayGridFromChanges(ruleBuildTable, ruleBuildGrid, [[rowIndex, colIndex]], "on", "off");
	}
	//Set the mask.
	automatonGrid.ruleset.set_mask(ruleMaskGrid);
	updateRulesetTextarea();
}

function ruleBuildCellClicked(tableClicked, rowIndex, colIndex) {
	//Only change anything if the cell isn't disabled.
	if (!ruleMaskGrid.get(rowIndex, colIndex)) {
		ruleBuildGrid.toggle(rowIndex, colIndex);
		displayGridFromChanges(tableClicked, ruleBuildGrid, [[rowIndex, colIndex]], "on", "off");
	}
}

//Clears the displayed grid, and displays the given grid under the specified root element.
function displayGridFromScratch(grid, root, onClass, offClass) {
	//Remove and recreate the table.
	while (root.firstChild) {
		root.removeChild(root.firstChild);
	}
	var table = document.createElement('table');
	table.className = "automatonTable";
	//Create and add new rows/columns.
	for (var rowIndex = 0; rowIndex < grid.height; rowIndex++) {
		var row = table.insertRow(rowIndex);
		for (var colIndex = 0; colIndex < grid.width; colIndex++) {
			var value = grid.get(rowIndex, colIndex);
			var td = row.insertCell(colIndex);
			td.className = (value ? onClass : offClass);
			td.addEventListener("mousedown", cellMouseDown);
			td.addEventListener("mouseover", cellEntered);
		}
	}
	root.appendChild(table);
}

//Updates the given table by checking the given list of cells against the table.
//Changes is formatted: [[rowIndex, colIndex], [rowIndex, colIndex], ...]
function displayGridFromChanges(table, grid, changes, onClass, offClass) {
	for (var changeIndex in changes) {
		var rowIndex = changes[changeIndex][0];
		var colIndex = changes[changeIndex][1];
		var cell = table.rows[rowIndex].cells[colIndex];
		cell.className = (grid.get(rowIndex, colIndex) ? onClass : offClass);
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
		automatonGrid.ruleset = new Ruleset(contents.split("\n"), ruleMaskGrid, null);
		//Update the rule length.
		document.getElementById("ruleControlLength").innerHTML = automatonGrid.ruleset.length;
		resizeRuleGrids();
		updateRulesetTextarea();
		updateRulesetFormatString();
	}
	reader.readAsText(selector.files[0]);
}

//Randomizes the rules.
function randomizeRules() {
	automatonGrid.ruleset = new Ruleset(random_rules(automatonGrid.ruleset.length), ruleMaskGrid, automatonGrid.ruleset.formatString);
	
	//Make sure there's no flashing.
	var length = Object.keys(automatonGrid.ruleset.rules)[0].length;
	var zeroes = '';
	var ones = '';
	for (var i = 0; i < length; i++) {
		zeroes += '0';
		ones += '1';
	}
	automatonGrid.ruleset.rules[zeroes] = automatonGrid.ruleset.rules[ones];
	
	updateRulesetTextarea();
}

function decrementRuleLength() {
	if (automatonGrid.ruleset.length > 1) {
		automatonGrid.ruleset.length -= 2;
		document.getElementById("ruleControlLength").innerHTML = automatonGrid.ruleset.length;
		resizeRuleGrids();
		randomizeRules();
		updateRulesetFormatString();
	}
}

function incrementRuleLength() {
	if (automatonGrid.ruleset.length < 3) {
		automatonGrid.ruleset.length += 2;
		document.getElementById("ruleControlLength").innerHTML = automatonGrid.ruleset.length;
		resizeRuleGrids();
		randomizeRules();
		updateRulesetTextarea();
		updateRulesetFormatString();
	}
}

function resizeRuleGrids() {
	//Resize both grids
	resizeGrid(automatonGrid.ruleset.length, automatonGrid.ruleset.length, ruleMaskGrid, document.getElementById("divRuleMask"), "disabled", "on");
	resizeGrid(automatonGrid.ruleset.length, automatonGrid.ruleset.length, ruleBuildGrid, document.getElementById("divRuleBuild"), "on", "off");
	//Re-disable the cells on the ruleBuildGrid.
	var ruleBuildTable = document.getElementById("divRuleBuild").firstChild;
	var disabledList = new Array();
	for (var rowIndex = 0; rowIndex < ruleMaskGrid.width; rowIndex++) {
		for (var colIndex = 0; colIndex < ruleMaskGrid.height; colIndex++) {
			if (ruleMaskGrid.get(rowIndex, colIndex)) {
				disabledList.push([rowIndex, colIndex]);
			}
		}
	}
	displayGridFromChanges(ruleBuildTable, ruleBuildGrid, disabledList, "disabled", "disabled");
	automatonGrid.ruleset.formatString = generate_format_string(automatonGrid.ruleset.length);
}

function updateRulesetTextarea() {
	if (automatonGrid.ruleset.length < 5) {
		document.getElementById('textareaRuleset').value = automatonGrid.ruleset.to_string();
	} else {
		document.getElementById('textareaRuleset').value = 'Ruleset too large, use an external editor and upload the file.';
	}
}

function updateRulesetFormatString() {
	document.getElementById('textareaFormatString').value = automatonGrid.ruleset.formatString;
}

function updateRuleset() {
	var ruleString = document.getElementById("textareaRuleset").value;
	var formatString = automatonGrid.ruleset.formatString;
	automatonGrid.ruleset = new Ruleset(parse_ruleset(ruleString, formatString), ruleMaskGrid, formatString);
}

function updateFormatString() {
	automatonGrid.ruleset.formatString = document.getElementById('textareaFormatString').value;
	document.getElementById('textareaRuleset').value = automatonGrid.ruleset.to_string();
}

//SETTINGS FUNCTIONS

function toggleSettings(event) {
	//Hide blackout and settings box.
	document.getElementById("wrapperSettings").style.display = GUIStatus.settingsOpen ? "none" : "table";
	document.getElementById("divBlackout").style.display = GUIStatus.settingsOpen ? "none" : "inline";
	GUIStatus.settingsOpen = !GUIStatus.settingsOpen;
	resizeSettingsText();
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
	resizeSettingsText();
}

//Resizes the text of the element with the given ID
function resizeElementText(id) {
	var element = document.getElementById(id);
	if (element.style.display != "none") {
		element.style.fontSize = element.clientHeight - (element.clientHeight / 4);
	}
}

//Resizes the text of the elements in the given class
function resizeClassText(className) {
	var elements = document.getElementsByClassName(className);
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].style.display != "none") {
			elements[i].style.fontSize = elements[i].clientHeight - (elements[i].clientHeight / 4);
		}
	}
}

function validateGridWidth(event) {
	var input = event.target.value;
	if (input === "") {
		return;
	}
	if (isNaN(input)) {
		event.target.value = GUIStatus.prevGridWidthInput;
	} else if (event.target.value < 1) {
		event.target.value = GUIStatus.prevGridWidthInput;
	} else if (event.target.value % 1 !== 0) {
		event.target.value = Math.floor(input);
	}
	GUIStatus.prevGridWidthInput = event.target.value;
}

function validateGridHeight(event) {
	var input = event.target.value;
	if (input === "") {
		return;
	}
	if (isNaN(input)) {
		event.target.value = GUIStatus.prevGridHeightInput;
	} else if (event.target.value < 1) {
		event.target.value = GUIStatus.prevGridHeightInput;
	} else if (event.target.value % 1 !== 0) {
		event.target.value = Math.floor(input);
	}
	GUIStatus.prevGridHeightInput = event.target.value;
}

function validateUpdateRate(event) {
	var input = event.target.value;
	if (input === "") {
		return;
	}
	if (isNaN(input)) {
		event.target.value = GUIStatus.prevUpdateRateInput;
	} else if (event.target.value < 1) {
		event.target.value = GUIStatus.prevUpdateRateInput;
	} else if (event.target.value % 1 !== 0) {
		event.target.value = Math.floor(input);
	}
	GUIStatus.prevUpdateRateInput = event.target.value;
}

window.onload = init;
window.onresize = resizeWindow;