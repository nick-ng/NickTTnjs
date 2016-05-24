var tabIDList = [0];
var rowIDList = [[0]];
var tabs;

// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  common.getTournamentKey()
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loading tournament information.' );
    socket.emit( 'pullAllPlayerDetails', common.tournamentKey, 'rounddraw' );
  };
  tabs = $("#tabs").tabs();
}); // $(document).ready(function() {
