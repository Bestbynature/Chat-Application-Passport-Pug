$(document).ready(function () {
  // Form submittion with new message in field with id 'm'

  let socket = io();

  $("form").submit(function () {
    var messageToSend = $("#m").val();

    // Send message to server here?
    socket.emit("chat message", messageToSend);

    $("#m").val("");
    return false;
  });

  socket.on("chat message", (data) => {
    $("#messages").append(
      $("<li>").html("<b>" + data.name + "</b>: " + data.message)
    );
  });

  socket.on("user", (data) => {
    $("#num-users").text(data.currentUsers + " users online");
    let message =
      data.name +
      (data.connected ? " has joined the chat." : " has left the chat.");
  });
  $("#messages").append($("<li>").html("<b>" + message + "</b>"));
});
