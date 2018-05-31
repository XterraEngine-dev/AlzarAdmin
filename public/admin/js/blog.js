"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('blog');
var cref = firebase.database().ref('condominios');

var obj, tipo, condominios;

(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http, $filter) {

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

        $scope.crear = function (valid) {
            if (valid && $scope.condominioSeleccionado) {
                waiting();

                var timeStamp = + new Date();
                $scope.new.fecha = timeStamp;
                $scope.new.creador = $scope.user.email;
                $scope.new.condominio = $scope.condominioSeleccionado;
                $scope.new.condominio_nombre = condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre

                obj.$add($scope.new).then((s) => {
                    Materialize.toast("Nota creada");
                    destroyWaiting();
                })
                document.getElementById("crearForm").reset();
                $("#crearModal").modal("close")
            }
        }
        $scope.generarContrasena = function () {
            var newContrasena = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
            var dejar = true;
            if ($scope.new) {
                $scope.new.contrasena = newContrasena
                dejar = false;
            }
            if ($scope.editar) {
                $scope.editar.contrasena = newContrasena;
                dejar = false;
            }
            if (!dejar)
                Materialize.toast("Contraseña generada: " + $scope.new.contrasena, 8000)
        }

        $scope.guardar = function (i) {
            $scope.editar.nota = tinymce.activeEditor.getContent();
            obj.$save($scope.editar).then(function (ref) {
                Materialize.toast("Se han guardado los cambios", 5000);
                $("#editarModal").modal("close");
            });
        }

        $scope.editarModal = function (i) {
            console.log(i)
            $scope.editar = i;
            if ($scope.editar.nota) {
                tinymce.activeEditor.setContent($scope.editar.nota);
            } else {
                tinymce.activeEditor.setContent("");
            }
            setTimeout(() => {
                Materialize.updateTextFields();
            }, 300);

            $("#editarModal").modal("open");
        }

        $scope.eliminar = function () {
            waiting();
            console.log($scope.user.uid)
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/eliminarCondomino',
                data: {
                    json: JSON.stringify({
                        user_id: $scope.editar.$id,
                        id: $scope.user.uid,
                        condominio: $scope.editar.condominio
                    })
                },
                success: function (data, textStatus, xhr) {
                    Materialize.toast("Usuario eliminado con éxito", 5000);
                    $("#eliminarModal").modal("close")
                    destroyWaiting();
                },
                error: function (error) {
                    destroyWaiting();
                    Materialize.toast(error.responseText, 10000);
                    console.error(error.responseText);
                    Materialize.toast("No se eliminó el usuario", 12000)
                }
            });
        }
        $scope.eliminarModal = function (i) {

            $scope.editar = i
            $("#eliminarModal").modal("open")
        }

        $scope.cargarCondominio = function (id) {
            console.log($scope.condominioSeleccionado, id)
            if (!$scope.condominioSeleccionado)
                $scope.condominioSeleccionado = id;

            if (!id) return;
            var tref = ref.child(id)
            obj = $firebaseArray(tref);
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    Materialize.toast("Notas cargadas", 2000);
                } else {
                    Materialize.toast("No hay notas", 2000);
                }
            });
            $scope.data = obj

        }

        $(document).ready(function () {
            tinymce.init({
                selector: 'textarea',
                height: 500,
                menubar: false,
                plugins: [
                    'advlist autolink lists link image charmap print preview anchor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table contextmenu paste code'
                ],
                toolbar: 'undo redo | insert | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
                content_css: '//www.tinymce.com/css/codepen.min.css'
            });
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
        function randomString(length, chars) {
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
            return result;
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
