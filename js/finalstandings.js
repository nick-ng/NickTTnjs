var rowIDList = [0];

// ==============
// Document.Ready
// ==============
$( document ).ready(function() {
  common.getTournamentKey();
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading players. Please wait.');
    socket.emit( 'pullAllPlayerDetails', common.tournamentKey );
  };
}); // $( document ).ready(function() {

function addPlayerRow(customID, equal) {
  //Get number of rows already in the table.
  equal = equal || false;
  var rowProperties = $('#tbl-final').prop('rows');
  //var rowCount = rowProperties.length; // Can be combined into one line but having it like this so I know later.
  //var newID = customID || rowCount; // There will be one more row than there are players because of the header row.
  var autoID = Math.max(...rowIDList) + 1;
  var newID = customID || autoID;
  var placeStr = ordinal_suffix_of(newID);
  if (equal) {
    placeStr += '=';
  };
  rowIDList.push(newID);
  // The row's contents
  var tableRowContent = '<tr id="playerRow' + newID + '">' +
    '<td style="text-align: right;">' + placeStr + '</td>' +
    '<td style="text-align: left;" id="short_name' + newID + '"></td>' +
    '<td style="text-align: left;" id="faction' + newID + '"></td>' +
    '<td style="text-align: right;" id="total_score' + newID + '"></td>' +
    '<td style="text-align: right;" id="total_vps' + newID + '"></td>' +
    '<td style="text-align: right;" id="total_vp_diff' + newID + '"></td>';
  $( '#tbl-final tr:last' ).after( tableRowContent ); // Append a new row.
  
  return newID;
};

function calculateStandings(playerList) {
  for (var i = 0; i < playerList.length; i++) {
    playerList[i].totalScore = common.sumArray(playerList[i].score);
    playerList[i].totalVP = common.sumArray(playerList[i].tiebreak2);
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
  };
  return playerList;
};

function sortStandings(playerList) {
  playerList = playerList.sort(function(a, b) {
    if (a.totalScore != b.totalScore) {
      return a.totalScore - b.totalScore;
    } else if (a.totalVP != b.totalVP) {
      return a.totalVP - b.totalVP;
    } else {
      return a.totalVPDiff - b.totalVPDiff;
    }
  });
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

socket.on( 'pushAllPlayerDetails', function(playerList, instructions) {
  $( '#tbl-final').find("tr:gt(0)").remove();
  //console.log(playerList);
  playerList = calculateStandings(playerList);
  playerList = sortStandings(playerList);
  // Display
  for (var i = 0; i < playerList.length; i++) {
    var id = addPlayerRow();
    $( '#short_name' + id).text(playerList[i].short_name);
    $( '#faction' + id).text(playerList[i].faction);
    $( '#total_score' + id).text(playerList[i].totalScore);
    $( '#total_vps' + id).text(playerList[i].totalVP);
    $( '#total_vp_diff' + id).text(playerList[i].totalVPDiff);
  };
  $( '#outstream' ).html( '' );
});
