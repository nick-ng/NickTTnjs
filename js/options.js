var bgLight = '#eee';
var bgDark = '#ccc';
var socket = io();

var shortenedNameButtonFunction = 'append';

// ==============
// Document.Ready
// ==============
$( document ).ready(function() {
  getShortenNameRadioVal()
}); // $( document ).ready(function() {

$('#shortenedNamesButton').click(function() {
  var tempText = $( '#shortenedNamesText' ).val();
  if ( shortenedNameButtonFunction == 'append' ) {
    $( '#shortenedNamesButton' ).val( 'Append' );
    //~ $( '#shortenedNamesText' ).val( '' );
    $( '#shortenedNamesOutstream' ).html( 'Appended short names:<br>' + tempText );
  } else if (shortenedNameButtonFunction == 'replace') {
    $( '#shortenedNamesButton' ).val( 'Replace' );
    //~ $( '#shortenedNamesText' ).val( '' );
    $( '#shortenedNamesOutstream' ).html( 'Replaced short names:<br>' + tempText );
  } else if (shortenedNameButtonFunction == 'reset') {
    $( '#shortenedNamesButton' ).val( 'Reset' );
    //~ $( '#shortenedNamesText' ).val( '' );
    $( '#shortenedNamesOutstream' ).text( 'Reset short names.' );
  }
});


$( "input[name=shortenedNamesRadio]:radio" ).change( function() {
  getShortenNameRadioVal();
});

function getShortenNameRadioVal() {
  shortenedNameButtonFunction = $( "input[name=shortenedNamesRadio]:checked" ).val();
  $( '#shortenedNamesOutstream' ).text( '' );
  //~ console.log('shortenedNameButtonFunction');
  //~ console.log($( "input[name=shortenedNamesRadio]:checked" ).val());
  //~ console.log(shortenedNameButtonFunction);
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
  //~ if ( shortenedNameButtonFunction == 'append') {
    //~ $( '#shortenedNamesButton' ).val( 'Append' );
  //~ } else if ( shortenedNameButtonFunction == 'replace') {
    //~ $( '#shortenedNamesButton' ).val( 'Replace' );
  //~ } else if ( $( "input[name=shortenedNamesRadio]:checked" ).val() == 'reset') {
    //~ $( '#shortenedNamesButton' ).val( 'Reset' );
  //~ };
};
