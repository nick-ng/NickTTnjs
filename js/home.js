var bgLight = '#eee';
var bgDark = '#ccc';
var socket = io();



$(document).ready(function() {
  // Make dialogs.
  $( '#newTournamentDialog' ).dialog({
    autoOpen: false,
    resizable: false,
    //height: 140,
    width: 400,
    modal: true,
    buttons: {
      'Create': function() {
        console.log('Getting a new tournament-key');
        console.log('Redirecting to player details page');
        //<div id="newTournamentDialog" title="Create a new tournament?">
        $( this ).dialog( 'option', 'title', 'Creating new tournament...' );
        $( this ).html( '<p>Please wait</p>' );
      },
      'Cancel': function() {
        $( this ).dialog( 'close' );
      }
    }
  });
  
}); // $( document ).ready(function() {

$( '#newTournamentButton' ).click(function() {
  $( '#newTournamentDialog' ).dialog( 'open' );
});
