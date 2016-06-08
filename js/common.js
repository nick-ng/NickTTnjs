// Common variables
var socket = io();
var common = {};
common.bgLight = '#eee';
common.bgDark = '#ccc';
common.cookieExpiry = 100; // 100 days

// Common functions
common.setTournamentKey = function (tournamentKey) {
  common.tournamentKey = tournamentKey;
  $.cookie( 'nicktt_currenttournament', tournamentKey, { expires: common.cookieExpiry, path: '/' });
  $( '#tournamentKeyDisplay' ).text('Tournament-Key: ' + common.tournamentKey);
};

common.getTournamentKey = function getTournamentKey(getOnly, joinRoom) {
  getOnly = getOnly || false;
  joinRoom = joinRoom || false;
  common.tournamentKey = $.cookie( 'nicktt_currenttournament' );
  if (common.tournamentKey) {
    // Refresh tournamentKey expiry and display.
    common.setTournamentKey(common.tournamentKey);
    if (joinRoom) {
      socket.emit( 'joinRoom', common.tournamentKey);
    };
  } else if (!getOnly) {
    $( '#outstream' ).html( 'Please load or start a new tournament from the Home page.' );
  };
};

common.removeWhiteSpace = function removeWhiteSpace(someString) {
  // Replace multiple spaces with one, REMOVE leading and trailing spaces.
  return someString.replace( /[\s\n\r]+/g, ' ' ).replace( /^\s|\s$/g, '' );
  // This matches leading and trailing spaces of any number /^\s+|\s+$/g
};

common.findInArray = function findInArray(array, searchValue, searchKey, returnKey) {
  var returnObj = array.find(function(item) {
    return item[searchKey] == searchValue;
  });
  if (returnKey != undefined) {
    return returnObj[returnKey];
  } else {
    return returnObj;
  };
}

common.getDrawnRounds = function getDrawnRounds(playerList) {
  //Actually returns the last drawn round.
  var prevRound = 0;
  // Determine the latest round and "condition" the playerList array.
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].opponentids) {
      // If there are opponentids, update what we think the last round is.
      prevRound = Math.max(prevRound, playerList[i].opponentids.length);
    } else {
      // If there are no opponentids, put an empty array so the next part works.
      playerList[i].opponentids = [];
      //~ console.log('Replaced undefined with empty array in playerList');
    };
  };
  return prevRound;
};

common.sumArray = function sumArray(someArray, useFloat) {
  // Sums all values in an array which may be strings. If a value cannot be parsed, it's skipped
  useFloat = useFloat || false;
  if (someArray && (someArray.length > 0)) {
    return someArray.reduce(function(prev, curr) {
      if (useFloat) {
        curr = parseFloat(curr);
      } else {
        curr = parseInt(curr);
      };
      if (isNaN(curr)) {
        curr = 0;
      };
      return prev + curr;
    });
  } else {
    return 0;
  };
};
