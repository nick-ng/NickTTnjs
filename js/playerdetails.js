var socket = io();
var rowIDList = [0];
var systemObj = {};
var emailGroup = '';
var allSelectList = ['#emailList'];

// ==============
// Document.Ready
// ==============
$( document ).ready(function() {
  addPlayerRow();
  common.getTournamentKey(false, false);
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading players. Please wait.');
    socket.emit( 'pullAllTournamentInfo', common.tournamentKey );
  };
  common.setSelectOnClick(allSelectList);
}); // $( document ).ready(function() {

$('#addPlayerButton').click(function() {
  addPlayerRow();
});
  
function addPlayerRow(customID, source) {
  var autoID = Math.max(...rowIDList) + 1;
  var newID = customID || autoID;
  rowIDList.push(newID);
  // The row's contents
  var tableRowContent = '<tr id="playerRow' + newID + '">' +
    //'<td class="text-right v-mid">' + newID + '</td>' +
    '<td class="v-mid"><input type="text" id="fullName' + newID + '" class="form-control" /></td>' +
    '<td class="v-mid"><input type="text" id="playerEmail' + newID + '" class="form-control" /></td>' +
    '<td class="v-mid"><input type="text" id="shortName' + newID + '" class="form-control" /><span class="hidden" id="shortNameHide' + newID + '"></span></td>' +
    '<td class="text-center v-mid"><input type="checkbox" unchecked id="stillPlaying' + newID + '" class="checkbox h-mid" /></td>' +
    '<td class="text-center v-mid"><input type="checkbox" unchecked id="paid' + newID + '" class="checkbox h-mid" /></td>' +
    '<td class="v-mid"><input type="text" id="club' + newID + '" class="form-control" /></td>' +
    '<td class="v-mid"><input type="text" id="faction' + newID + '" class="form-control" /></td></tr>'
  // id's of inputs: ['playerRow', 'stillPlaying', 'fullName', 'playerEmail', 'shortName', 'club', 'team'];
  // playerRow
  // stillPlaying
  // fullName
  // playerEmail
  // shortName
  // club
  // team
  
  $( '#tbl tbody' ).append(tableRowContent); // Append a new row.
  
  // Set up events for cells.
  $( '#fullName' + newID).focusout( function() {
    //var fullName = $( '#fullName' + newID ).val();
    var value = $(this).val();
    var updateObject = {};
    // updateObject.tKey - Tournament Key
    updateObject.tKey = common.tournamentKey;
    // updateObject.id - Player ID to update
    updateObject.id = newID;
    // updateObject.field - Player field to object (full_name, email, etc.);
    updateObject.field = 'full_name';
    // updateObject.value - New value of field
    updateObject.value = value;
    socket.emit( 'playerDetailsChanged', updateObject, 'playerdetails' );
    autoStillPlaying(updateObject.value, newID);
    return false;
  });
  
  $( '#playerEmail' + newID ).focusout( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'email';
    updateObject.value = $(this).val();
    socket.emit( 'playerDetailsChanged', updateObject, 'playerdetails' );
    return false;
  });
  
  $( '#shortName' + newID ).focusout( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'short_name';
    updateObject.value = common.removeWhiteSpace( $(this).val());
    if (common.removeWhiteSpace( $( '#shortNameHide' + newID).text()) != updateObject.value) {
      // User has entered a custom short name so store it on DB.
      socket.emit( 'playerDetailsChanged', updateObject, 'playerdetails' );
    };
    return false;
  });
  
  $( '#stillPlaying' + newID ).change( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'stillplaying';
    updateObject.value = $(this).prop( 'checked' );
    socket.emit( 'playerDetailsChanged', updateObject, 'playerdetails' );
    populateEmailList()
    return false;
  });
  
  $( '#paid' + newID ).change( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'paid';
    updateObject.value = $(this).prop( 'checked' );
    socket.emit( 'playerDetailsChanged', updateObject, 'playerdetails' );
    populateEmailList()
    return false;
  });
  
  $( '#club' + newID ).focusout( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'club';
    updateObject.value = $(this).val();
    socket.emit( 'playerDetailsChanged', updateObject, 'playerdetails' );
    return false;
  });
  
  $( '#faction' + newID ).focusout( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'faction';
    updateObject.value = $(this).val();
    socket.emit( 'playerDetailsChanged', updateObject, 'playerdetails' );
    return false;
  });
  
  /*
  $( '#faction' + newID ).bind( 'keydown', function( event ) {
    console.log(event.isDefaultPrevented());
    var lastFactionID = 'faction' + Math.max(...rowIDList);
    console.log(lastFactionID);
    // Which is best because it's the same across all browsers.
    // Alternatives: keyCode: 9, key: Tab
    if ( (event.which == 9) && ($(this).prop( 'id' ) == lastFactionID) ) {
      addPlayerRow(undefined, 'autoTab');
    };
    return false;
  });
  */
  
  showAllRows();
  if (source == 'autoTab') {
    //set focus
    $( '#fullName' + newID ).focus();
  };
  return 0;
};

$('#hideEmptyButton').click(function() {
  hideEmptyRows();
});

$( '#emailAllUnpaid' ).click(function() {
  emailGroup = 'allUnpaid';
  populateEmailList()
  $( '#emailList' ).removeClass( 'hidden' );
  $( '#emailAllUnpaid' ).addClass( 'active' );
  $( '#emailPlayingUnpaid' ).removeClass( 'active' );
  $( '#emailPlayingPaid' ).removeClass( 'active' );
});

