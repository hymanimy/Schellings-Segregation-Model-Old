var canvas = document.getElementById("mycanvas");
var ctx = canvas.getContext("2d"); //canvas width 720, height 480
var canvasWidth = 1600;
var canvasHeight = 800;

var satisfactionslider = document.getElementById("satisfactionRange");
var populationslider = document.getElementById("populationRange");

var squareWidth = 10;
var squareRowCount = 50; // how many cells per row 
var squareColumnCount = 40; //how many columns per row
var squarePadding = 3; //padding between squares
var squareOffSetTop = 10;
var squareOffSetLeft = 10;

var percentageOfSatisfaction = 0.49;//this is how many common allies there must be 
var gridsize = squareRowCount*squareColumnCount;
var ratioOfReds =  0.5; //this creates the ratio of blues aswell
var percentageOfGreens = 0.1; 
var delay = 500; //delay in ms

var rounds = 0;

//intialising the matrix of squares


function populateMatrix(){ 
    /*Although longer and less elegant that the previous populate matrix function, this one creates exact ratios of agents and greens based on the respective variables and does not leave it to probability */
    var squareMatrix =[];
    var numberOfGreens = gridsize*percentageOfGreens;
    var numberOfReds = (gridsize - numberOfGreens)*ratioOfReds;
    for(var c = 0; c < squareColumnCount; c++){
        squareMatrix[c] = []; //this creates c columns
        for(var r = 0; r < squareRowCount; r++){
            var squareX = r*(squareWidth + squarePadding) + squareOffSetLeft;
            var squareY = c*(squareWidth + squarePadding) + squareOffSetTop;
            squareMatrix[c][r] = {x:squareX, y:squareY, type: undefined}
        }
    }
    for(var i = 0; i<numberOfGreens; i++){ //this creates numberofGreens many green players
        var x = Math.floor(Math.random()*squareColumnCount);
        var y = Math.floor(Math.random()*squareRowCount); //these creates a random x coordinates
        while(squareMatrix[x][y].type != undefined){ //this ensures the cell is empty
            var x = Math.floor(Math.random()*squareColumnCount);
            var y = Math.floor(Math.random()*squareRowCount);
        }
        squareMatrix[x][y].type = 0;
    }
    for(var i = 0; i<numberOfReds; i++){ //this creates numberofreds many reds randomly
        var x = Math.floor(Math.random()*squareColumnCount);
        var y = Math.floor(Math.random()*squareRowCount); //these creates a random x coordinates
        while(squareMatrix[x][y].type != undefined){ //this ensures the cell is empty
            var x = Math.floor(Math.random()*squareColumnCount);
            var y = Math.floor(Math.random()*squareRowCount);
        }
        squareMatrix[x][y].type = -1;
    }
    for(var i = 0; i < squareColumnCount; i++){ //this makes the remaining unfille cells blue
        for(var j = 0; j < squareRowCount; j++){
            if(squareMatrix[i][j].type == undefined){
                squareMatrix[i][j].type = 1;
            }
        }
    }
    //although large, all three loops add up to one large loop so it shouldn't be too inefficient
    return squareMatrix;
}


function drawSquares(){ //this draws colours of the squares of the array
    for(var c = 0; c < squareColumnCount; c++){
        for(var r=0; r<squareRowCount; r++){
            ctx.beginPath();
            ctx.rect(squareMatrix[c][r].x, squareMatrix[c][r].y, squareWidth, squareWidth);
            if(squareMatrix[c][r].type > 0){ //changes their colours based on their type attribute
                ctx.fillStyle = "#00bfff" //BLUE 
            }
            else if(squareMatrix[c][r].type < 0){
                ctx.fillStyle = "#ff0000" //RED 
            }
            else if(squareMatrix[c][r].type == 0){
                ctx.fillStyle = "#00ff11" //GREEN
            }
            ctx.fill();
            ctx.closePath();
        }
    }
}

function satisfied(c,r,similarProportion){ //give the column and row of each square and checks whether they are satisfied
    //checks the proportion of neighbours to a person that are similar or different, if the value of similar neighbours < similar then return False
    var person = squareMatrix[c][r];
    if(person.type == 0){ //if the person is empty then they are satisfied
        return true
    }
    var sameNeighbourCount = 0;
    var totalNeighbours = 8; //there should be 8 neighbours however if an array space is undefined or it is green then we should remove one
    var proportion;
    for(var i=c-1; i <c+2; i++){
        for(var j=r-1; j <r +2; j++){
            if(!(i == c && j == r)){ //this means we don't count itself as a neighbour
                if (i < 0 || j < 0 || i >= squareColumnCount || j >= squareRowCount){ //this ensures they don't go out of bounds
                    totalNeighbours--; //we decrement the amount of neighbours it has if PERSON is on the edge
                }
                else if(squareMatrix[i][j].type > 0 && person.type > 0 || squareMatrix[i][j].type < 0 && person.type < 0){ //if they are of the same type
                    sameNeighbourCount++
                }
                else if(squareMatrix[i][j].type == 0){ //if it is an empty space then don't count it is a neighbour
                    totalNeighbours--;
                }
            } 
        }
    }
    proportion = sameNeighbourCount/totalNeighbours; //calculates how many similar neighbours a square has
    if(proportion >= similarProportion){ //similar proportion is the setting of the percentage of similar neighbours someone wants
        return true //they are satisfied
    }
    else{
        return false
    }
}


