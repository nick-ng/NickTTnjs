var tabIDList = [0];
var rowIDList = [[0]];
var tabs;
var maxTries = [100,1000,5000]; // How many times to try before going to a different routine.
var maxTime = 4.8; // Unresponsive alert time.
var randseed = [Math.random()]; // Initialise a random seed for the random function we call later.
var playerList;
var maxMaps;
//var drawList = [];

// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  common.getTournamentKey()
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading tournament information.' );
    socket.emit( 'pullAllPlayerDetails', common.tournamentKey, 'rounddraw' );
  };
  tabs = $("#tabs").tabs();
}); // $(document).ready(function() {

function addTab(customID) {
  var autoID = Math.max(...tabIDList) + 1;
  var tabID = customID || autoID;
  tabIDList.push(tabID);
  if (!rowIDList[tabID]) {
    rowIDList[tabID] = [];
  };
  // Make new tab-item
  var newItem = '<li><a href="#tabs-' + tabID + '"><span style="font-weight:bold;">Round ' + tabID + '</span></a></li>';
  //$( '#tablist' ).val($( '#tablist' ).val() + newItem);
  tabs.find( '.ui-tabs-nav' ).append(newItem);
  //~ console.log( 'tablist.val() = ' + $( '#tablist' ).val());
  
  // Make tab contents
  var newContents = '<div id="tabs-' + tabID + '">' +
    '<span class="fix-font-size">' +
    '<p class="mini-h"><input id="drawbutton-' + tabID + '" value="Make Draw" type="button">' + 
    '<input id="acceptdrawbutton-' + tabID + '" value="Accept Draw" type="button" disabled></p>' +
    '<table id="tbl-' + tabID + '"><tbody><tr>' +
    '<th style="text-align: center;">Table</th>' +
    '<th style="text-align: left;">Player 1</th>' +
    '<th style="text-align: left;">Player A</th>' +
    '</tr></tbody></table></span></div>';
  tabs.append(newContents);
  //~ console.log( 'tabcontents.val() = ' + $( '#tabcontents' ).val());
  
  tabs.tabs( 'refresh' );
  activateDrawControls(tabID);
};

function activateDrawControls(tabID) {
  var drawList;
  $( '#drawbutton-' + tabID).button().click(function() {
    // Draw a round.
    var pairList = pairRound(playerList, tabID);
    drawList = assignMaps(pairList, playerList);
    $( '#tbl-' + tabID).find("tr:gt(0)").remove();
    displayDraw(drawList, playerList, tabID);
    // Enable accept button
    $( '#acceptdrawbutton-' + tabID).button( 'enable' );
  });
  //$( '#acceptdrawbutton-' + tabID).button(); // Make acceptdrawbutton a button
  $( '#acceptdrawbutton-' + tabID).button().click(function() {
    var drawObject = {};
    drawObject.drawList = drawList;
    drawObject.round = tabID;
    drawObject.tKey = common.tournamentKey;
    console.log(drawObject);
    socket.emit( 'pushRoundDraw', drawObject);
    $( '#acceptdrawbutton-' + tabID).button( 'disable' );
    $( '#drawbutton-' + tabID).button( 'disable' );
  });
};

function addDrawRow(customID,tableID) {
  tableID = tableID || Math.max(...tabIDList); // Add row to highest numbered tab
  var autoID = Math.max(...rowIDList[tableID]) + 1;
  var newID = customID || autoID;
  rowIDList[tableID].push(newID);
  // The row's contents
  var tableRowContent = '<tr id="t' + tableID + 'drawRow' + newID + '">' +
    '<td style="text-align: center;" id="t' + tableID + 'map' + newID + '"></td>' + // Call the settings the players play on "maps" to avoid conflict with "tables".
    '<td style="text-align: left;" id="t' + tableID + 'player1' + newID + '"></td>' +
    '<td style="text-align: left;" id="t' + tableID + 'player2' + newID + '"></td>';
  //~ console.log(tableRowContent);
  $( '#tbl-' + tableID + ' tr:last' ).after(tableRowContent); // Append the new row.
  return 0;
};