$( '#emailPlayingUnpaid' ).click(function() {
  emailGroup = 'playingUnpaid';
  populateEmailList()
  $( '#emailList' ).removeClass( 'hidden' );
  $( '#emailAllUnpaid' ).removeClass( 'active' );
  $( '#emailPlayingUnpaid' ).addClass( 'active' );
  $( '#emailPlayingPaid' ).removeClass( 'active' );
});

$( '#emailPlayingPaid' ).click(function() {
  emailGroup = 'playingPaid';
  populateEmailList()
  $( '#emailList' ).removeClass( 'hidden' );
  $( '#emailAllUnpaid' ).removeClass( 'active' );
  $( '#emailPlayingUnpaid' ).removeClass( 'active' );
  $( '#emailPlayingPaid' ).addClass( 'active' );
});

function populateEmailList() {
  if (emailGroup) {
    var emailListString = '';
    for (var i = 1; i < rowIDList.length; i++) {
      var rowID = rowIDList[i];
      var stillPlaying = $( '#stillPlaying' + rowID ).prop( 'checked' );
      var paid = $( '#paid' + rowID ).prop( 'checked' );
      var emailAddress = $( '#playerEmail' + rowID ).val();
      if (emailGroup == 'allUnpaid') {
        if (!paid) {
          emailListString += emailAddress + ';';
        }
      } else if (emailGroup == 'playingUnpaid') {
        if (!paid && stillPlaying) {
          emailListString += emailAddress + ';';
        }
      } else if (emailGroup == 'playingPaid') {
        if (paid && stillPlaying) {
          emailListString += emailAddress + ';';
        }
      }
    };
    $( '#emailList' ).val(emailListString);
  }
}

function autoStillPlaying(value, id) {
  if (common.removeWhiteSpace(value)) {
    var updateObject = {tKey:common.tournamentKey, id:id};
    updateObject.field = 'stillplaying';
    updateObject.value = true;
    $( '#stillPlaying' + id).prop( 'checked', true );
    socket.emit( 'playerDetailsChanged', updateObject, 'playerdetails' );
  };
};

function hideEmptyRows() {
  //var inputIds = ['fullName', 'playerEmail', 'shortName', 'club', 'faction'];
  var inputIds = ['fullName', 'playerEmail'];
  //var bgColourToggler = 1; // 1 = light, 0 = dark.
  for (var i = 0; i < rowIDList.length; i++) {
    var wholeString = ''
    for (var j = 0; j < inputIds.length; j++) {
      wholeString = wholeString + $('#' + inputIds[j] + rowIDList[i]).val();
    }
    var trimString = $.trim(wholeString);
    //console.log('' + i + ': ' + wholeString);
    if (trimString == "") { // If none of the cells contain characters (except for white space)...
      //console.log('There is nothing of value in that row');
      $('#playerRow' + rowIDList[i]).hide(); // remove empty row.
    }
  }
  $('#showEmptyButton').show()
  $('#hideEmptyButton').hide()
  $('#addPlayerButton').hide()
}

$('#showEmptyButton').click(function() {
  showAllRows();
});

function showAllRows() {
  //var rowCount = $('#tbl').prop('rows').length; // I feel like I should store the value somewhere rather than invoking this everytime.
  for (var i = 0; i < rowIDList.length; i++) {
    $('#playerRow' + rowIDList[i]).show(); // show row.
  }
  $('#showEmptyButton').hide()
  $('#addPlayerButton').show()
  $('#hideEmptyButton').show()
}

/*
socket.on( 'shortName change', function(playerList) {
  //console.log( shortName );
  for (var i = 0; i < playerList.length; i++ ) {
    player = playerList[i];
    $( '#shortName' + player.ID ).val( player.shortName );
    $( '#stillPlaying' + player.ID ).attr( 'checked', true );
  };
});
*/

function processPlayerList(playerList, instructions) {
  for (var i = 0; i < playerList.length; i++) {
    var id = playerList[i].id;
    if (rowIDList.indexOf(id) == -1) {
      addPlayerRow(id);
    };
    if (instructions != 'shortNamesOnly' ) {
      // set everything else.
      $( '#fullName' + id).val(playerList[i].full_name);
      $( '#playerEmail' + id).val(playerList[i].email);
      $( '#stillPlaying' + id).prop( 'checked', playerList[i].stillplaying);
      $( '#paid' + id).prop( 'checked', playerList[i].paid);
      $( '#club' + id).val(playerList[i].club);
      $( '#faction' + id).val(playerList[i].faction);
    };
    $( '#shortName' + id).val(playerList[i].short_name);
    $( '#shortNameHide' + id).text(playerList[i].short_name);
  };
  $( '#outstream' ).html( '' );
};

socket.on( 'pushAllPlayerDetails', function(playerList, instructions) {
  processPlayerList(playerList, instructions);
});

socket.on( 'pushAllTournamentInfo', function(playerList, infoTable, instructions) {
  if (infoTable) {
    systemObj = JSON.parse(infoTable.system_json);
    $( '#factionHeader' ).text(systemObj.faction_name);
  };
  if (playerList) {
    processPlayerList(playerList, instructions);
  };
});