function updateSquares(){ //this loops through every square and checks if they are satisified and if not then they move
    var movedAgents = [];
    search:
    for(var c = 0; c < squareColumnCount; c++){
        for(var r = 0; r < squareRowCount; r++){
            if(isInArray(c,r,movedAgents)){ //we are checking if we are currently looking at an agent which has already been moved this round
                continue search; // if so we must move to the next agent because we can only move an agent once per tick according to http://nifty.stanford.edu/2014/mccown-schelling-model-segregation/
            }
            if(satisfied(c,r,percentageOfSatisfaction) == false){ //if unsatisfied then we must move
                var i = findEmptySpace(c,r)[0];
                var j = findEmptySpace(c,r)[1];
                squareMatrix[i][j].type = squareMatrix[c][r].type;
                squareMatrix[c][r].type = 0; //now make the current empty
                movedAgents.push([c,r]);
                movedAgents.push([i,j]);
            }
        }
    }
    //ctx.fillText("All agents which were moved and corresponding spaces: " + movedAgents, 10, 580);
}


function findEmptySpace(x,y){
    //this counts each green space from the square x,y onwards
    for(var j = y+1; j < squareRowCount; j ++){ //thus counts the current tow that the agent is in
        if(squareMatrix[x][j].type == 0){
            return [x,j];
        }
    }
    for(var i = x+1; i < squareColumnCount; i++){ //this counts the remaining rows
        for(var j = 0; j < squareRowCount; j++){
            if(squareMatrix[i][j].type == 0){
                return [i,j];
            }
        }
    }
    secondSearch:
    for(var f = 0; f <= x; f++){ //this is a search of all the previous cells, up to the xth row
        for(var g = 0; g < squareRowCount; g++){
            if(squareMatrix[f][g].type == 0){
                return [f,g];
            }
        }
    }
}

function getCell(x,y,matrix){
    return matrix[(x % squareColumnCount + squareColumnCount)%squareColumnCount][(y % squareRowCount + squareRowCount)%squareRowCount];
}

function isInArray(f,g, arr){
    var barr = [f,g]
    for(var index = 0; index<arr.length; index++){
        if (String(barr) == String(arr[index])){ //converting to string makes it much easier to compare the two arrays instead of creating loops of comparison through them
            return true
        }
    } 
    return false
}


function drawDone(){ //this lets me know who is unsatisfied in the grid
    ctx.font = "20px Arial";
    ctx.fillStyle = "#0095DD";
    var answer = "DONE";
    var finished = true;
    var unsatisfiedAgents = []; 
    var emptySpaces = [];
    search:
    for(var i = 0; i < squareColumnCount; i++){
        for(var j=0; j < squareRowCount; j++){
            if(satisfied(i,j,percentageOfSatisfaction) == false){
                answer = "NOT DONE";
                finished = false;
                unsatisfiedAgents.push([i,j]); //displays the coords of all unsatisfied
            }
            else if(squareMatrix[i][j].type == 0){
                emptySpaces.push([i,j]);
            }
        }
    }
    ctx.fillText( "Rounds: " + rounds + " " + answer /*"Unsatisfied Agents: " + unsatisfiedAgents*/,10,620); //this prints the first square that is not satisfied
    if(answer=="DONE"){
        clearInterval(intervalID);
    }
}



function drawStats(){
    var numberOfReds = 0; 
    var numberOfBlues = 0;
    var numberOfSatisfied = 0;
    for(var i = 0; i < squareColumnCount; i++){
        for(var j = 0; j < squareRowCount; j++){
            if(squareMatrix[i][j].type > 0){
                numberOfBlues++;
            }
            else if(squareMatrix[i][j].type < 0){
                numberOfReds++;
            }
            if(satisfied(i,j,percentageOfSatisfaction)){
                numberOfSatisfied++;
            }
        }
    }
    var numberOfGreens = gridsize - numberOfReds - numberOfBlues; 
    ctx.font = "20px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Ratio of Similarity: " + percentageOfSatisfaction + " ~ Red/Blue: " + Math.round(100*(numberOfReds/gridsize))+ ":"+ Math.round(100*(numberOfBlues/gridsize)) + "% ~ Percentage of Greens: " + Math.round(100*(numberOfGreens/gridsize)) + "% ~ Satisfied: " + 100*(numberOfSatisfied/gridsize) + "% ~ Grid Size: " + gridsize + " ~ Delay: " + delay + "ms", 10, 660);
}



function draw(){
    ctx.clearRect(0,0,canvasWidth,canvasHeight); //this clears the canvas and redraws
    if(!drawDone()){
        rounds++;
    } 
    drawStats();
    drawSquares();
    updateSquares();
}



function start(){
    intervalID = setInterval(draw,delay);
}

function reset(){
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    squareMatrix = populateMatrix();
    rounds = 0;
    stop(); //should stop when reset
    drawSquares();
    drawStats();
    drawDone();
}   

function stop(){
    clearInterval(intervalID);
}

satisfactionslider.oninput = function(){ //when variable is true, activate function
    document.getElementById("sliderPercentage").innerHTML = satisfactionslider.value + "%";
    percentageOfSatisfaction = satisfactionslider.value/100;
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    drawSquares();
    drawStats();
}

populationslider.oninput = function(){ //when variable is true, activate function
    var ratioOfBlues = 100-populationslider.value;
    document.getElementById("populationPercentage").innerHTML = populationslider.value + ":" + ratioOfBlues;
    ratioOfReds = populationslider.value/100;
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    squareMatrix = populateMatrix();
    drawSquares();
    drawStats();
}

squareMatrix = populateMatrix();
drawSquares();
drawStats();
