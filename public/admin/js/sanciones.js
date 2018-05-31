"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('condominos');
var sref = firebase.database().ref('sanciones');
var cref = firebase.database().ref('condominios');

var obj, tipo, condominios, condominos;

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
            var nuevo = $scope.new;
            if (nuevo) {
                if (nuevo.dias && !isNaN(nuevo.dias)) {
                    var hoy = new Date();
                    var exp = new Date();
                    exp.setDate(exp.getDate() + parseInt(nuevo.dias));
                    nuevo.expiracion = exp.getTime();
                    nuevo.fecha = hoy.getTime();
                    $scope.data.$add(nuevo).then(function (s) {
                        $scope.new = {};
                        document.getElementById("crearForm").reset();
                        Materialize.toast("Sanción creada", 3000);
                        $("#crearModal").modal("close");
                    });
                }
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
            $scope.editar.codigo = String($scope.editar.codigo);
            $scope.editar.contador = String($scope.editar.contador);
            obj.$save($scope.editar).then(function (ref) {
                Materialize.toast("Se han guardado los cambios", 5000);
                $("#editarModal").modal("close");
            });
        }

        $scope.editarModal = function (i) {
            console.log(i)
            $scope.editar = i;

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

        $scope.contrasenaModal = function (i) {
            $scope.actualIndex = i;
            $scope.actualUID = i.$id;
            $("#cambiarContrasenaModal").modal("open");
        }
        $scope.seleccionados = [];

        $scope.check = function (i, v) {
            setTimeout(() => {
                if (i != null && v) {
                    if (v.selected) {
                        $scope.seleccionados = $scope.data.map(function (item) {
                            if (item.selected)
                                return item
                        });
                    } else {
                        $scope.seleccionados = $scope.data.map(function (item) {
                            if (item.selected)
                                return item
                        });
                    }
                }
                setTimeout(() => {
                    $scope.$apply();
                }, 50);
            }, 50);

        }
        $scope.checkAll = function () {
            $scope.seleccionados = $scope.data.map(function (item) {
                item.selected = true;
                return item
            });
            setTimeout(() => {
                $scope.$apply();
            }, 50);
        };

        $scope.uncheckAll = function () {
            $scope.seleccionados = [];
            $scope.data.map(function (item) {
                item.selected = false;
                return;
            });
        };

        $scope.cambiarPropiedadesGlobales = function () {
            var correos = $scope.seleccionados.filter(function (currentValue, index, arr) {
                return currentValue != null;
            });
            if (correos.length) {
                if ($scope.propiedades) {
                    var p = $scope.propiedades;
                    correos.forEach(seleccionado => {
                        var editable = $scope.data[$scope.data.$indexFor(seleccionado.$id)];
                        if (p.cuota_agua) editable.cuota_agua = parseInt(p.cuota_agua);
                        if (p.costo_cuota_agua) editable.costo_cuota_agua = parseFloat(p.costo_cuota_agua);
                        if (p.costo_cuota_agua_exceso) editable.costo_cuota_agua_exceso = parseFloat(p.costo_cuota_agua_exceso);
                        $scope.data.$save(editable);
                    });
                }
            } else {
                Materialize.toast("No hay condominos seleccionados", 8000)
            }
            console.log(correos)
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

            obj = $firebaseArray(sref.child(id));
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    obj.forEach(s => {
                        s.selected = false
                    });
                    Materialize.toast("Sanciones cargadas", 2000);
                } else {
                    Materialize.toast("No hay Sanciones", 2000);
                }
            });
            $scope.data = obj

            var tref = ref.child(id)
            condominos = $firebaseArray(tref.orderByChild("nombre"));
            condominos.$loaded().then(function () {

            });
            $scope.condominos = condominos

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
