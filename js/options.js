var shortenedNameButtonFunction = 'append';
var nicknameButtonFunction = 'append';

// ==============
// Document.Ready
// ==============
$( document ).ready(function() {
  getShortenNameRadioVal();
  getNicknameRadioVal();
  socket.emit( 'pullShortenedNames', 'optionsReady' );
  socket.emit( 'pullNicknames', 'optionsReady' );
  common.getTournamentKey(true)
  //setBulkTextAreaHints();
}); // $( document ).ready(function() {

function setBulkTextAreaHints() {
  var nickHint = 'Enter names in bulk as follows:\n"real name 1","nickname 1"\n"real name 2","nickname 2"\nwith a new pair on each line.';
  var shortHint = 'Enter names in bulk as follows:\n"long name 1","short name 1"\n"long name 2","short name 2"\nwith a new pair on each line.';
  $( '#nicknamesText' ).val
}

// Nickname controls
$('#nicknamesSingleForm').submit(function () {
  var newNickname = {};
  newNickname.real_name = $( '#nickRealName' ).val();
  newNickname.nickname = $( '#nickNickname' ).val();
  //var newNickname = {real_name: 'Nick Ng', nickname: 'Lead Dev.'};
  $('#nicknamesButton').prop( 'disabled', true );
  $('#nicknamesSingleButton').prop( 'disabled', true );
  socket.emit( 'addOneNickname', newNickname );
  return false;
});
// Nickname bulk controls
$('#nicknamesBulkForm').submit(function() {
  // Disable all buttons so the previous request doesn't get interrupted
  // Main script also blocks table access if table is being accessed by
  // another user or if two pages are open.
  $('#nicknamesButton').prop( 'disabled', true );
  $('#nicknamesSingleButton').prop( 'disabled', true );
  var tempText = $( '#nicknamesText' ).val();
  if ( nicknameButtonFunction == 'append' ) {
    //$( '#nicknamesButton' ).val( 'Append' );
    $( '#nicknamesOutstream' ).html( 'Appending nicknames' );
    socket.emit( 'appendNicknames', tempText );
  } else if (nicknameButtonFunction == 'replace') {
    //$( '#nicknamesButton' ).val( 'Replace' );
    $( '#nicknamesOutstream' ).html( 'Replacing nicknames' );
    socket.emit( 'replaceNicknames', tempText );
  } else if (nicknameButtonFunction == 'reset') {
    //$( '#nicknamesButton' ).val( 'Reset' );
    $( '#nicknamesOutstream' ).text( 'Resetting nicknames.' );
    //$( '#nicknamesTable' ).find('tr:gt(0)').remove();
    socket.emit( 'resetNicknames' );
  }
  return false;
});
$( "input[name=nicknamesRadio]:radio" ).change( function() {
  getNicknameRadioVal();
});
function getNicknameRadioVal() {
  nicknameButtonFunction = $( "input[name=nicknamesRadio]:checked" ).val();
  switch ( nicknameButtonFunction ) {
    case 'append':
      $( '#nicknamesButton' ).text( 'Append' );
      break;
    case 'replace':
      $( '#nicknamesButton' ).text( 'Replace' );
      break;
    case 'reset':
      $( '#nicknamesButton' ).text( 'Reset' );
      break;
    default:
      $( '#nicknamesButton' ).text( '???' );
      $( '#nicknamesOutstream' ).text( 'Something went wrong' );
  }
};

