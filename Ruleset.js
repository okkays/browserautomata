/*
A rule, based on a center cell and its surroundings, that determines the next
state of that cell.

A ruleset consists of a list of rules.
Each rule is a string of '0's and '1's.
Each rule consists of a list of 'criteria' bits followed by a 'value' bit.
A '0' indicates that the cell is off.
A '1' indicates that the cell is on.
The final bit indicates the next state of the center cell.

The length of each rule, and number of rules, is determined by the
'length' of the ruleset, where:
len(rule) == (length^2) + 1
len(ruleset) == 2^(length^2)

Example rules for a grid with length 3, where B is the next value bit:
000000000B <-Rule 0
000000001B <-Rule 1
000000010B <-Rule 2
000000011B <-Rule 3
...
010011010B <-Rule N
010011011B <-Rule N+1
...
111111111B <-Rule 2^(3^2)

A rule maps to a grid as follows, where C is the center:

Rule: 012345678B

      012
Grid: 3C5
      678

GridX = RuleIndex % length
GridY = floor(RuleIndex / length)

Glossary:
-B, Value bit: The "next value" bit.  What the center cell will change to.
-Criteria bits: All bits except the value bit.
-Static Ruleset: A ruleset where B == center cell
*/

//Takes an array of strings with rules (as above).
//If rules is null, ruleset will be length 1 and static.
//If the formatString is not given or is null, generate_format_string will be called to create it.
function Ruleset(rules, formatString) {
	this.rules = new Object(); //Associative array
	if (rules == null) {
		this.length = 1;
		this.rules["0"] = false;
		this.rules["1"] = true;
	}
	else {
		this.length = Math.sqrt(rules[0].trim().length - 1);
		for (var ruleIndex in rules) {
			//Allow whitespace/empty lines.
			var rule = rules[ruleIndex].trim();
			if (rule.length == 0) {
				continue;
			}
			//Read contents of line.
			var criteria = rule.substr(0, rule.length - 1);
			var value = rule.charAt(rule.length - 1) == "1";
			this.rules[criteria] = value;
		}
	}
	
	//Format String
	this.formatString =
		(typeof formatString === 'undefined' || formatString == null) ?
		generate_format_string(this.length) : formatString;
}

//Returns true/false if the cell at row/colIndex should be on/off in the next iteration.
Ruleset.prototype.evaluate_cell = function(automatonGrid, rowIndex, colIndex) {
	//Read the criteria string, then return the value matching it.
	var value = this.rules[criteria_from_grid(automatonGrid, this.length, rowIndex, colIndex)];
	if (typeof(value) == "undefined") { //Catch missing rules
		return false;
	}
	return value;
}

//Returns a string representation of the ruleset.
//If a format string is given, the digits of each rule will be inserted in the order given.
//A format string consists of the index numbers of each cell enclosed in '{}', with a 'B' for the value bit.
//The characters '{' and '}' are reserved and cannot be used in the format string for any other purpose.
//For example:
//Format string 'Row 3: {9}{8}{7}\nRow 2: {6}{5}{4}\nRow 1: {3}{2}{1}\nValue Bit: {B}' for rule 1001101110 will produce:
//Row 3: 111
//Row 2: 011
//Row 1: 001
//Value Bit: 0
Ruleset.prototype.to_string = function() {
	//Set the formatString if it wasn't passed in.
	retString = '';
	for (var rule in this.rules) {
		if (!this.rules.hasOwnProperty(rule)) {
			continue;
		}
		//Replace the markers of format string with values from the current rule.
		retString += this.formatString.replace(/\{(\d+)\}/g, function(matched) {
			return rule.charAt(Number(matched.replace(/\{|\}/g, '')));
		});
		retString = retString.replace(/\{B\}/, this.rules[rule] ? '1' : '0');
		retString += '\n';
	}
	return retString;
}

//Reads the criteria bits given a grid, ruleset length, and position of the center bit.
//Returns a string of '0's and '1's
function criteria_from_grid(automatonGrid, length, rowIndex, colIndex) {
	var criteriaString = "";
	var range = (length - 1) / 2;
	for (var i = -range; i <= range; i++) {
		var testRowIndex = (rowIndex + i);
		for (var j = -range; j <= range; j++) {
			var testColIndex = (colIndex + j);
			criteriaString += (automatonGrid.get(testRowIndex, testColIndex) ? "1" : "0");
		}
	}
	return criteriaString;
}

//Creates a default formatString of '{1}{2}...{length}{B}'
function generate_format_string(length) {
	var formatString = '';
	for (var i = 0; i < length * length; i++) {
		formatString += '{' + i.toString() + '}';
	}
	formatString += '{B}';
	return formatString;
}

//Creates a list of random rules of given length.
//Returns a string that can be passed to Ruleset constructor.
function random_rules(length) {
	rules = Array();
	for (var i = 0; i < Math.pow(2, (Math.pow(length, 2))); i++) {
		var binaryIndex = i.toString(2);
		var leadingZeroes = (Array((Math.pow(length, 2) + 1) - binaryIndex.length).join("0"));
		var criteria =  leadingZeroes + binaryIndex;
		rules.push(criteria + (Math.floor(Math.random() * 2) == 1 ? "1" : "0"));
	}
	return rules;
}

//Creates a ruleset from a single string of rules and their corresponding format string.
//Returns a string that can be passed to Ruleset constructor.
function parse_ruleset(rulesetString, formatString) {
	ruleLength = formatString.replace(/\{(\d+|B)\}/g, 'x').length;
	//Figure out which bits are which.
	bitLocations = Array();
	var bLocation;
	var markerIndex = -1;
	var choppedNum = 0;
	while ((markerIndex = formatString.search(/\{(\d+|B)\}/g)) != -1) {
		var bitNum = '';
		for (var i = markerIndex + 1; formatString[i] != '}'; i++) {
			bitNum += formatString[i];
		}
		if (bitNum == 'B') {
			bLocation = markerIndex + choppedNum;
		} else {
			bitLocations[Number(bitNum)] = markerIndex + choppedNum;
		}
		choppedNum += markerIndex + 1;
		formatString = formatString.substring(markerIndex + bitNum.length + 2);
	}
	//console.log(bitLocations);
	//console.log(bLocation);
	//console.log(formatString);
	//Extract the rules.
	rules = Array();
	for (var i = 0; i < rulesetString.length; i += ruleLength + 1) {
		var formattedRule = rulesetString.substring(i, i + ruleLength);
		var parsedRule = '';
		for (var j = 0; j < bitLocations.length; j++) {
			parsedRule += formattedRule[bitLocations[j]];
		}
		rules.push(parsedRule + formattedRule[bLocation]);
	}
	return rules;
}