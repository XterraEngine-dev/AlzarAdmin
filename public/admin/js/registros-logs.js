"use strict";

var currentUserType;
var usuario;

var cref = firebase.database().ref('condominios');
var lref = firebase.database().ref('logs').child('lecturas')

var obj, tipo, condominios, condominos, logs;




(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http, $filter, $timeout) {

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                firebase.auth().currentUser.getIdToken()
                    .then(function (idToken) {
                        // Parse the ID token.
                        const payload = JSON.parse(b64DecodeUnicode(idToken.split('.')[1]));

                        condominios = $firebaseArray(cref);
                        condominios.$loaded().then(function () {
                            if (condominios.length > 0) {
                                Materialize.toast("Condominios cargados", 2000);
                            } else {
                                Materialize.toast("No hay condominios", 2000);
                            }
                        });
                        $scope.condominios = condominios

                        if (payload["administrador"]) {
                            $scope.userTipo = "administrador";
                            firebase.database().ref("usuarios").child(user.uid).once("value").then(function (snapshot) {
                                if (snapshot.val()) {
                                    var data = snapshot.val();
                                    $scope.userData = data;
                                    if (data.condominio) {
                                        $scope.cargarCondominio(data.condominio)
                                        $scope.condominioSeleccionado = data.condominio;
                                    }
                                    condominios = $firebaseArray(cref);
                                    $scope.condominios = condominios
                                }
                            });
                        } else {
                            if (payload["coordinador"] || user.email === "admin@alzar.com.gt") $scope.userTipo = "coordinador";
                            $scope.noCargando = true;
                            setTimeout(() => {
                                $scope.$apply();
                            }, 100);
                        }
                    });
            } else {
                window.location.replace("login.html")
            }
        });








        $scope.cargarCondominio = function (id) {
            var transac_log = [];
            console.log(id)

            lref.child(id).on("value", function (snapshot) {



                if (snapshot.val()) {

                    snapshot.forEach(element => {

                        if (element.val()) {
                            var data = element.val();
                            console.log(data.cambio_realizado_por)
                            console.log(data.condomino)
                            console.log(data.contador)
                            console.log(data.justificacion)
                            console.log(data.timestap)
                            console.log(data.valor_ingresado)


                            var date = new Date(data.timestap)
                            var fecha = date.toLocaleDateString("en-US")
                            var hours = date.getHours()
                            var minutes = date.getMinutes()

                            transac_log.push({
                                cambio: data.cambio_realizado_por,
                                condomino: data.condomino,
                                contador: data.contador,
                                mensaje: data.justificacion,
                                fecha: fecha,
                                hora: hours + ':' + minutes,
                                valor: data.valor_ingresado
                            });

                            $scope.opgg = transac_log;

                            console.log('OBJECTO', $scope.opgg)
                        }

                    });
                } else {
                    console.log('limpiar')
                    $scope.search = "";
                }
            })

            logs = $firebaseArray(lref);
            logs.$loaded().then(function () {
                if (logs.length > 0) {
                    Materialize.toast("registros cargados", 2000);
                } else {
                    Materialize.toast("No hay registros", 2000);
                }
            });
        }

        $scope.borrarSearch = function () {
            $scope.search = "";
        }

        $(document).ready(function () {
            $('ul.tabs').tabs();
            $(".color").each(function (value) {
                cargarColorInput(this)
            })
            $('select').material_select();
            $('.collapsible').collapsible();
            $("#menu-button").sideNav();
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

    });

})()
