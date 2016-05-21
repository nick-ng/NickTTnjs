// Common variables
var socket = io();
var common = {};
common.bgLight = '#eee';
common.bgDark = '#ccc';
common.cookieExpiry = 100; // 100 days

common.setTournamentKey = function (tournamentKey) {
  common.tournamentKey = tournamentKey;
  $.cookie( 'nicktt_currenttournament', tournamentKey, { expires: common.cookieExpiry, path: '/' });
  $( '#tournamentKeyDisplay' ).text('Tournament-Key: ' + common.tournamentKey);
};

common.getTournamentKey = function (getOnly) {
  getOnly = getOnly || false;
  common.tournamentKey = $.cookie( 'nicktt_currenttournament' );
  if (common.tournamentKey) {
    // Refresh tournamentKey expiry and display.
    common.setTournamentKey(common.tournamentKey);
  } else if (!getOnly) {
    socket.emit( 'pullTournamentKey', 'new' );
  };
};

common.removeWhiteSpace = function (someString) {
  // Replace multiple spaces with one, REMOVE leading and trailing spaces.
  return someString.replace( /[\s\n\r]+/g, ' ' ).replace( /^\s|\s$/g, '' );
  // This matches leading and trailing spaces of any number /^\s+|\s+$/g
};