var tabIDList = [0];
var rowIDList = [[0]];
var maxTries = [100,1000,5000]; // How many times to try before going to a different routine.
var maxTime = 4.8; // Unresponsive alert time.
var randseed = [Math.random()]; // Initialise a random seed for the random function we call later.
var playerList;
var displayObj;
var maxMaps;
var activeTab;
//var drawList = [];

// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  common.getTournamentKey(false, true)
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading tournament information.' );
    socket.emit( 'pullAllTournamentInfo', common.tournamentKey, 'rounddraw' );
  };
  
  activateDisplayControls()
}); // $(document).ready(function() {

function addTab(customID) {
  var autoID = Math.max(...tabIDList) + 1;
  var tabID = customID || autoID;
  tabIDList.push(tabID);
  if (!rowIDList[tabID]) {
    rowIDList[tabID] = [];
  };
  
  // Make new tab-item
  var newItem = '<li role="presentation">' +
    '<a href="#tabcontents-' + tabID + '" aria-controls="round-' + tabID + '" role="tab" data-toggle="tab">Round ' + tabID + '</a></li>';
  $( '#tablist' ).append(newItem);
  
  // Make tab contents
  var newContents = '<div id="tabcontents-' + tabID + '" role="tabpanel" class="tab-pane">' +
    '<h6 class="text-center"><input id="drawbutton-' + tabID + '" class="btn btn-default" value="Make Draw" type="button"> ' + 
    '<input id="acceptdrawbutton-' + tabID + '" class="btn btn-default" value="Accept Draw" type="button" disabled></h6>' +
    '<table id="tbl-' + tabID + '" class="table table-striped"><thead><tr>' +
    '<th class="text-center col-xs-1 col-sm-1 col-md-1 col-lg-1">Table</th>' +
    '<th class="text-left col-xs-2 col-sm-2 col-md-2 col-lg-2">Player 1</th>' +
    '<th class="text-left col-xs-2 col-sm-2 col-md-2 col-lg-2">Player A</th>' +
    '</tr></thead><tbody></tbody></table></div>';
  $( '#tabcontents' ).append(newContents);
  
  $( '#tablist a:last' ).tab('show');
  activeTab = tabID;
  activateDrawControls(tabID);
  // Set tab switching events.
  $('a[data-toggle="tab"]').unbind( 'shown.bs.tab' );
  $('a[data-toggle="tab"]').on( 'shown.bs.tab', function (e) {
    var currentTab = $(e.target).text();
    activeTab = parseInt(currentTab.match(/\d/g)[0]);
  });
};

function activateDisplayControls() {
  $( '#openDisplayButton' ).click(function() {
    //Open webpage
    window.open( './display', '_blank', 'toolbar=0,location=0,menubar=0' );
  });
  $( '#updateDisplayForm' ).submit(function() {
    //Do stuff
    updateDisplay();
    return false;
  });
  $( '#clearAnnouncementButton' ).click(function() {
    //Do stuff
    $( '#displayAnnouncement' ).val( '' );
    var displayData = {};
    displayData.room = common.tournamentKey;
    displayData.announcement = '';
    socket.emit('sendToDisplay', displayData);
  });
};

function updateDisplay() {
  var displayData = {};
  displayData.room = common.tournamentKey;
  displayData.announcement = $( '#displayAnnouncement' ).val();
  displayData.content = $( '#tbl-' + activeTab).html();
  displayData.content = '<table class="table table-striped">' + displayData.content + '</table>';
  displayData.content = '<h2 class="text-center">Round ' + activeTab + ' Draw</h2>' + displayData.content;
  displayData.left_image_url = $( '#displayLeftImageURL' ).val();
  displayData.right_image_url = $( '#displayRightImageURL' ).val();
  socket.emit('sendToDisplay', displayData);
}

function activateDrawControls(tabID) {
  var drawList;
  $( '#drawbutton-' + tabID).click(function() {
    // Draw a round.
    var pairList = pairRound(playerList, tabID);
    drawList = assignMaps(pairList, playerList);
    $( '#tbl-' + tabID).find("tr:gt(0)").remove();
    displayDraw(drawList, playerList, tabID);
    // Enable accept button
    $( '#acceptdrawbutton-' + tabID).prop( 'disabled', false );
  });
  //$( '#acceptdrawbutton-' + tabID); // Make acceptdrawbutton a button
  $( '#acceptdrawbutton-' + tabID).click(function() {
    var drawObject = {};
    drawObject.drawList = drawList;
    drawObject.round = tabID;
    drawObject.tKey = common.tournamentKey;
    console.log(drawObject);
    socket.emit( 'pushRoundDraw', drawObject);
    $( '#acceptdrawbutton-' + tabID).prop( 'disabled', true );
    $( '#drawbutton-' + tabID).prop( 'disabled', true );
    updateDisplay();
  });
};

function addDrawRow(customID,tableID) {
  tableID = tableID || Math.max(...tabIDList); // Add row to highest numbered tab
  var autoID = Math.max(...rowIDList[tableID]) + 1;
  var newID = customID || autoID;
  rowIDList[tableID].push(newID);
  // The row's contents
  var tableRowContent = '<tr id="t' + tableID + 'drawRow' + newID + '">' +
    '<td class="text-center" id="t' + tableID + 'map' + newID + '"></td>' + // Call the settings the players play on "maps" to avoid conflict with "tables".
    '<td class="text-left" id="t' + tableID + 'player1' + newID + '"></td>' +
    '<td class="text-left" id="t' + tableID + 'player2' + newID + '"></td>';
  //~ console.log(tableRowContent);
  $( '#tbl-' + tableID + ' tbody' ).append(tableRowContent); // Append the new row.
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

socket.on( 'pushAllTournamentInfo', function(playerListIn, infoTable, instructions) {
  if (infoTable) {
    displayObj = JSON.parse(infoTable.display_json);
    if (displayObj.announcement) {
      $( '#displayAnnouncement' ).val(displayObj.announcement);
    }
    if (displayObj.left_image_url) {
      $( '#displayLeftImageURL' ).val(displayObj.left_image_url);
    }
    if (displayObj.right_image_url) {
      $( '#displayRightImageURL' ).val(displayObj.right_image_url);
    }
  }
  if (playerListIn && (instructions != 'shortNamesOnly' )) {
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
    //tabs.tabs("option", "active", -1);
  }
  $( '#outstream' ).html( '' );
});

socket.on( 'drawAccepted', function(round) {
  $( '#drawbutton-' + round).prop( 'disabled', false );
  $( '#acceptdrawbutton-' + round).prop( 'disabled', true );
});