// Shortened name controls
$('#shortenedNamesSingleForm').submit(function () {
  var newShortenedName = {};
  newShortenedName.long_name = $( '#shortenedLongName' ).val();
  newShortenedName.shortened_name = $( '#shortenedShortName' ).val();
  //var newNickname = {real_name: 'Nick Ng', nickname: 'Lead Dev.'};
  $('#shortenedNamesButton').prop( 'disabled', true );
  $('#shortenedNamesSingleButton').prop( 'disabled', true );
  socket.emit( 'addOneShortenedName', newShortenedName );
  return false;
});
// Shortened name bulk controls
$('#shortenedNamesForm').submit(function() {
  $('#shortenedNamesButton').prop( 'disabled', true );
  $('#shortenedNamesSingleButton').prop( 'disabled', true );
  var tempText = $( '#shortenedNamesText' ).val();
  if ( shortenedNameButtonFunction == 'append' ) {
    $( '#shortenedNamesOutstream' ).html( 'Appending shortened names' );
    socket.emit( 'appendShortenedNames', tempText );
  } else if (shortenedNameButtonFunction == 'replace') {
    //$( '#shortenedNamesButton' ).val( 'Replace' );
    $( '#shortenedNamesOutstream' ).html( 'Replacing shortened names' );
    socket.emit( 'replaceShortenedNames' );
  } else if (shortenedNameButtonFunction == 'reset') {
    //$( '#shortenedNamesButton' ).val( 'Reset' );
    $( '#shortenedNamesOutstream' ).text( 'Resetting shortened names' );
    socket.emit( 'resetShortenedNames' );
  }
  return false;
});
$( "input[name=shortenedNamesRadio]:radio" ).change( function() {
  getShortenNameRadioVal();
});
function getShortenNameRadioVal() {
  shortenedNameButtonFunction = $( "input[name=shortenedNamesRadio]:checked" ).val();
  switch ( shortenedNameButtonFunction ) {
    case 'append':
      $( '#shortenedNamesButton' ).val( 'Append' );
      break;
    case 'replace':
      $( '#shortenedNamesButton' ).val( 'Replace' );
      break;
    case 'reset':
      $( '#shortenedNamesButton' ).val( 'Reset' );
      break;
    default:
      $( '#shortenedNamesButton' ).val( '???' );
      $( '#shortenedNamesOutstream' ).text( 'Something went wrong' );
  }
};

// Socket.IO events
socket.on( 'pushShortenedNames', function( shortenedNames, parent ) {
  // Any previous requests have been completed so enable the buttons.
  $('#shortenedNamesButton').prop( 'disabled', false );
  $('#shortenedNamesSingleButton').prop( 'disabled', false );
  if (parent == 'single') {
    // clear single name input boxes
    $( '#shortenedLongName' ).val('');
    $( '#shortenedShortName' ).val('');
  };
  if (parent = 'bulk') {
    // clear bulk box
  };
  // Remove existing table rows
  $( '#shortenedNamesTable tbody tr' ).remove();
  for ( var i = 0; i < shortenedNames.length; i++ ) {
    var tableRowContent = '<tr><td>' + shortenedNames[i]['long_name'] + '</td>' +
    '<td>' + shortenedNames[i]['shortened_name'] + '</td></tr>';
    $( '#shortenedNamesTable tbody' ).append( tableRowContent ); // Append a new row.
  };
});
socket.on( 'shortenedNamesTableLocked', function() {
  $('#shortenedNamesButton').prop( 'disabled', false );
  $('#shortenedNamesSingleButton').prop( 'disabled', false );
  alert('Shortened names list is currently in use. Try again.');
});
socket.on( 'shortenedNamesTableUnlocked', function() {
  $('#shortenedNamesButton').prop( 'disabled', false );
  $('#shortenedNamesSingleButton').prop( 'disabled', false );
});
socket.on( 'shortenedNameOutstream', function( displayString ) {
  $( '#shortenedNamesOutstream' ).html( displayString );
});

socket.on( 'pushNicknames', function( nicknames, parent ) {
  // Any previous requests have been completed so enable the buttons.
  $('#nicknamesButton').prop( 'disabled', false );
  $('#nicknamesSingleButton').prop( 'disabled', false );
  if (parent == 'single') {
    // clear single name input boxes
    $( '#nickRealName' ).val('');
    $( '#nickNickname' ).val('');
  };
  if (parent = 'bulk') {
    // clear bulk box
  };
  // Remove existing table rows
  $( '#nicknamesTable tbody tr' ).remove();
  for ( var i = 0; i < nicknames.length; i++ ) {
    var tableRowContent = '<tr><td>' + nicknames[i]['real_name'] + '</td>' +
    '<td>' + nicknames[i]['nickname'] + '</td></tr>';
    $( '#nicknamesTable tbody' ).append( tableRowContent ); // Append a new row.
  };
});
socket.on( 'nicknamesTableLocked', function() {
  $('#nicknamesButton').prop( 'disabled', false );
  $('#nicknamesSingleButton').prop( 'disabled', false );
  alert('Nickname list is currently in use. Try again.');
});
socket.on( 'nicknamesTableUnlocked', function() {
  $('#nicknamesButton').prop( 'disabled', false );
  $('#nicknamesSingleButton').prop( 'disabled', false );
});
socket.on( 'nicknameOutstream', function( displayString ) {
  $( '#nicknamesOutstream' ).html( displayString );
});