// Do this on the client to reduce the load on the server.
function pairRound(playerList, round, randomSeed) {
  var prevRound = common.getDrawnRounds(playerList);
  var nextRound = round || prevRound + 1;
  randseed[0] = randomSeed || nextRound;
  // Pair players
  /* Pairing Algorithm Steps:
   * 0. The most wins a player can have is the previous round number.
   * 1. Set the current win bracket to be the current round number. This is to avoid a special case first loop.
   * 2. Reduce the current win bracket by 1.
   * 3. Round down and add random amount between 0.1 and 0 to each player's score.
   * 4. Sort players by their score
   * 5. Check the first player's score. If less than the current win bracket, go to 2.
   * 6. .shift() two players from the array.
   * 7. Check if they can play each other. If they can't, .push() them to the array and go to 3.
   * 8. If there are still players in the array, go to 6
   * 9. If it takes too long, put all the players back in the array and start from 1.
   */
  // Make a temporary array of players.
  var tempPlayers = makeTempPlayerList(playerList);
  var pairList = [];
  breakCounter = 0;
  /* These control what pairings are allowed.
   * avoidOpponents is always true.
   * Order:
   * honourScore = avoidClubs = true
   * honourScore = true
   * avoidClubs = true
   */
  var honourScore = true; // Pair according to score.
  var avoidClubs = true; // Avoid pairing players from the same club.
  while ((tempPlayers.length > 0) && (breakCounter < maxTries[0])) {
    for (var i = 0; i < tempPlayers.length; i++) {
      //Math.floor(tempPlayers[i].totalScore) +
      tempPlayers[i].totalScore = seededRand() / 10;
      if (honourScore) {
        tempPlayers[i].totalScore += common.sumArray(tempPlayers[i].score);
      };
    };
    sortByKey(tempPlayers, 'totalScore');
    tempPlayers.reverse();
    //~ console.log('Hello');
    //~ for (var i = 0; i < tempPlayers.length; i++) {
      //~ console.log(tempPlayers[i]);
    //~ };
    scoreBracket = Math.floor(tempPlayers[0].totalScore);
    //~ console.log('Paired so far:');
    //~ console.log(pairList);
    //~ console.log('New scoreBracket = ' + scoreBracket);
    while (tempPlayers[0] && tempPlayers[0].totalScore >= scoreBracket) {
      player1 = tempPlayers.shift();
      player2 = tempPlayers.shift();
      if (player1.opponentids.indexOf(player2.id) == -1 ) {
        pairList.push([player1.id, player2.id]);
      } else {
        tempPlayers.push(player1);
        tempPlayers.push(player2);
        breakCounter++;
        break;
      };
    };
  };
  //~ console.log(pairList);
  if (tempPlayers.length > 0) {
    console.log( 'Couldn\'t pair players' );
    $( '#outstream' ).html( '<h1>Couldn\'t pair players</h1><p>It may be impossible to avoid a player duplications</p>' );
  };
  return pairList;
};

function assignMaps(pairList, playerListIn) {
  var bestDraw  = {};
  bestDraw.conflicts = Infinity;
  bestDraw.draw = [];
  var tries = 0;
  while (bestDraw.conflicts && (tries < maxTries[0])) {
    tries++;
    var availableMaps = range(1,maxMaps);
    var currentDraw = [];
    var conflicts = 0;
    for (var i = 0; i < pairList.length; i++) {
      var p1 = pairList[i][0];
      var p2 = pairList[i][1];
      //~ console.log('i = ' + i);
      //~ console.log('p1= ' + p1);
      //~ console.log('p2= ' + p2);
      var p1Maps = common.findInArray(playerList, p1, 'id', 'tablenumbers');
      var p2Maps = common.findInArray(playerList, p2, 'id', 'tablenumbers');
      var playedMaps = merge(p1Maps, p2Maps);
      var validMaps = arr_diff(availableMaps, playedMaps);
      var assignedMap;
      // Return a random valid map. If validMaps is empty, return a random Available map.
      if (validMaps.length > 0) {
        assignedMap = randFromArray(validMaps);
      } else {
        assignedMap = randFromArray(availableMaps);
        conflicts++;
      };
      currentDraw.push({map:assignedMap, players:pairList[i]});
      // Remove the map from available maps.
      availableMaps = removeFromArray(availableMaps, assignedMap);
    };
    if (conflicts < bestDraw.conflicts) {
      bestDraw.conflicts = conflicts;
      bestDraw.draw = currentDraw;
    };
  };
  console.log('Managed ' + bestDraw.conflicts + ' conflicts when assigning tables');
  return sortByKey(bestDraw.draw, 'map');
};

