var bgLight = '#eee';
var bgDark = '#ccc';
var socket = io();

var shortenNameButtonFunction = 'append';

// ==============
// Document.Ready
// ==============
$( document ).ready(function() {
  getShortenNameRadioVal()
}); // $( document ).ready(function() {

$('#shortenNamesButton').click(function() {
  var tempText = $( '#shortenNamesText' ).val();
  if ( shortenNameButtonFunction == 'append' ) {
    $( '#shortenNamesButton' ).val( 'Append' );
    //~ $( '#shortenNamesText' ).val( '' );
    $( '#shortenNamesOutstream' ).text( 'Appended short names:' + tempText );
  } else if (shortenNameButtonFunction == 'replace') {
    $( '#shortenNamesButton' ).val( 'Replace' );
    //~ $( '#shortenNamesText' ).val( '' );
    $( '#shortenNamesOutstream' ).text( 'Replaced short names:' + tempText );
  } else if (shortenNameButtonFunction == 'reset') {
    $( '#shortenNamesButton' ).val( 'Reset' );
    //~ $( '#shortenNamesText' ).val( '' );
    $( '#shortenNamesOutstream' ).text( 'Reset short names:' + tempText );
  }
});


$( "input[name=shortenNamesRadio]:radio" ).change( function() {
  getShortenNameRadioVal();
});

function getShortenNameRadioVal() {
  shortenNameButtonFunction = $( "input[name=shortenNamesRadio]:checked" ).val();
  $( '#shortenNamesOutstream' ).text( '' );
  //~ console.log('shortenNameButtonFunction');
  //~ console.log($( "input[name=shortenNamesRadio]:checked" ).val());
  //~ console.log(shortenNameButtonFunction);
  switch ( shortenNameButtonFunction ) {
    case 'append':
      $( '#shortenNamesButton' ).val( 'Append' );
      break;
    case 'replace':
      $( '#shortenNamesButton' ).val( 'Replace' );
      break;
    case 'reset':
      $( '#shortenNamesButton' ).val( 'Reset' );
      break;
    default:
      $( '#shortenNamesButton' ).val( '???' );
      $( '#shortenNamesOutstream' ).text( 'Something went wrong' );
  }
  //~ if ( shortenNameButtonFunction == 'append') {
    //~ $( '#shortenNamesButton' ).val( 'Append' );
  //~ } else if ( shortenNameButtonFunction == 'replace') {
    //~ $( '#shortenNamesButton' ).val( 'Replace' );
  //~ } else if ( $( "input[name=shortenNamesRadio]:checked" ).val() == 'reset') {
    //~ $( '#shortenNamesButton' ).val( 'Reset' );
  //~ };
};
