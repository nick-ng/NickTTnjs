var tabIDList = [0];
var rowIDList = [[0]];
var tiebreaks = ['Goals','Body<br>Count','Total VPs'];

// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  common.getTournamentKey(false, false)
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading tournament information.' );
    socket.emit( 'pullAllPlayerDetails', common.tournamentKey, 'scores' );
  };
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
    '<table id="tbl-' + tabID + '" class="table"><thead><tr>' +
    '<th class="text-left col-xs-2 col-md-1">Player</th>' +
    '<th class="text-center col-xs-2 col-md-1">Score</th>';
  for (var i = 0; i < tiebreaks.length; i++) {
    var tiebreakName = tiebreaks[i];
    newContents += '<th class="text-center col-xs-2 col-md-1">' + tiebreakName + '</th>';
  };
  newContents += '<th class="text-left col-xs-2 col-md-1">Round ' + tabID + '<br>Opponent</th>' +
    '</tr></thead><tbody></tbody></table>' +
    '<p class="text-center"><input type="button" id="dummybutton' + tabID + '" class="btn btn-default" value="Submit"></p></div>';
  
  $( '#tabcontents' ).append(newContents);
  $( '#tablist a:last' ).tab('show');
};

function addPlayerRow(customID,tableID) {
  tableID = tableID || Math.max(...tabIDList); // Add row to highest numbered tab
  var autoID = Math.max(...rowIDList[tableID]) + 1;
  var newID = customID || autoID;
  rowIDList[tableID].push(newID);
  // The row's contents
  var tableRowContent = '<tr id="t' + tableID + 'playerRow' + newID + '">' +
    '<td class="text-left v-mid" id="t' + tableID + 'shortName' + newID + '"></td>' +
    '<td class="text-right v-mid"><input type="number" class="form-control text-right" id="t' + tableID + 'score' + newID + '" /></td>';
  for (var i = 0; i < tiebreaks.length; i++) {
    tableRowContent += '<td class="text-right v-mid"><input type="number" class="form-control text-right" id="t' + tableID + 'tiebreak' + i + newID + '" /></td>';
  };
  //tableRowContent += '<td><input type="text" class="shorttext-input" id="t' + tableID + 'opponent' + newID + '" /></td></tr>';
  tableRowContent += '<td class="text-left v-mid" id="t' + tableID + 'opponent' + newID + '"></td></tr>';
  
  $( '#tbl-' + tableID + ' tbody' ).append(tableRowContent); // Append a new row.
  
  // Set up events for cells.
  $( '#t' + tableID + 'score' + newID).bind( 'focusout change', function() {
    var updateObject = {tKey:common.tournamentKey, id:newID, round:tableID};
    updateObject.field = 'score';
    updateObject.value = $(this).val();
    socket.emit( 'playerDetailsChanged', updateObject,'scores' );
    return false;
  });
  
  for (var i = 0; i < tiebreaks.length; i++) {
    //It's your old mate, variable scope? If you don't do this, tieID is just the largest value i gets to.
    tiebreakerEvents(tableID, i, newID); // end of anonymous function.
  };
  
  $( '#t' + tableID + 'opponent' + newID).bind( 'focusout', function() {
    var updateObject = {tKey:common.tournamentKey, id:newID, round:tableID};
    updateObject.field = 'opponent';
    updateObject.value = $(this).val();
    //socket.emit( 'playerDetailsChanged', updateObject, 'scores' );
    return false;
  });
  
  return 0; // Return player count in case we need it later.
};

function tiebreakerEvents(tableID, tieID, newID) {
  $( '#t' + tableID + 'tiebreak' + tieID + newID).bind( 'focusout change', function() {
    var updateObject = {tKey:common.tournamentKey, id:newID, round:tableID};
    updateObject.field = 'tiebreak' + tieID;
    updateObject.value = $(this).val();;
    socket.emit( 'playerDetailsChanged', updateObject, 'scores' );
    return false;
  });
};

// From http://stackoverflow.com/a/2998822
function zeroPad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function sortByTablesThenNames(array, index) {
  return array.sort(function getDelta(a, b) {
    var x = zeroPad(a.tablenumbers[index], 9) + a.short_name.toUpperCase();
    var y = zeroPad(b.tablenumbers[index], 9) + b.short_name.toUpperCase();

    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
};

socket.on( 'pushAllPlayerDetails', function(playerList, warning) {
  //console.log(playerList);
  var rounds = common.getDrawnRounds(playerList);
  for (var i = 0; i < rounds; i++) { // Remember that rounds start from 1.
    tabID = i + 1;
    addTab(tabID);
    playerList = sortByTablesThenNames(playerList, i);
    for (var j = 0; j < playerList.length; j++) {
      var id = playerList[j].id
      if (rowIDList[tabID].indexOf(id) == -1) {
        addPlayerRow(id,tabID);
      };
      $( '#t' + tabID + 'shortName' + id).text(playerList[j].short_name);
      $( '#t' + tabID + 'score' + id).val(playerList[j].score[i]);
      
      for (var k = 0; k < tiebreaks.length; k++) {
        //~ console.log(playerList[j]['tiebreak' + k][i]);
        $( '#t' + tabID + 'tiebreak' + k + id)
          .val(playerList[j]['tiebreak' + k][i]);
      };
      //~ console.log(playerList[j].score);
      // Convert opponent ids to values
      if (playerList[j].opponentids && (playerList[j].opponentids[i] > 0)) {
        var oppID = playerList[j].opponentids[i]; // playerids start from 1.
        var oppObj = playerList.find(function(player) {
          return player.id == oppID;
        });
        playerList[j].opponentname = oppObj.short_name;
      } else if (playerList[j].opponentids && (playerList[j].opponentids[i] < 0)) {
        playerList[j].opponentname = 'Ghost';
      } else {
        // This is if opponentids doesn't exist OR opponentids is 0.
        playerList[j].opponentname = 'Unassigned';
      }
      $( '#t' + tabID + 'opponent' + id).text(playerList[j].opponentname);
      if (playerList[j].tablenumbers[i] % 2) {
        $( '#t' + tabID + 'playerRow' + id).addClass( 'manual-bg-accent' );
      }
    };
  };
  $( '#outstream' ).html( '' );
});
