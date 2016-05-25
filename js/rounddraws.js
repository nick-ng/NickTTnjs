var tabIDList = [0];
var rowIDList = [[0]];
var tabs;
var maxTries = [100,1000,5000]; // How many times to try before going to a different routine.
var maxTime = 4.8; // Unresponsive alert time.
var randseed = [Math.random()]; // Initialise a random seed for the random function we call later.

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


// Do this on the client to reduce the load on the server.

function drawRound(playerList, randomSeed) {
  var lastRound = 0;
  // Determine the latest round and "condition" the playerList array.
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i].opponentids) {
      // If there are opponentids, update what we think the last round is.
      lastRound = Math.max(lastRound, playerList[i].opponentids.length);
    } else {
      // If there are no opponentids, put an empty array so the next part works.
      playerList[i].opponentids = [];
    };
  };
  var nextRound = lastRound + 1;
  randseed[0] = nextRound;
  // Pair players
  /* Pairing Algorithm Steps:
   * 0. The most wins a player can have is the previous round number.
   * 1. Set the current win bracket to be the current round number. This is to avoid a special case first loop.
   * 2. Reduce the current win bracket by 1.
   * 3. Round down and add random amount between 0.1 and 0 to each player's score.
   * 4. Sort players by their score
   * 5. Check the first player's score. If less than the current win bracket, go to 2.
   * 6. .shift() two players from the array.
   * 7. Check if they can play each other. If they can't, .push() them to the array and go to 3.
   * 8. If there are still players in the array, go to 6
   * 9. If it takes too long, put all the players back in the array and start from 1.
   */
  // Make a temporary array of players.
  var tempPlayers = makeTempPlayerList(playerList);
  var playerPairs = [];
  breakCounter = 0;
  /* These control what pairings are allowed.
   * avoidOpponents is always true.
   * Order:
   * honourScore = avoidClubs = true
   * honourScore = true
   * avoidClubs = true
   */
  var honourScore = true; // Pair according to score.
  var avoidClubs = true; // Avoid pairing players from the same club.
  while ((tempPlayers.length > 0) && (breakCounter < maxTries[0])) {
    for (var i = 0; i < tempPlayers.length; i++) {
      //Math.floor(tempPlayers[i].totalScore) +
      tempPlayers[i].totalScore = seededRand() / 10;
      if (honourScore) {
        tempPlayers[i].totalScore += sumArray(tempPlayers[i].score);
      };
    };
    sortByKey(tempPlayers, 'totalScore');
    tempPlayers.reverse();
    console.log('Hello');
    for (var i = 0; i < tempPlayers.length; i++) {
      console.log(tempPlayers[i]);
    };
    scoreBracket = Math.floor(tempPlayers[0].totalScore);
    console.log('Paired so far:');
    console.log(playerPairs);
    console.log('New scoreBracket = ' + scoreBracket);
    while (tempPlayers[0] && tempPlayers[0].totalScore >= scoreBracket) {
      player1 = tempPlayers.shift();
      player2 = tempPlayers.shift();
      if (player1.opponentids.indexOf(player2.id) == -1 ) {
        playerPairs.push([player1.id, player2.id]);
      } else {
        tempPlayers.push(player1);
        tempPlayers.push(player2);
        breakCounter++;
        break;
      };
    };
  };
  console.log(playerPairs);
};

function makeTempPlayerList(playerList) {
  var tempPlayers = [];
  for (var i = 0; i < playerList.length; i++) {
    // Check still_playing property before pushing.
    // playerList[i].stillplaying;
    tempPlayers.push({id:playerList[i].id, opponentids:playerList[i].opponentids, score:playerList[i].score});
  };
  if (tempPlayers.length % 2) {
    tempPlayers.push({id:-1, opponentids:[], score:[-1]}); // Add ghost player so there are always an even number of players.
  };
  return tempPlayers;
};
  
function seededRand(generator) {
  // A seeded random number generator.
  generator = generator || 0;
  if (!randseed[generator]) {
    randseed[generator] = Math.random();
  };
  var x = Math.sin(randseed[generator]++) * 10000;
  return x - Math.floor(x);
}

function sumArray(someArray, useFloat) {
  // Sums all values in an array which may be strings. If a value cannot be parsed, it's skipped
  useFloat = useFloat || false;
  if (someArray) {
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

function sortByKey(array, key) {
  return array.sort(function getDelta(a, b) {
    var x = a[key];
    var y = b[key];

    if (typeof x == "string") {
      x = x.toLowerCase();
    }
    if (typeof y == "string") {
      y = y.toLowerCase();
    }
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
};

socket.on( 'pushAllPlayerDetails', function(playerList, extraInfo) {
  drawRound(playerList, 1);
});
