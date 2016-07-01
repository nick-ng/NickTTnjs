var socket = io();
var displayObj;
var systemObj;
var infoTable;
var originalDate;
var inputFieldList = [
  '#tournamentName',
  '#tournamentDate',
  '#tournamentSystem',
  '#leftImageURL',
  '#rightImageURL'];
//var allSelectList = [ '#dickbuttURL', '#dogeURL', '#pepeURL' ];
var allSelectList = [ 'input' ];

// Figure out a better way to do this
var GAME_SYSTEM_OBJECTS = {};
// Guild Ball
var guildBallObj = {};
guildBallObj.name = 'Guild Ball';
guildBallObj.tiebreaks = ['Goals','Body<br>Count','Total VPs'];
guildBallObj.faction_name = 'Guild';
guildBallObj.slug = 'guildball';
GAME_SYSTEM_OBJECTS[guildBallObj.slug] = guildBallObj;
var otherSystemObj = {};
otherSystemObj.name = 'Other';
otherSystemObj.faction_name = 'Faction';
otherSystemObj.slug = 'other';
GAME_SYSTEM_OBJECTS[otherSystemObj.slug] = otherSystemObj;

// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  common.getTournamentKey(false, true)
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading tournament information.' );
    socket.emit( 'pullAllTournamentInfo', common.tournamentKey, 'misc' );
  };
  common.setSelectOnClick(allSelectList);
}); // $(document).ready(function() {

$( '#tournamentDetailsForm' ).submit(function() {
  if ($( '#tournamentName' ).val() != infoTable.name) {
    socket.emit( 'updateTournamentDetails', common.tournamentKey, 'infoTable.name', $( '#tournamentName' ).val());
  };
  if ($( '#tournamentDate' ).datepicker( 'getDate' ) != originalDate) {
    socket.emit( 'updateTournamentDetails', common.tournamentKey, 'infoTable.date', $( '#tournamentDate' ).val());
  }
  if ($( '#tournamentSystem' ).val() != systemObj.name) {
    systemObj = common.chooseSystemObject($( '#tournamentSystem' ).val())
    socket.emit( 'updateTournamentDetails', common.tournamentKey, 'systemObj.name', systemObj);
  }
  if ($( '#leftImageURL' ).val() != displayObj.left_image_url) {
    socket.emit( 'updateTournamentDetails', common.tournamentKey, 'displayObj.left_image_url', $( '#leftImageURL' ).val());
  }
  if ($( '#rightImageURL' ).val() != displayObj.right_image_url) {
    socket.emit( 'updateTournamentDetails', common.tournamentKey, 'displayObj.right_image_url', $( '#rightImageURL' ).val());
  }
  return false;
});

$( '#detailsRevertButton' ).click(function() {
  fieldsFromObj();
  return
});

$( '#exampleURLsButton' ).click(function() {
  if ($( '#exampleURLs' ).hasClass( 'hidden' )) {
    $( '#exampleURLs' ).removeClass( 'hidden' );
    $( '#exampleURLsButton' ).text( 'Hide Example Image URLs' );
  } else {
    $( '#exampleURLs' ).addClass( 'hidden' );
    $( '#exampleURLsButton' ).text( 'Show Example Image URLs' );
  }
});

$( '#leftImageURL' ).blur(function() {
  updateImages();
});

$( '#rightImageURL' ).blur(function() {
  updateImages();
});

function updateImages() {
  var leftURL = $( '#leftImageURL' ).val();
  if (common.urlIsSafe(leftURL)) {
    if (leftURL.length > 1) {
      $( '#leftImageDiv' ).html('<img class="img-responsive center-block" src="' + leftURL + '"><h4 class="text-center">Left Image</h4>');
    } else {
      $( '#leftImageDiv' ).html( '' );
    };
  };
  var rightURL = $( '#rightImageURL' ).val();
  if (common.urlIsSafe(rightURL)) {
    if (rightURL.length > 1) {
      $( '#rightImageDiv' ).html('<img class="img-responsive center-block" src="' + rightURL + '"><h4 class="text-center">Right Image</h4>');
    } else {
      $( '#rightImageDiv' ).html( '' );
    };
  };
}

common.urlIsSafe

function fieldsFromObj() {
  $( '#tournamentName' ).val(infoTable.name);
  $( '#tournamentDate' ).datepicker( 'update', infoTable.date);
  originalDate = $( '#tournamentDate' ).datepicker( 'getDate' );
  $( '#tournamentSystem' ).val(systemObj.name);
  $( '#leftImageURL' ).val(displayObj.left_image_url);
  $( '#rightImageURL' ).val(displayObj.right_image_url);
};

$( '#tournamentDate' ).datepicker({
  format: "d-M-yyyy",
  todayBtn: true,
  language: "en-GB",
  autoclose: true
});

socket.on( 'pushAllTournamentInfo', function(playerList, infoTableIn, instructions) {
  if (infoTableIn) {
    infoTable = infoTableIn;
    displayObj = JSON.parse(infoTable.display_json);
    systemObj = JSON.parse(infoTable.system_json);
    fieldsFromObj();
    updateImages()
  }
  $( '#outstream' ).html( '' );
  $( '#allPageContent' ).removeClass( 'hidden' );
});
