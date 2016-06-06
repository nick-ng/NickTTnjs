var rowIDList = [0];

// ==============
// Document.Ready
// ==============
$( document ).ready(function() {
  addPlayerRow();
  common.getTournamentKey();
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading players. Please wait.');
    socket.emit( 'pullAllPlayerDetails', common.tournamentKey );
  };
}); // $( document ).ready(function() {

$('#addPlayerButton').click(function() {
  addPlayerRow();
});
  
function addPlayerRow(customID, source) {
  //Get number of rows already in the table.
  var rowProperties = $('#tbl').prop('rows');
  //var rowCount = rowProperties.length; // Can be combined into one line but having it like this so I know later.
  //var newID = customID || rowCount; // There will be one more row than there are players because of the header row.
  var autoID = Math.max(...rowIDList) + 1;
  var newID = customID || autoID;
  rowIDList.push(newID);
  // The row's contents
  var tableRowContent = '<tr id="playerRow' + newID + '">' +
    '<td class="text-right v-mid">' + newID + '</td>' +
    '<td class="v-mid"><input type="text" id="fullName' + newID + '" class="form-control" /></td>' +
    '<td class="v-mid"><input type="text" id="playerEmail' + newID + '" class="form-control" /></td>' +
    '<td class="v-mid"><input type="text" id="shortName' + newID + '" class="form-control" /><span class="hidden" id="shortNameHide' + newID + '"></span></td>' +
    '<td class="text-center v-mid"><input type="checkbox" unchecked id="stillPlaying' + newID + '" class="form-control" /></td>' +
    '<td class="text-center v-mid"><input type="checkbox" unchecked id="paid' + newID + '" class="form-control" /></td>' +
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
  
  $( '#tbl tbody' ).append( tableRowContent ); // Append a new row.
  
  // Set up events for cells.
  $( '#fullName' + newID ).focusout( function() {
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
    socket.emit( 'playerDetailsChanged', updateObject );
    autoStillPlaying(updateObject.value, newID);
    return false;
  });
  
  $( '#playerEmail' + newID ).focusout( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'email';
    updateObject.value = $(this).val();
    socket.emit( 'playerDetailsChanged', updateObject );
    return false;
  });
  
  $( '#shortName' + newID ).focusout( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'short_name';
    updateObject.value = common.removeWhiteSpace( $(this).val());
    if (common.removeWhiteSpace( $( '#shortNameHide' + newID).text()) != updateObject.value) {
      // User has entered a custom short name so store it on DB.
      socket.emit( 'playerDetailsChanged', updateObject );
    };
    return false;
  });
  
  $( '#stillPlaying' + newID ).change( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'stillplaying';
    updateObject.value = $(this).prop( 'checked' );
    socket.emit( 'playerDetailsChanged', updateObject );
    return false;
  });
  
  $( '#paid' + newID ).change( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'paid';
    updateObject.value = $(this).prop( 'checked' );
    socket.emit( 'playerDetailsChanged', updateObject );
    return false;
  });
  
  $( '#club' + newID ).focusout( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'club';
    updateObject.value = $(this).val();
    socket.emit( 'playerDetailsChanged', updateObject );
    return false;
  });
  
  $( '#faction' + newID ).focusout( function() {
    var updateObject = {tKey:common.tournamentKey, id:newID};
    updateObject.field = 'faction';
    updateObject.value = $(this).val();
    socket.emit( 'playerDetailsChanged', updateObject );
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
  
  showAllRows() // also fixRowColours()
  if (source == 'autoTab') {
    //set focus
    $( '#fullName' + newID ).focus();
  };
  // Count rows / players
  //rowCount = rowProperties = $('#tbl').prop('rows').length;
  //$('#outstream').text('There are ' + rowCount + ' rows');
  
  //var playerCount = rowCount - 1;
  //return playerCount; // Return player count in case we need it later.
  return 0;
};

$('#hideEmptyButton').click(function() {
  hideEmptyRows();
});

function autoStillPlaying(value, id) {
  if (common.removeWhiteSpace(value)) {
    var updateObject = {tKey:common.tournamentKey, id:id};
    updateObject.field = 'stillplaying';
    updateObject.value = true;
    $( '#stillPlaying' + id).prop( 'checked', true );
    socket.emit( 'playerDetailsChanged', updateObject );
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
  //~ fixRowColours()
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
  //~ fixRowColours()
  $('#showEmptyButton').hide()
  $('#addPlayerButton').show()
  $('#hideEmptyButton').show()
}

function fixRowColours() {
  // Adjust background colour of rows.
  var bgColourToggler = 1; // 1 = light, 0 = dark.
  //var rowCount = $('#tbl').prop('rows').length;
  for (var i = 0; i < rowIDList.length; i++) {
    if ($( '#playerRow' + rowIDList[i] ).is(":visible")) {
      if (bgColourToggler == 1) {
        $( '#playerRow' + rowIDList[i] ).css( "background-color", common.bgLight );
        bgColourToggler = 0;
      } else {
        $( '#playerRow' + rowIDList[i] ).css( "background-color", common.bgDark );
        bgColourToggler = 1;
      }
    }
  }
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

socket.on( 'pushAllPlayerDetails', function(playerList, instructions) {
  //console.log(playerList);
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
    }
    $( '#shortName' + id).val(playerList[i].short_name);
    $( '#shortNameHide' + id).text(playerList[i].short_name);
  };
  $( '#outstream' ).html( '' );
});
