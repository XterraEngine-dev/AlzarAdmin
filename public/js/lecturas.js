"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('lecturas');
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

                    }
                });
                firebase.database().ref("condominos").child($scope.condominio_id).child(user.uid).once("value").then(function (snapU) {
                    if (snapU.val()) {
                        $scope.user_data = snapU.val()
                        setTimeout(() => {
                            cargarAmenidades();
                            $scope.$apply();
                        }, 10);
                    }
                });
            } else {
                window.location.replace("login.html")
            }
        });

        function cargarAmenidades() {
            obj = $firebaseArray(ref.child($scope.condominio_id).child($scope.user_data.contador));
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    setTimeout(() => {
                        $('ul.tabs').tabs();
                    }, 300);
                } else {
                    Materialize.toast("No hay lecturas", 2000);
                }

            });
            $scope.data = obj
        }

        $scope.cambiarLogo = function () {
            var file = document.getElementById("logoE").files[0];
            var preview = document.getElementById('imgPreviewE');
            var reader = new FileReader();

            reader.onloadend = function () {

                preview.src = reader.result;
                var width = preview.clientWidth;
                var height = preview.clientHeight;

                if (width / height !== 1) {
                    Materialize.toast("Debe ser una imagen cuadrada (Proporción 1:1)", 10000);
                }
                var fileName = file.name;

                var uploadTask = firebase.storage().ref("condominios").child(fileName).put(file);

                uploadTask.on('state_changed', function (snapshot) {
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    $("#progresoFileE").width(progress + "%");
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            console.log('Upload is running');
                            break;
                    }
                }, function (error) {
                    Materialize.toast("Ha ocurrido un error, " + error)
                }, function () {

                    var downloadURL = uploadTask.snapshot.downloadURL;

                    $scope.editar.logo = downloadURL;

                    obj.$save($scope.editar).then(function (ref) {
                        Materialize.toast("Se ha modificado el logo", 5000);
                    });

                })
            }
            if (file) {
                reader.readAsDataURL(file);
            } else {
                preview.src = "";
            }
        }
        $scope.cambiarFondo = function () {
            var file = document.getElementById("logoF").files[0];
            var preview = document.getElementById('imgPreviewF');
            var reader = new FileReader();

            reader.onloadend = function () {

                preview.src = reader.result;
                var width = preview.clientWidth;
                var height = preview.clientHeight;

                if (width / height !== 1) {
                    Materialize.toast("Debe ser una imagen cuadrada (Proporción 1:1)", 10000);
                }
                var fileName = file.name;

                var uploadTask = firebase.storage().ref("condominios").child(fileName).put(file);

                uploadTask.on('state_changed', function (snapshot) {
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    $("#progresoFileF").width(progress + "%");
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            console.log('Upload is running');
                            break;
                    }
                }, function (error) {
                    Materialize.toast("Ha ocurrido un error, " + error)
                }, function () {

                    var downloadURL = uploadTask.snapshot.downloadURL;

                    $scope.editar.fondo = downloadURL;

                    obj.$save($scope.editar).then(function (ref) {
                        Materialize.toast("Se ha modificado el logo", 5000);
                    });
                })
            }
            if (file) {
                reader.readAsDataURL(file);
            } else {
                preview.src = "";
            }
        }

        $scope.borrarSearch = function () {
            $scope.search = "";
        }

        $scope.abrirFoto = function (id) {
            console.log(id)
            $("#modalFoto").modal('open');
            firebase.database().ref("lecturas").child($scope.condominio_id).child($scope.user_data.contador).child(id).once("value").then(function (s) {
    
                $scope.$apply(function () {
                    
                    $scope.foto = s.val().foto;
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
