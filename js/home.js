// home.js
$(document).ready(function() {
  // Make dialogs.
  /*
  $( '#newTournamentDialog' ).dialog({
    autoOpen: false,
    resizable: false,
    //height: 140,
    width: 400,
    modal: true,
    buttons: {
      ',
      'Cancel': function() {
        $( this ).dialog( 'close' );
      }
    }
  }); 

  $( '#loadTournamentDialog' ).dialog({
    autoOpen: false,
    resizable: false,
    //height: 140,
    width: 400,
    modal: true,
    buttons: {
      'Load': function() {
        
      },
      'Cancel': function() {
        $( this ).dialog( 'close' );
      }
    }
  });
  
  $( '#demoTournamentDialog' ).dialog({
    autoOpen: false,
    resizable: false,
    //height: 140,
    width: 400,
    modal: true,
    buttons: {
      'Load': function() {
        demoKey = $( "input[name=demoRadio]:checked" ).val();
        socket.emit( 'demoTournamentReset', demoKey);
        $( this ).dialog( 'option', 'title', 'Resetting demo tournament' );
        $( this ).html( '<p>Please wait.</p>' );
      },
      'Cancel': function() {
        $( this ).dialog( 'close' );
      }
    }
  });
  */
  // Other stuff
  common.getTournamentKey(true);
  if (common.tournamentKey) {
    $( '#currentTournamentInfo' ).html( '<p class="mini-h">Tournament ' + common.tournamentKey + ' currently loaded.</p>' );
  };
}); // $( document ).ready(function() {

$( '#createNewTournamentButton' ).click(function() {
  console.log('Getting a new tournament-key');
  socket.emit( 'pullTournamentKey', 'new' );
  //<div id="newTournamentDialog" title="Create a new tournament?">
  $( '#newTournamentDialogTitle' ).text( 'Creating new tournament...' );
  $( '#newTournamentDialogBody' ).html( '<p>Please wait.</p>' );
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
