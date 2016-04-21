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
  socket.emit( 'pullShortenedNames' );
  socket.emit( 'pullNicknames' );
}); // $( document ).ready(function() {

// Nickname bulk controls
$('#nicknamesButton').click(function() {
  var tempText = $( '#nicknamesText' ).val();
  if ( shortenedNameButtonFunction == 'append' ) {
    $( '#nicknamesButton' ).val( 'Append' );
    $( '#nicknamesOutstream' ).html( 'Appended nicknames:<br>' + tempText );
  } else if (shortenedNameButtonFunction == 'replace') {
    $( '#nicknamesButton' ).val( 'Replace' );
    $( '#nicknamesOutstream' ).html( 'Replaced nicknames:<br>' + tempText );
  } else if (shortenedNameButtonFunction == 'reset') {
    $( '#nicknamesButton' ).val( 'Reset' );
    $( '#nicknamesOutstream' ).text( 'Reset nicknames.' );
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
    $( '#shortenedNamesButton' ).val( 'Append' );
    $( '#shortenedNamesOutstream' ).html( 'Appended short names:<br>' + tempText );
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
  // Remove existing table rows
  $( '#shortenedNamesTable' ).find('tr:gt(0)').remove();
  for ( var i = 0; i < shortenedNames.length; i++ ) {
    var tableRowContent = '<tr><td>' + shortenedNames[i]['longName'] + '</td>' +
    '<td>' + shortenedNames[i]['shortName'] + '</td></tr>';
    $( '#shortenedNamesTable tr:last' ).after( tableRowContent ); // Append a new row.
  };
});
socket.on( 'pushNicknames', function( nicknames ) {
  // Remove existing table rows
  $( '#nicknamesTable' ).find('tr:gt(0)').remove();
  for ( var i = 0; i < nicknames.length; i++ ) {
    var tableRowContent = '<tr><td>' + nicknames[i]['realName'] + '</td>' +
    '<td>' + nicknames[i]['nickname'] + '</td></tr>';
    $( '#nicknamesTable tr:last' ).after( tableRowContent ); // Append a new row.
  };
});
