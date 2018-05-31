$(document).ready(function () {


    $('.collapsible').collapsible();
    $('ul.tabs').tabs({
    });
    $('select').material_select();


    $('#loginCard').jAnimateOnce('fadeIn');
    $('#userDiv').jAnimateOnce('slideInRight');
    $('#codigoDiv').jAnimateOnce('slideInRight');
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
            if (isValid && $scope.usuario) {
                firebase.database().ref("condominios").orderByChild("codigo").equalTo($scope.usuario.condominio).once("value").then(function (snap) {
                    if (snap.val()) {
                        var condominio_id = Object.keys(snap.val())[0];
                        var condominio_nombre = snap.val()[condominio_id].nombre
                        var nombre_condominio = condominio_nombre.replace(/\s/g, '');
                        nombre_condominio = nombre_condominio.replace(/[^\dA-Z]/gi, '').
                            nombre_condominio = nombre_condominio.toLowerCase();
                        var correo = $scope.usuario.codigo + "@" + nombre_condominio + ".com"
                        console.log(correo)
                        firebase.auth().signInWithEmailAndPassword(correo, $scope.usuario.password).then(function (user) {
                            localStorage.setItem("condominio_id", condominio_id);
                            localStorage.setItem("condominio_nombre", condominio_nombre);
                            console.log(condominio_id, user.uid)
                            firebase.database().ref("condominos").child(condominio_id).child(user.uid).once("value").then(function (s) {
                                if (s.val()) {
                                    window.location.replace("index.html");
                                } else {
                                    Materialize.toast("Condomino no autorizado", 8000)
                                }
                            })
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
                    } else {
                        Materialize.toast("El usuario no existe", 8000);
                    }
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