var tabIDList = [0];
var rowIDList = [[0]];
var tabs;
var tiebreaks = ['Goals','Body<br>Count','Total VPs'];

// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  common.getTournamentKey()
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading tournament information.' );
    socket.emit( 'pullAllPlayerDetails', common.tournamentKey, 'scores' );
  };
  tabs = $("#tabs").tabs();
}); // $(document).ready(function() {

/*
$( '#test' ).button().click(function() {
  addTab();
});
*/

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
    //'<span class="pseudo-h">Round ' + tabID + '</span>' +
    '<span style="font-size:initial">' +
    '<table id="tbl-' + tabID + '"><tbody><tr>' +
    '<th style="text-align: left;">Player</th>' +
    '<th style="text-align: center;">Score</th>';
  for (var i = 0; i < tiebreaks.length; i++) {
    var tiebreakName = tiebreaks[i];
    newContents += '<th style="text-align: center;">' + tiebreakName + '</th>';
  };
  newContents += '<th style="text-align: left;">Round ' + tabID + '<br>Opponent</th>' +
    '</tr></tbody></table></span></div>';
  //$( '#tabcontents' ).val($( '#tabcontents' ).val() + newContents);
  tabs.append(newContents);
  //~ console.log( 'tabcontents.val() = ' + $( '#tabcontents' ).val());
  
  tabs.tabs( 'refresh' );
};

function addPlayerRow(customID,tableID) {
  tableID = tableID || Math.max(...tabIDList); // Add row to highest numbered tab
  var autoID = Math.max(...rowIDList[tableID]) + 1;
  var newID = customID || autoID;
  rowIDList[tableID].push(newID);
  // The row's contents
  var tableRowContent = '<tr id="t' + tableID + 'playerRow' + newID + '">' +
    '<td style="text-align: left;" id="t' + tableID + 'shortName' + newID + '"></td>' +
    '<td style="text-align: center;"><input type="number" class="number-input" id="t' + tableID + 'score' + newID + '" /></td>';
  for (var i = 0; i < tiebreaks.length; i++) {
    tableRowContent += '<td style="text-align: center;"><input type="number" class="number-input" id="t' + tableID + 'tiebreak' + i + newID + '" /></td>';
  };
  tableRowContent += '<td><input type="text" class="shorttext-input" id="t' + tableID + 'opponent' + newID + '" /></td></tr>'
  
  $( '#tbl-' + tableID + ' tr:last' ).after(tableRowContent); // Append a new row.
  
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

socket.on( 'pushAllPlayerDetails', function(playerList, warning) {
  //console.log(playerList);
  var rounds = common.getDrawnRounds(playerList);
  for (var i = 0; i < rounds; i++) { // Remember that rounds start from 1.
    tabID = i + 1;
    addTab(tabID);
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
      $( '#t' + tabID + 'opponent' + id).val(playerList[j].opponentname);
    };
  };
  $( '#outstream' ).html( '' );
  tabs.tabs("option", "active", -1);
});
