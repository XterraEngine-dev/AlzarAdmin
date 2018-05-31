"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('directorio');
var obj, tipo;

(function () {
    var app = angular.module("app", ["firebase", "colorpicker.module"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http) {
        $scope.condominio_nombre = localStorage.getItem("condominio_nombre");
        console.log($scope.condominio_nombre)
        $scope.condominio_id = localStorage.getItem("condominio_id");
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                firebase.database().ref("condominios").child($scope.condominio_id).once("value").then(function (snapC) {
                    if (snapC.val()) {
                        $scope.condominio_data = snapC.val();
                        console.log($scope.condominio_data);
                        document.documentElement.style.setProperty('--color-principal', $scope.condominio_data.color);
                        setTimeout(() => {
                            cargarAmenidades()
                            $scope.$apply();
                        }, 10);
                    }
                });
                firebase.database().ref("condominos").child($scope.condominio_id).child(user.uid).once("value").then(function (snapU) {
                    if (snapU.val()) {
                        $scope.user_data = snapU.val()
                    }
                });
            } else {
                window.location.replace("login.html")
            }
        });

        function cargarAmenidades() {
            obj = $firebaseArray(ref.child($scope.condominio_id).orderByChild("mostrar").equalTo(true));
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    setTimeout(() => {
                        $('ul.tabs').tabs();
                    }, 300);
                } else {
                    Materialize.toast("No hay profesionales", 2000);
                }

            });
            $scope.data = obj
        }
        $scope.borrarSearch = function () {
            $scope.search = "";
        }

        $http.get("profesiones.json").then(function (response) {
            var profesiones = response.data.occupations;
            console.log(profesiones)
            var data = {}
            profesiones.forEach(profesion => {
                data[profesion] = null;
            });
            cargarProfesiones(data)
        });
        function cargarProfesiones(data) {
            $(document).ready(function () {
                $('input.autocomplete').autocomplete({
                    data: data,
                    limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
                    onAutocomplete: function (val) {
                        $scope.perfil.profesion = val
                    },
                    minLength: 2, // The minimum length of the input for the autocomplete to start. Default: 1.
                });
            });
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
