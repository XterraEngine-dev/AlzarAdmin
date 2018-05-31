"use strict";

var currentUserType;
var usuario;

var uref = firebase.database().ref('condominos');
var cref = firebase.database().ref('condominios');

var obj, tipo, condominios, condominos, lecturas;

(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http) {

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                firebase.auth().currentUser.getIdToken().then(function (idToken) {

                    const payload = JSON.parse(b64DecodeUnicode(idToken.split('.')[1]));
                    if (payload["coordinador"] || user.email === "admin@alzar.com.gt") $scope.userTipo = "coordinador";
                    if (payload["administrador"]) $scope.userTipo = "administrador";
                    if ($scope.userTipo === "coordinador") {
                        condominios = $firebaseArray(cref);
                        condominios.$loaded().then(function () {
                            $scope.noCargando = true;
                            if (condominios.length > 0) {
                                Materialize.toast("Condominios cargados", 2000);
                            } else {
                                Materialize.toast("No hay condominios", 2000);
                            }
                        });
                        $scope.condominios = condominios
                    } else {
                        $scope.condominioSeleccionado = data.condominio;
                    }

                })
            }
        });
        $scope.seleccionarCondominio = function(c) {
            console.log(c)
            $scope.condominioSeleccionado = c
        }
        $scope.enviarMensaje = function () {
            var mensaje = {
                mensaje: $scope.m.mensaje,
                titulo: $scope.m.titulo,
                segmentos: $scope.condominioSeleccionado,
                url: $scope.m.url
            }
            if ($scope.condominioSeleccionado) {
                waiting();
                enviarRecordatorio(mensaje);
            } else {
                Materialize.toast("No has seleccionado un condominio", 8000)
            }
        }
        function enviarRecordatorio(mensaje) {

            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarPush',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            mensaje: mensaje.mensaje,
                            titulo: mensaje.titulo,
                            segmentos: mensaje.segmentos,
                            url: mensaje.url
                        }
                    })
                },
                success: function (data, textStatus, xhr) {
                    console.log(data)
                    Materialize.toast("Push enviado", 5000);
                    destroyWaiting();
                },
                error: function (error) {
                    console.error(error.responseText);
                    destroyWaiting();
                }
            });
        }
        $(document).ready(function () {
            $('ul.tabs').tabs();
            $('select').material_select();
            $('.collapsible').collapsible();
            $("#menu-button").sideNav();
            $('.tooltipped').tooltip({ delay: 50 });
            $('.modal').modal({
                dismissible: true, // Modal can be dismissed by clicking outside of the modal
                opacity: .8, // Opacity of modal background
                inDuration: 300, // Transition in duration
                outDuration: 200, // Transition out duration
                startingTop: '10%', // Starting top style attribute
                endingTop: '10%', // Ending top s
                complete: function () {
                    //alert('Closed'); 
                }
            });
        });
    }); // END DE CONTROLADOR
    app.directive('imageonload', function () {
        return {
            restrict: 'A',
            scope: { imageonload: '@' },
            link: function (scope, element, attrs) {
                element.bind('load', function () {
                    $(document).ready(function () {
                        $(element).materialbox();
                    });
                });
            }
        };
    });
})()