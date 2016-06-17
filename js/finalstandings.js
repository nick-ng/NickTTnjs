var rowIDList = [0];
var systemObj;
var playerList;

// ==============
// Document.Ready
// ==============
$( document ).ready(function() {
  common.getTournamentKey(false, true);
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading players. Please wait.');
    socket.emit( 'pullAllTournamentInfo', common.tournamentKey, 'finalstandings' );
  };
  activateDisplayControls()
}); // $( document ).ready(function() {

function addPlayerRow(customID, equal) {
  //Get number of rows already in the table.
  equal = equal || false;
  var autoID = Math.max(...rowIDList) + 1;
  var newID = customID || autoID;
  var placeStr = ordinal_suffix_of(newID);
  if (equal) {
    placeStr += '=';
  };
  rowIDList.push(newID);
  // The row's contents
  makeTableRow(newID, placeStr);
  return newID;
};

function calculateStandings(playerList) {
  for (var i = 0; i < playerList.length; i++) {
    if (systemObj.slug == 'guildball') {
      playerList[i].totalScore = common.sumArray(playerList[i].score);
      playerList[i].totalVP = common.sumArray(playerList[i].tiebreak2);
      playerList[i].totalGoals = common.sumArray(playerList[i].tiebreak0);
      playerList[i].totalBodies = common.sumArray(playerList[i].tiebreak1);
      var totalVPDiff = 0;
      for (var j = 0; j < playerList[i].opponentids.length; j++) { // For each round,
        var roundVPScored = playerList[i].tiebreak2[j];
        
        console.log(roundVPScored);
        var roundOpponent = playerList.find(function(player) {
          return player.id == playerList[i].opponentids[j];
        });
        var roundVPConceed = roundOpponent.tiebreak2[j];
        totalVPDiff += roundVPScored - roundVPConceed;
      };
      playerList[i].totalVPDiff = totalVPDiff;
    } else if (systemObj.slug == 'other') {
      playerList[i].totalScore = common.sumArray(playerList[i].score)
    }
  };
  return playerList;
};

function calculateStrengthOfSchedule(playerList, sosKey) { // usually have sosKey = 'totalScore';
  for (var i = 0; i < playerList.length; i++) {
    playerList[i].sos = 0;
    for (var j = 0; j < playerList[i].opponentids.length; j++) { // For each round,
      var roundOpponent = playerList.find(function(player) {
        return player.id == playerList[i].opponentids[j];
      });
      playerList[i].sos += roundOpponent[sosKey];
    }
  }
  return playerList;
};

function activateDisplayControls() {
  $( '#openDisplayButton' ).click(function() {
    //Open webpage
    window.open( './display', '_blank', 'toolbar=0,location=0,menubar=0' );
  });
  $( '#displayFinalButton' ).click(function() {
    updateDisplay();
  });
};

function updateDisplay() {
  var displayData = {};
  displayData.room = common.tournamentKey;
  displayData.announcement = 'Final Standings';
  displayData.content = $( '#tbl-final' ).html();
  var tableClasses = 'table table-striped';
  if (rowIDList.length > 16) {
    tableClasses = 'table table-striped table-condensed';
  }
  displayData.content = '<table class="' + tableClasses + '">' + displayData.content + '</table>';
  displayData.leftURL = '';
  displayData.rightURL = '';
  socket.emit('sendToDisplay', displayData);
}  

function sortStandings(playerList) {
  playerList = playerList.sort(sortDeltaFunction);
  return playerList.reverse();
};

// From http://stackoverflow.com/a/13627586
function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

// From http://stackoverflow.com/a/4020842
function maxByKey(arr,keyName) {
  return Math.max.apply(Math,arr.map(function(o){return o[keyName];}));
}

socket.on( 'pushAllTournamentInfo', function(playerListIn, infoTable, instructions) {
  if (infoTable) {
    systemObj = JSON.parse(infoTable.system_json);
  }
  if (playerListIn && (instructions != 'shortNamesOnly' )) {
    playerList = playerListIn;
    makeTableHead();
    $( '#tbl-final tbody tr' ).remove();
    //console.log(playerList);
    playerList = calculateStandings(playerList);
    var sosKey = 'totalScore';
    if (systemObj.slug == 'weirdGame') { // Guild Ball
      sosKey = 'faction';
    }
    playerList = calculateStrengthOfSchedule(playerList, sosKey);
    playerList = sortStandings(playerList);
    // Display
    for (var i = 0; i < playerList.length; i++) {
      var id = addPlayerRow();
      populateTableRow(id, playerList[i]);
    };
    $( '#outstream' ).html( '' );
  };
});

