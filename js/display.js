
// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  common.getTournamentKey(false, true)
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loaded tournament' );// + common.tournamentKey );
    //socket.emit( 'pullAllPlayerDetails', common.tournamentKey, 'rounddraw' );
  };
}); // $(document).ready(function() {

socket.on( 'displayThisPlease', function(displayData) {
  var imgWidth = Math.floor(window.innerWidth * 0.2);
  if (typeof displayData.announcement != 'undefined') {
    $( '#announcement' ).text(displayData.announcement);
  };
  if (typeof displayData.content != 'undefined') {
    $( '#displayContent' ).html(displayData.content);
  };
  //console.log(displayData.leftURL);
  if (typeof displayData.leftURL != 'undefined') {
    if (displayData.leftURL.length > 1) {
      $( '#leftImageDiv' ).html( '<img src="' + displayData.leftURL + '" class="img-responsive pull-right">' );
    } else {
      $( '#leftImageDiv' ).html( '' );
    };
  };
  var rightURL = displayData.rightURL || displayData.leftURL;
  //console.log('right = ' + rightURL);
  if (typeof rightURL != 'undefined') {
    if (rightURL.length > 1) {
      $( '#rightImageDiv' ).html( '<img src="' + rightURL + '" class="img-responsive pull-left">' );
    } else {
      $( '#rightImageDiv' ).html( '' );
    };
  };
  $( '#outstream' ).html( '' );
});

