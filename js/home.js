var GAME_SYSTEM_OBJECTS = {};
// Guild Ball
var guildBallObj = {
  name: 'Guild Ball',
  tiebreaks: ['Goals','Body<br>Count','Total VPs'],
  playervotes: ['Best Goal Design','Best Painted Team'],
  faction_name: 'Guild',
  slug: 'guildball'
};
GAME_SYSTEM_OBJECTS[guildBallObj.slug] = guildBallObj;
var otherSystemObj = {};
otherSystemObj.name = 'Other';
otherSystemObj.faction_name = 'Faction';
otherSystemObj.slug = 'other';
GAME_SYSTEM_OBJECTS[otherSystemObj.slug] = otherSystemObj;

// home.js
$(document).ready(function() {
  // Other stuff
  common.getTournamentKey(true, false);
  if (common.tournamentKey) {
    $( '#currentTournamentInfo' ).html( '<p class="mini-h">Tournament ' + common.tournamentKey + ' currently loaded.</p>' );
  };
}); // $( document ).ready(function() {

$( '#createNewTournamentForm' ).submit(function() {
  console.log('Getting a new tournament-key');
  var tournamentObj = {};
  tournamentObj.tournamentName = $( '#newTournamentName' ).val();
  //console.log('Tournament Name ' + newTournamentName);
  tournamentObj.tournamentDate = $( '#newTournamentDate' ).val();
  //console.log('Tournament Date ' + newTournamentDate);
  tournamentObj.sytemObj = common.chooseSystemObject($( '#newTournamentSystem' ).val());
  socket.emit( 'pullTournamentKey', 'new', tournamentObj);
  //<div id="newTournamentDialog" title="Create a new tournament?">
  $( '#newTournamentDialogTitle' ).text( 'Creating new tournament...' );
  $( '#newTournamentDialogBody' ).html( '<p>Please wait.</p>' );
  return false;
});

function handleLoadTournament() {
  homeLoadTournament();
}

$( '#loadTournamentForm' ).submit(function() {
  homeLoadTournament();
  return false;
});

$('#loadTournamentDialog').on('shown.bs.modal', function () {
  $('#loadTournamentKey').focus()
})

$( '#loadTournamentButton' ).click(function() {
  homeLoadTournament();

});

$( '#demoTournamentButton' ).click(function() {
  $( '#demoTournamentDialog' ).dialog( 'open' );
});

$( '#dialogLoadButton' ).click(function() {
  homeLoadTournament();
});

$( '#newTournamentDate' ).datepicker({
    format: "d-M-yyyy",
    startDate: "today",
    todayBtn: true,
    language: "en-GB",
    autoclose: true
});

function homeLoadTournament(tournamentKey) {
  if (tournamentKey) {
    common.setTournamentKey(tournamentKey);
    window.location.href = './playerdetails';
    $( '#loadTournamentDialog' ).dialog( 'option', 'title', 'Redirecting...' );
    dialogText2 = '</p><p>If you aren\'t redirected, click <a href="./playerdetails">here</a> to continue.</p>';
    $( '#loadTournamentDialog' ).html( '<p>Loaded tournament-key: ' + common.tournamentKey + dialogText2);
  } else {
    // Send key to be validated
    tempTournamentKey = $( '#loadTournamentKey' ).val();
    $( '#loadWarning' ).html('Checking ' + tempTournamentKey);
    console.log('Validating ' + tempTournamentKey );
    socket.emit( 'checkTournamentKey', tempTournamentKey );
  };
};

socket.on( 'pushTournamentKey', function( tournamentKey ) {
  console.log( 'Received ' + tournamentKey );
  common.setTournamentKey(tournamentKey);
  console.log( 'Tournament-key stored in cookie nicktt_currenttournament' );
  console.log('Redirecting to player details page');
  window.location.href = './playerdetails';
  // Change "new" dialog
  $( '#newTournamentDialogTitle' ).text( 'Redirecting...' );
  dialogText2 = '</p><p>If you aren\'t redirected, click <a href="./playerdetails">here</a> to continue.</p>';
  $( '#newTournamentDialogBody' ).html( '<p>New tournament-key: ' + common.tournamentKey + dialogText2);
  // Change "load" dialog
  $( '#loadTournamentDialogTitle' ).text( 'Redirecting...' );
  dialogText = '</p><p>Tournament loaded. If you aren\'t redirected, click <a href="./playerdetails">here</a> to continue.</p>';
  $( '#loadTournamentDialogBody' ).html(dialogText);
  // Change "demo" dialog
  $( '#loadTournamentDialogTitle' ).text( 'Redirecting...' );
  dialogText = '</p><p>Demo tournament loaded. If you aren\'t redirected, click <a href="./playerdetails">here</a> to continue.</p>';
  $( '#demoTournamentDialogBody' ).html(dialogText);
});

socket.on( 'homeError', function(errorMsg) {
  $( '#newTournamentDialog' ).html( '<p>' + errorMsg + '</p>' );
  $( '#loadWarning' ).html(errorMsg);
  $( '#demoTournamentDialog' ).html( '<p>' + errorMsg + '</p>' );
});
