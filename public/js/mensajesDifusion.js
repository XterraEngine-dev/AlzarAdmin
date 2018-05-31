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
                        firebase.database().ref("usuarios").child(user.uid).once("value").then(function (snapshot) {
                            if (snapshot.val()) {
                                var data = snapshot.val();
                                $scope.userData = data;
                                if (data.condominio) {
                                    cargarCondominio(data.condominio)
                                    $scope.condominioSeleccionado = data.condominio;
                                }
                                condominios = $firebaseArray(cref);
                                $scope.condominios = condominios
                            }
                        });
                    }

                })
            }
        });
        $scope.enviarMensaje = function () {
            var correos = $scope.seleccionados.filter(function (currentValue, index, arr) {
                return currentValue != null;
            });
            if (correos.length) {
                console.log(correos)
                waiting();
                enviarRecordatorio(correos, 0, correos.length - 1);
            } else {
                Materialize.toast("No hay condominos a quienes enviarles el recordatorio", 8000)
            }
        }
        function enviarRecordatorio(a, j, final) {
            var u = a[j]
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarCorreo',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            receptor: u,
                            mensaje: `
                            <p>${$scope.m.mensaje}</p>
                            <br><br>
                            ${$scope.m.archivo ? '<a href="' + $scope.m.archivo + '" style="padding: 15px;background-color: #FF9F00;color: white;border-radius: 5px;border: none;font-size: 16px;">Descargar archivo adjunto</a>' : ''}
                            `,
                            titulo: $scope.m.titulo,
                            logo: condominios[condominios.$indexFor($scope.condominioSeleccionado)].logo,
                            condominio_nombre: condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre,
                            emisor: $scope.user.email,
                        }
                    })
                },
                success: function (data, textStatus, xhr) {
                    Materialize.toast("Mensaje " + (j + 1) + "/" + (final + 1) + " enviado con éxito", 5000);
                    j++;
                    if (j <= final) {
                        enviarRecordatorio(a, j, final);
                    } else {
                        destroyWaiting();
                    }
                },
                error: function (error) {
                    if (a[j]) if (a[j].codigo) Materialize.toast("No se envió el mensaje " + a[j].codigo, 12000);
                    j++;
                    console.error(error.responseText);
                    if (j <= final) {
                        errores.push(error + "; ");
                        enviarRecordatorio(a, j, final);
                    } else {
                        destroyWaiting();
                    }
                }
            });
        }
        $scope.subirArchivo = function () {
            var file = document.getElementById("archivo").files[0];
            var reader = new FileReader();
            if (file) {
                reader.onloadend = function () {
                    var fileName = file.name;
                    fileName = fileName.replace(/[^a-zA-Z0-9.]/g, '');
                    var uploadTask = firebase.storage().ref("adjuntos").child(fileName).put(file);

                    uploadTask.on('state_changed', function (snapshot) {
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                        $("#progreso").width(progress + "%");
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
                        $("#progreso").width(0);
                        $scope.m.archivo = uploadTask.snapshot.downloadURL;
                        Materialize.toast("Se ha subido el archivo", 5000)
                        setTimeout(() => {
                            $scope.$apply();
                        }, 50);
                    })
                }
                if (file) {
                    reader.readAsDataURL(file);
                }
            }
        }
        $scope.cargarCondominio = function (id) {

            if (!$scope.condominioSeleccionado)
                $scope.condominioSeleccionado = id;
            if (!id)
                id = $scope.condominioSeleccionado;

            var tref = uref.child(id)

            $scope.noCargando = false;

            condominos = $firebaseArray(tref);
            condominos.$loaded().then(function () {
                $scope.noCargando = true;
                if (condominos.length > 0) {
                    Materialize.toast("Condominos cargados", 2000);
                } else {
                    $scope.data = [];
                    Materialize.toast("No hay Condominos", 2000);
                }
            });
            $scope.data = condominos;
        }
        $scope.seleccionados = [];

        $scope.check = function (i, v) {
            setTimeout(() => {
                if (i != null && v) {
                    if (v.selected) {
                        $scope.seleccionados = $scope.data.map(function (item) {
                            if (item.selected)
                                return item.correo
                        });
                    } else {
                        $scope.seleccionados = $scope.data.map(function (item) {
                            if (item.selected)
                                return item.correo
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
                return item.correo
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