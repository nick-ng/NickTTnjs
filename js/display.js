
// ==============
// Document.Ready
// ==============
$(document).ready(function() {
  common.getTournamentKey(false, true)
  if (common.tournamentKey) {
    $( '#outstream' ).html( 'Loaded tournament' );// + common.tournamentKey );
    $.get( './display', {key:common.tournamentKey}, function(data) {
      if (data.content) {
        updateDisplay(data)
      };
    });
  };
}); // $(document).ready(function() {

socket.on( 'displayThisPlease', updateDisplay);

function updateDisplay(displayData) {
  var imgWidth = Math.floor(window.innerWidth * 0.2);
  if (typeof displayData.announcement != 'undefined') {
    $( '#announcement' ).text(displayData.announcement);
  };
  if (typeof displayData.content != 'undefined') {
    $( '#displayContent' ).html(displayData.content);
  };
  if (common.urlIsSafe(displayData.left_image_url)) {
    if (displayData.left_image_url.length > 1) {
      $( '#leftImageDiv' ).html( '<img src="' + displayData.left_image_url + '" class="img-responsive pull-right">' );
    } else {
      $( '#leftImageDiv' ).html( '' );
    };
  };
  var rightURL = displayData.right_image_url || displayData.left_image_url;
  //console.log('right = ' + rightURL);
  if (common.urlIsSafe(rightURL)) {
    if (rightURL.length > 1) {
      $( '#rightImageDiv' ).html( '<img src="' + rightURL + '" class="img-responsive pull-left">' );
    } else {
      $( '#rightImageDiv' ).html( '' );
    };
  };
  $( '#outstream' ).html( '' );
};