/* ==============================
 * Game system specific functions
 * ==============================
 * Different game systems display different scores and handle tiebreaks
 * differently. The following functions change according to:
 * systemObj.slug
 */
function makeTableHead() {
  var tableHeadContent = '';
  if (systemObj.slug == 'guildball') { // Guild Ball
    tableHeadContent += '<th class="text-center">Place</th>' +
      '<th>Player</th>' +
      '<th>' + systemObj.faction_name + '</th>' +
      '<th class="text-right">Total Score</th>' +
      '<th class="text-right">Total VPs</th>' +
      '<th class="text-right">Total VP<br/>Difference</th>' +
      '<th class="text-right">Total<br/>Goals</th>' +
      '<th class="text-right">Total<br/>Body<br/>Count</th>';
  } else if (systemObj.slug == 'other') { // Other
    tableHeadContent += '<th class="text-center">Place</th>' +
      '<th>Player</th>' +
      '<th>' + systemObj.faction_name + '</th>' +
      '<th class="text-right">Total Score</th>';
  }
  $( '#tbl-final > thead > tr' ).html(tableHeadContent);
};

function makeTableRow(newID, placeStr) {
  var tableRowContent = '';
  if (systemObj.slug == 'guildball') { // Guild Ball
    tableRowContent += '<tr id="playerRow' + newID + '">' +
      '<td class="text-center">' + placeStr + '</td>' +
      '<td id="short_name' + newID + '"></td>' +
      '<td id="faction' + newID + '"></td>' +
      '<td class="text-right" id="total_score' + newID + '"></td>' +
      '<td class="text-right" id="total_vps' + newID + '"></td>' +
      '<td class="text-right" id="total_vp_diff' + newID + '"></td>' +
      '<td class="text-right" id="total_goals' + newID + '"></td>' +
      '<td class="text-right" id="total_bodies' + newID + '"></td>';
  } else if (systemObj.slug == 'other') { // Other
    tableRowContent += '<tr id="playerRow' + newID + '">' +
      '<td class="text-center">' + placeStr + '</td>' +
      '<td id="short_name' + newID + '"></td>' +
      '<td id="faction' + newID + '"></td>' +
      '<td class="text-right" id="total_score' + newID + '"></td>';
  }
  $( '#tbl-final tbody' ).append(tableRowContent); // Append a new row.
};

function populateTableRow(id, playerObj) {
  if (systemObj.slug == 'guildball') { // Guild Ball
    var maxGoals = maxByKey(playerList, 'totalGoals' );
    var maxBodies = maxByKey(playerList, 'totalBodies' );
    $( '#short_name' + id).text(playerObj.short_name);
    $( '#faction' + id).text(playerObj.faction);
    $( '#total_score' + id).text(playerObj.totalScore);
    $( '#total_vps' + id).text(playerObj.totalVP);
    $( '#total_vp_diff' + id).text(playerObj.totalVPDiff);
    $( '#total_goals' + id).text(playerObj.totalGoals);
    if (playerObj.totalGoals == maxGoals) {
      $( '#total_goals' + id).addClass('bg-success');
    }
    $( '#total_bodies' + id).text(playerObj.totalBodies);
    if (playerObj.totalBodies == maxBodies) {
      $( '#total_bodies' + id).addClass('bg-success');
    }
  } else if (systemObj.slug == 'other') { // Other
    $( '#short_name' + id).text(playerObj.short_name);
    $( '#faction' + id).text(playerObj.faction);
    $( '#total_score' + id).text(playerObj.totalScore);
  }
}

function sortDeltaFunction(a, b) {
  if (systemObj.slug == 'guildball') { // Guild Ball
    if (a.totalScore != b.totalScore) {
      return a.totalScore - b.totalScore;
    } else if (a.totalVP != b.totalVP) {
      return a.totalVP - b.totalVP;
    } else if (a.totalVPDiff != b.totalVPDiff){
      return a.totalVPDiff - b.totalVPDiff;
    } else {
      return a.sos - b.sos;
    }
  } else if (systemObj.slug == 'other') { // Other
    if (a.totalScore != b.totalScore) {
      return a.totalScore - b.totalScore;
    } else {
      return a.sos - b.sos;
    }
  }
}
