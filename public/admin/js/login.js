$(document).ready(function () {


    $('.collapsible').collapsible();
    $('ul.tabs').tabs({
    });
    $('select').material_select();


    $('#loginCard').jAnimateOnce('fadeIn');
    $('#userDiv').jAnimateOnce('slideInRight');
    $('#passwordDiv').jAnimateOnce('slideInRight');
    $('#sendDiv').jAnimateOnce('slideInRight');
    $('#title').jAnimateOnce('zoomIn');
    $('#sendDiv').click(function (e) {
    });

});

var tipo;

(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http) {
        $scope.login = function (isValid) {
            if (isValid) {
                firebase.auth().signInWithEmailAndPassword($scope.usuario.correo, $scope.usuario.password).then(function (user) {
                    console.log(user.uid)
                    firebase.database().ref("permisos").child(user.uid).once("value").then(function (snap) {
                        console.log(snap.val())
                        if (snap.val()) {
                            if (snap.val().tipo) tipo = snap.val().tipo;
                        }
                        if (!tipo) {
                            Materialize.toast("Se ha iniciado sesión", 1000);
                            setTimeout(() => {
                                window.location.replace("index.html");
                            });
                        } else {
                            Materialize.toast("No se ha iniciado sesión", 1000);
                        }
                    });
                }).catch(function (error) {
                    // Handle Errors here.
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    var mensaje = "";
                    switch (errorCode) {
                        case "auth/invalid-email":
                            mensaje = "El correo es incorrecto"
                            break;
                        case "auth/user-disabled":
                            mensaje = "El usuario está bloqueado"
                            break;
                        case "auth/user-not-found":
                            mensaje = "El usuario no existe"
                            break;
                        case "auth/wrong-password":
                            mensaje = "La contraseña es incorrecta"
                            break;
                        default:
                            mensaje = "Al parecer tu conexión no es adecuada"
                            break;
                    }
                    Materialize.toast(mensaje, 8000);
                });
            }
        }
        $scope.olvide = function () {
            var auth = firebase.auth();
            auth.sendPasswordResetEmail($scope.usuario.correo).then(function () {
                Materialize.toast("Por favor revisa tu correo", 8000);
            }, function (error) {
                Materialize.toast("Algo ha ocurrido " + error, 8000);
            });
        }
    });
})()