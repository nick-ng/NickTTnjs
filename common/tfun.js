var bfun = require( __dirname + '/bfun' );

// Global variables
var tfun = {};


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
 */
