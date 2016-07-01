var roundScoresObj = {
  tabIDList: [0],
  rowIDList: [[0]],
  systemObj: {},
  pendingPOSTs: 0
};

// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  $('.collapse').collapse( 'hide' );
  common.getTournamentKey(false, false)
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading tournament information.' );
    $.get( '/', {
      tKey: common.tournamentKey,
      mode: 'scores'
      }, function(res) {
      if (res.playerList && res.infoTable) {
        handleAllTournamentInfo(res.playerList, res.infoTable);
      } else {
        $( '#outstream' ).html( 'Couldn\'t get tournament info.' );
      }
    });
  };
}); // $(document).ready(function() {

function addTab(customID, sysObj) {
  var autoID = Math.max(...roundScoresObj.tabIDList) + 1;
  var tabID = customID || autoID;
  roundScoresObj.tabIDList.push(tabID);
  if (!roundScoresObj.rowIDList[tabID]) {
    roundScoresObj.rowIDList[tabID] = [];
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
  for (var i = 0; i < sysObj.tiebreaks.length; i++) {
    var tiebreakName = sysObj.tiebreaks[i];
    newContents += '<th class="text-center col-xs-2 col-md-1">' + tiebreakName + '</th>';
  };
  newContents += '<th class="text-left col-xs-2 col-md-1">Round ' + tabID + '<br>Opponent</th>' +
    '</tr></thead><tbody></tbody></table>' +
    '<p class="text-center"><input type="button" id="dummybutton' + tabID + '" class="btn btn-default" value="Submit"></p></div>';

  $( '#tabcontents' ).append(newContents);
  $( '#tablist a:last' ).tab('show');
}

function addPlayerRow(customID,tableID) {
  tableID = tableID || Math.max(...roundScoresObj.tabIDList); // Add row to highest numbered tab
  var autoID = Math.max(...roundScoresObj.rowIDList[tableID]) + 1;
  var newID = customID || autoID;
  roundScoresObj.rowIDList[tableID].push(newID);
  // The row's contents
  var tableRowContent = '<tr id="t' + tableID + 'playerRow' + newID + '">' +
    '<td class="text-left v-mid" id="t' + tableID + 'shortName' + newID + '"></td>' +
    '<td class="text-right v-mid"><input type="number" class="form-control text-right" id="t' + tableID + 'score' + newID + '" /></td>';
  for (var i = 0; i < roundScoresObj.systemObj.tiebreaks.length; i++) {
    tableRowContent += '<td class="text-right v-mid"><input type="number" class="form-control text-right" id="t' + tableID + 'tiebreak' + i + newID + '" /></td>';
  };
  //tableRowContent += '<td><input type="text" class="shorttext-input" id="t' + tableID + 'opponent' + newID + '" /></td></tr>';
  tableRowContent += '<td class="text-left v-mid" id="t' + tableID + 'opponent' + newID + '"></td></tr>';

  $( '#tbl-' + tableID + ' tbody' ).append(tableRowContent); // Append a new row.

  // Set up events for cells.
  $( '#t' + tableID + 'score' + newID).bind( 'focusout change', function() {
    var updateObject = {
      tKey: common.tournamentKey,
      id: newID,
      round: tableID,
      field: 'score',
      value: $(this).val()
    }
    //socket.emit( 'playerDetailsChanged', updateObject, 'scores' );
    roundScoresObj.pendingPOSTs++;
    $( '#finished-alert' ).collapse( 'hide' );
    $( '#sending-alert' ).collapse( 'show' );
    $.post( '/', {
      source: 'scores',
      updateObject: updateObject
    }, checkPendingPOSTs);
    return false;
  });

  for (var i = 0; i < roundScoresObj.systemObj.tiebreaks.length; i++) {
    //It's your old mate, variable scope? If you don't do this, tieID is just the largest value i gets to.
    tiebreakerEvents(tableID, i, newID); // end of anonymous function.
  };

  return 0;
};

function tiebreakerEvents(tableID, tieID, newID) {
  $( '#t' + tableID + 'tiebreak' + tieID + newID).bind( 'focusout change', function() {
    var updateObject = {tKey:common.tournamentKey, id:newID, round:tableID};
    updateObject.field = 'tiebreak' + tieID;
    updateObject.value = $(this).val();;
    //socket.emit( 'playerDetailsChanged', updateObject, 'scores' );
    roundScoresObj.pendingPOSTs++;
    $( '#finished-alert' ).collapse( 'hide' );
    $( '#sending-alert' ).collapse( 'show' );
    $.post( '/', {
      source: 'scores',
      updateObject: updateObject
    }, checkPendingPOSTs);
    return false;
  });
};

function playervoteEvents(playerID, voteID, selectID) {
  $( '#' + selectID).change(function() {
    var votedFor = $(this).children( ':selected' ).val();
    var updateObj = {
      tKey:common.tournamentKey,
      id:playerID,
      field: 'playervotes',
      index: voteID,
      value: votedFor
    };
    roundScoresObj.pendingPOSTs++;
    $( '#finished-alert' ).collapse( 'hide' );
    $( '#sending-alert' ).collapse( 'show' );
    $.post( '/', {
      source: 'scores',
      updateObject: updateObj
    }, checkPendingPOSTs);
  });
}

function populateRoundScoreTab(tabID, playerList, sysObj) {
  var i = tabID - 1;
  for (var j = 0; j < playerList.length; j++) {
    var id = playerList[j].id
    if (roundScoresObj.rowIDList[tabID].indexOf(id) == -1) {
      addPlayerRow(id,tabID);
    };
    $( '#t' + tabID + 'shortName' + id).text(playerList[j].short_name);
    $( '#t' + tabID + 'score' + id).val(playerList[j].score[i]);

    for (var k = 0; k < sysObj.tiebreaks.length; k++) {
      $( '#t' + tabID + 'tiebreak' + k + id)
        .val(playerList[j]['tiebreak' + k][i]);
    };
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
  }
}

function addPlayerVotesTab(tabID, sysObj) {
  roundScoresObj.tabIDList.push(tabID);
  if (!roundScoresObj.rowIDList[tabID]) {
    roundScoresObj.rowIDList[tabID] = [];
  };
  // Make new tab-item
  var newItem = '<li role="presentation">' +
    '<a href="#player-votes" aria-controls="player-votes" role="tab" data-toggle="tab">Player Votes</a></li>';
  $( '#tablist' ).append(newItem);

  // Make tab contents
  var newContents = '<div id="player-votes" role="tabpanel" class="tab-pane">' +
    '<table id="player-votes-tbl" class="table table-striped"><thead><tr>' +
    '<th class="text-left">Player</th>';
  for (var i = 0; i < sysObj.playervotes.length; i++) {
    newContents += '<th class="text-left">' + sysObj.playervotes[i] + '</th>';
  };
  newContents += '</tr></thead><tbody></tbody></table>';
  newContents += '<p class="text-center"><input type="button" id="dummybutton' + tabID + '" class="btn btn-default" value="Submit"></p></div>';

  $( '#tabcontents' ).append(newContents);
}

function addPlayerVotesRow(playerID, short_name, tableID, playerList) {
  roundScoresObj.rowIDList[tableID].push(playerID);
  // The row's contents
  var tableRowContent = '<tr id="soft-score-row-' + playerID + '">' +
    '<td class="text-left v-mid">' + short_name + '</td>';
  for (var i = 0; i < roundScoresObj.systemObj.playervotes.length; i++) {
    var selectID = 't' + tableID + 'playervotes' + i + playerID;
    var selectHTML = makePlayerVotesSelect(playerID, selectID, playerList);
    tableRowContent += '<td class="text-right v-mid">';
    tableRowContent += selectHTML + '</td>'; // + '<input type="number" class="form-control" id="t' + tableID + 'playervotes' + i + rowID + '" />
    //</td>';
  };
  //tableRowContent += '<td><input type="text" class="shorttext-input" id="t' + tableID + 'opponent' + newID + '" /></td></tr>';
  tableRowContent += '</tr>';
  $( '#player-votes-tbl tbody' ).append(tableRowContent); // Append a new row.

  // Set up events for cells.
  for (var i = 0; i < roundScoresObj.systemObj.playervotes.length; i++) {
    var selectID = 't' + tableID + 'playervotes' + i + playerID;
    playervoteEvents(playerID, i + 1, selectID);
  }
  return 0;
}

function populatePlayerVotesTab(tabID, playerList, sysObj) {
  var i = tabID - 1;
  for (var j = 0; j < playerList.length; j++) {
    var id = playerList[j].id
    var short_name = playerList[j].short_name
    if (roundScoresObj.rowIDList[tabID].indexOf(id) == -1) {
      addPlayerVotesRow(id, short_name, tabID, playerList);
    };
    for (var k = 0; k < sysObj.playervotes.length; k++) {
      var selectID = 't' + tabID + 'playervotes' + k + id;
      if (!isNaN(playerList[j].playervotes[k])) {
        $( '#' + selectID + ' option[value=' + playerList[j].playervotes[k] + ']' ).prop( 'selected', true );
      }
    };
  }
}

function makePlayerVotesSelect(playerID, selectID, playerList) {
  var selectHTML = '<select id="' + selectID + '" class="form-control">';
  selectHTML += '<option> </option>';
  for (var i = 0; i < playerList.length; i++) {
    if (playerID != playerList[i].id) {
      selectHTML += '<option value="' + playerList[i].id + '">' + playerList[i].short_name + '</option>';
    }
  }
  selectHTML += '</select>';
  return selectHTML;
}

function checkPendingPOSTs() {
  roundScoresObj.pendingPOSTs--;
  if (roundScoresObj.pendingPOSTs == 0) {
    $( '#sending-alert' ).collapse( 'hide' );
    $( '#finished-alert' ).collapse( 'show' );
    setTimeout(function() {
      $( '#finished-alert' ).collapse( 'hide' );
    }, 3000);
  }
}

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

function handleAllTournamentInfo(playerList, infoTable) {
  roundScoresObj.systemObj = JSON.parse(infoTable.system_json);
  var rounds = common.getDrawnRounds(playerList);
  var tabID;
  for (var i = 0; i < rounds; i++) { // Remember that rounds start from 1.
    tabID = i + 1;
    addTab(tabID, roundScoresObj.systemObj);
    playerList = sortByTablesThenNames(playerList, i);
    populateRoundScoreTab(tabID, playerList, roundScoresObj.systemObj);
  };
  tabID++
  addPlayerVotesTab(tabID, roundScoresObj.systemObj);
  playerList = _.sortBy(playerList, 'short_name');
  populatePlayerVotesTab(tabID, playerList, roundScoresObj.systemObj);

  $( '#outstream' ).html( '' );
}
