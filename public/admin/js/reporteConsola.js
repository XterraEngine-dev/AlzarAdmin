"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('consola');

var obj, tipo, condominios, condominos, lecturas;

(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http, $filter) {
        var time = new Date(), anio = time.getFullYear();
        $scope.anios = [
            anio - 2,
            anio - 1,
            anio
        ]
        var meses = [
            "01",
            "02",
            "03",
            "04",
            "05",
            "06",
            "07",
            "08",
            "09",
            "10",
            "11",
            "12",
        ];

        var firstDay = new Date(time.getFullYear(), time.getMonth(), 1);
        firstDay.setHours(0, 0, 0, 0);
        $scope.firstSecond = firstDay.getTime();
        var mesActual = meses[time.getMonth()];

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                firebase.auth().currentUser.getIdToken().then(function (idToken) {
                    $scope.mesSeleccionado = mesActual;
                    $scope.anioSeleccionado = String(anio);
                    // Parse the ID token.
                    const payload = JSON.parse(b64DecodeUnicode(idToken.split('.')[1]));
                    if (payload["coordinador"] || user.email === "admin@alzar.com.gt") $scope.userTipo = "coordinador";
                    if (payload["administrador"]) $scope.userTipo = "administrador";
                    $scope.cargarCondominio();
                });
            }
        }) // CARGAR DATOS DE USUARIO
        $scope.cargarCondominio = function () {
            var hoy = new Date();
            var hace6 = new Date();
            hace6.setMonth(hace6.getMonth() - 6);
            var tref = ref.orderByChild("fecha").startAt(hoy.getTime()).endAt(hace6.getTime());
            $scope.noCargando = false;
            condominos = $firebaseArray(tref);
            condominos.$loaded().then(function () {
                $scope.noCargando = true;
            });
            $scope.condominos = condominos;
        }
        $scope.exportarUsuarios = function () {
            var mystyle = {
                sheetid: 'CONSOLA ',
                headers: true,
                caption: {
                    title: 'CONSOLA '
                },
                columns: [
                    { columnid: 'fecha', title: "Fecha" },
                    { columnid: 'accion', title: "Acción realizada" },
                    { columnid: 'usuario', title: "Usuario" }
                ]
            };
            $scope.lecturas = []
            $scope.condominos.forEach(u => {
                var fechat = timeConverter(u.fecha);
                $scope.lecturas.push({
                    contador: fechat || "",
                    accion: u.accion || "",
                    usuario: u.usuario || ""
                });
            });
            alasql('SELECT * INTO XLS("CONSOLA');
        }
        function timeConverter(UNIX_timestamp) {
            var a = new Date(UNIX_timestamp);
            var year = a.getFullYear();
            var month = a.getMonth() + 1;
            var date = a.getDate();
            var hour = a.getHours();
            var min = a.getMinutes();
            var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min;
            return time;
        }
        $(document).ready(function () {
            $('ul.tabs').tabs();
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