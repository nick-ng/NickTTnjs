var bgLight = '#eee';
var bgDark = '#ccc';
var socket = io();

// ==============
// Document.Ready
// ==============
$( document ).ready(function() {
  addPlayerRow();
}); // $( document ).ready(function() {

$('#addPlayerButton').click(function() {
  addPlayerRow();
});
  
function addPlayerRow() {
  //Get number of rows already in the table.
  var rowProperties = $('#tbl').prop('rows');
  var rowCount = rowProperties.length; // Can be combined into one line but having it like this so I know later.
  var newID = rowCount; // There will be one more row than there are players because of the header row.
  // The row's contents
  var tableRowContent = '<tr id="playerRow' + newID + '">' +
    '<td style="text-align: right;">' + newID + '</td>' +
    '<td><input type="text" id="fullName' + newID + '" /></td>' +
    '<td><input type="text" id="playerEmail' + newID + '" /></td>' +
    '<td><input type="text" id="shortName' + newID + '" /></td>' +
    '<td style="text-align: center;"><input type="checkbox" unchecked id="stillPlaying' + newID + '" /></td>' +
    '<td style="text-align: center;"><input type="checkbox" unchecked id="paid' + newID + '" /></td>' +
    '<td><input type="text" id="club' + newID + '" /></td>' +
    '<td><input type="text" id="faction' + newID + '" /></td></tr>'
  // id's of inputs: ['playerRow', 'stillPlaying', 'fullName', 'playerEmail', 'shortName', 'club', 'team'];
  // playerRow
  // stillPlaying
  // fullName
  // playerEmail
  // shortName
  // club
  // team
  
  $( '#tbl tr:last' ).after( tableRowContent ); // Append a new row.
  
  // Set up events for cells.
  $( '#fullName' + newID ).focusout( function() {
    var fullName = $( '#fullName' + newID ).val();
    if ( fullName.length > 0 ) { // If they've entered a full name
      var shortName = $( '#shortName' + newID ).val();
      var player = {};
      player.ID = newID;
      player.fullName = fullName;
      //player.email = playerEmail;
      //player.shortNames = [shortName1,shortName2,etc.];
      player.shortName = shortName;
      //player.stillPlaying = true;
      //player.paid = false;
      //player.club = club;
      //player.faction = faction;
      socket.emit( 'fullName focusout', player );
    }
    return false;
  });
  
  
  fixRowColours()
  showAllRows()
  // Count rows / players
  rowCount = rowProperties = $('#tbl').prop('rows').length;
  //$('#outstream').text('There are ' + rowCount + ' rows');
  
  var playerCount = rowCount - 1;
  return playerCount; // Return player count in case we need it later.
}

$('#hideEmptyButton').click(function() {
  hideEmptyRows();
});

function hideEmptyRows() {
  var rowCount = $('#tbl').prop('rows').length; // I feel like I store the value somewhere rather than invoking this everytime.
  var inputIds = ['givenName', 'familyName', 'shortName', 'club', 'team'];
  var bgColourToggler = 1; // 1 = light, 0 = dark.
  for (var i = 1; i < rowCount; i++) {
    var wholeString = ''
    for (var j = 0; j < inputIds.length; j++) {
      wholeString = wholeString + $('#' + inputIds[j] + i).val();
    }
    var trimString = $.trim(wholeString);
    //console.log('' + i + ': ' + wholeString);
    if (trimString == "") { // If none of the cells contain characters (except for white space)...
      //console.log('There is nothing of value in that row');
      $('#playerRow' + i).hide(); // remove empty row.
    }
  }
  fixRowColours()
  $('#showEmptyButton').show()
  $('#hideEmptyButton').hide()
  $('#addPlayerButton').hide()
}

$('#showEmptyButton').click(function() {
  showAllRows();
});

function showAllRows() {
  var rowCount = $('#tbl').prop('rows').length; // I feel like I should store the value somewhere rather than invoking this everytime.
  for (var i = 1; i < rowCount; i++) {
    $('#playerRow' + i).show(); // show row.
  }
  fixRowColours()
  $('#showEmptyButton').hide()
  $('#addPlayerButton').show()
  $('#hideEmptyButton').show()
}

function fixRowColours() {
  // Adjust background colour of rows.
  var bgColourToggler = 1; // 1 = light, 0 = dark.
  var rowCount = $('#tbl').prop('rows').length;
  for (var i = 1; i < rowCount; i++) {
    if ($( '#playerRow' + i ).is(":visible")) {
      if (bgColourToggler == 1) {
        $( '#playerRow' + i ).css( "background-color", bgLight );
        bgColourToggler = 0;
      } else {
        $( '#playerRow' + i ).css( "background-color", bgDark );
        bgColourToggler = 1;
      }
    }
  }
}

socket.on( 'shortName change', function(playerList){
  //console.log( shortName );
  for (var i = 0; i < playerList.length; i++ ) {
    player = playerList[i];
    $( '#shortName' + player.ID ).val( player.shortName );
    $( '#stillPlaying' + player.ID ).attr( 'checked', true );
  };
});
