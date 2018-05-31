firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    $("#profileImg").attr("src", user.photoURL);
    $("#nameLabel").html(user.displayName);
    $("#emailLabel").html(user.email);
  } else {
    window.location.replace("login.html");
  }
});