
// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  common.getTournamentKey()
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loaded ' + common.tournamentKey );
    //socket.emit( 'pullAllPlayerDetails', common.tournamentKey, 'rounddraw' );
  };
}); // $(document).ready(function() {