function displayDraw(drawList, playerList, roundID) {
  for (var i = 0; i < drawList.length; i++) {
    var map = drawList[i].map;
    var p1 = drawList[i].players[0];
    var p2 = drawList[i].players[1];
    addDrawRow(map,roundID);
    // Put common.findInArray(array, searchValue, searchKey, returnKey) here.
    //~ console.log('findInArray = ' + common.findInArray(playerList, p1, 'id', 'short_name'));
    $( '#t' + roundID + 'map' + map).text(map);
    $( '#t' + roundID + 'player1' + map).text(common.findInArray(playerList, p1, 'id', 'short_name'));
    $( '#t' + roundID + 'player2' + map).text(common.findInArray(playerList, p2, 'id', 'short_name'));
  };
};

function makeTempPlayerList(playerList) {
  var tempPlayers = [];
  for (var i = 0; i < playerList.length; i++) {
    // Check still_playing property before pushing.
    // playerList[i].stillplaying;
    tempPlayers.push({id:playerList[i].id, opponentids:playerList[i].opponentids, score:playerList[i].score});
  };
  if (tempPlayers.length % 2) {
    tempPlayers.push({id:-1, opponentids:[], score:[-1]}); // Add ghost player so there are always an even number of players.
  };
  return tempPlayers;
};

function reconstructDrawList(playerList, roundID) {
  var roundIndex = roundID - 1;
  var drawList = [];
  for (var i = 0; i < playerList.length; i++) {
    var mapID = playerList[i].tablenumbers[roundIndex];
    var mapIndex = mapID - 1;
    if (!drawList[mapIndex]) {
      drawList[mapIndex] = {map:mapID};
    }
    if (drawList[mapIndex].players) {
      drawList[mapIndex].players.push(playerList[i].id);
    } else {
      drawList[mapIndex].players = [playerList[i].id];
    };
  };
  return drawList;
};

function seededRand(generator) {
  // A seeded random number generator.
  generator = generator || 0;
  if (!randseed[generator]) {
    randseed[generator] = Math.random();
  };
  var x = Math.sin(randseed[generator]++) * 10000;
  return x - Math.floor(x);
}

function sortByKey(array, key) {
  return array.sort(function getDelta(a, b) {
    var x = a[key];
    var y = b[key];

    if (typeof x == "string") {
      x = x.toLowerCase();
    }
    if (typeof y == "string") {
      y = y.toLowerCase();
    }
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
};

// From http://codegolf.stackexchange.com/a/17129
function merge() {
  var args = arguments;
  var hash = {};
  var arr = [];
  for (var i = 0; i < args.length; i++) {
    if (!args[i]) {
      args[i] = [];
    };
    for (var j = 0; j < args[i].length; j++) {
      if (hash[args[i][j]] !== true) {
        arr[arr.length] = args[i][j];
        hash[args[i][j]] = true;
      }
    }
  }
  return arr;
};

// From http://stackoverflow.com/a/16902226
function range(lowEnd, highEnd) {
  var arr = [],
  c = highEnd - lowEnd + 1;
  while ( c-- ) {
   arr[c] = highEnd--;
  }
  return arr;
};

// From http://stackoverflow.com/a/15386005
function arr_diff(arrayOne, arrayTwo) {
  return $(arrayOne).not(arrayTwo).get();
};

// From http://stackoverflow.com/a/5915122
function randFromArray(items, generator) {
  generator = generator || 1;
  return items[Math.floor(seededRand(generator)*items.length)];
};

// From http://stackoverflow.com/a/21688894
function removeFromArray(arrOriginal, elementToRemove) {
  return arrOriginal.filter(function(el){
    return el !== elementToRemove;
  });
};

socket.on( 'pushAllPlayerDetails', function(playerListIn, extraInfo) {
  $( '#outstream' ).html( '' );
  playerList = playerListIn;
  maxMaps = Math.ceil(playerList.length/2);
  var prevRound = common.getDrawnRounds(playerList);
  // Put all the existing round information into tabs and tables.
  for (var i = 1; i <= prevRound; i++) {
    roundID = i;
    addTab(roundID);
    // Add pairings to the tab.
    drawList = reconstructDrawList(playerList, roundID);
    displayDraw(drawList, playerList, roundID)
  };
  // Make a new tab for the next round.
  //~ console.log('Adding new tab');
  addTab(prevRound + 1);
  //var newDraw = pairRound(playerList);
  tabs.tabs("option", "active", -1);
});

socket.on( 'drawAccepted', function(round) {
  $( '#drawbutton-' + round).button( 'enable' );
  $( '#acceptdrawbutton-' + round).button( 'disable' );
});
