var bgLight = '#eee';
var bgDark = '#ccc';
var socket = io();

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
}); // $( document ).ready(function() {

// Nickname controls
$('#nicknamesSingleButton').click(function () {
  var newNickname = {};
  newNickname.real_name = $( '#nickRealName' ).val();
  newNickname.nickname = $( '#nickNickname' ).val();
  //var newNickname = {real_name: 'Nick Ng', nickname: 'Lead Dev.'};
  $('#nicknamesButton').prop( 'disabled', true );
  $('#nicknamesSingleButton').prop( 'disabled', true );
  socket.emit( 'addOneNickname', newNickname );
});
// Nickname bulk controls
$('#nicknamesButton').click(function() {
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
    $( '#nicknamesTable' ).find('tr:gt(0)').remove();
    socket.emit( 'resetNicknames' );
  }
});
$( "input[name=nicknamesRadio]:radio" ).change( function() {
  getNicknameRadioVal();
});
function getNicknameRadioVal() {
  nicknameButtonFunction = $( "input[name=nicknamesRadio]:checked" ).val();
  switch ( nicknameButtonFunction ) {
    case 'append':
      $( '#nicknamesButton' ).val( 'Append' );
      break;
    case 'replace':
      $( '#nicknamesButton' ).val( 'Replace' );
      break;
    case 'reset':
      $( '#nicknamesButton' ).val( 'Reset' );
      break;
    default:
      $( '#nicknamesButton' ).val( '???' );
      $( '#nicknamesOutstream' ).text( 'Something went wrong' );
  }
};

// Shortened name bulk controls
$('#shortenedNamesButton').click(function() {
  var tempText = $( '#shortenedNamesText' ).val();
  if ( shortenedNameButtonFunction == 'append' ) {
    $( '#shortenedNamesOutstream' ).html( 'Appending shortened names' );
    socket.emit( 'appendShortenedNames', tempText );
  } else if (shortenedNameButtonFunction == 'replace') {
    $( '#shortenedNamesButton' ).val( 'Replace' );
    $( '#shortenedNamesOutstream' ).html( 'Replaced short names:<br>' + tempText );
  } else if (shortenedNameButtonFunction == 'reset') {
    $( '#shortenedNamesButton' ).val( 'Reset' );
    $( '#shortenedNamesOutstream' ).text( 'Reset short names.' );
  }
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
socket.on( 'pushShortenedNames', function( shortenedNames ) {
  // Any previous requests have been completed so enable the buttons.
  $('#shortenedNamesButton').prop( 'disabled', false );
  $('#shortenedNamesSingleButton').prop( 'disabled', false );
  // Remove existing table rows
  $( '#shortenedNamesTable' ).find('tr:gt(0)').remove();
  for ( var i = 0; i < shortenedNames.length; i++ ) {
    var tableRowContent = '<tr><td>' + shortenedNames[i]['long_name'] + '</td>' +
    '<td>' + shortenedNames[i]['shortened_name'] + '</td></tr>';
    $( '#shortenedNamesTable tr:last' ).after( tableRowContent ); // Append a new row.
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
  $( '#nicknamesTable' ).find('tr:gt(0)').remove();
  for ( var i = 0; i < nicknames.length; i++ ) {
    var tableRowContent = '<tr><td>' + nicknames[i]['real_name'] + '</td>' +
    '<td>' + nicknames[i]['nickname'] + '</td></tr>';
    $( '#nicknamesTable tr:last' ).after( tableRowContent ); // Append a new row.
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
