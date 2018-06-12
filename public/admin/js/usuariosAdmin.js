"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('usuarios');
var cref = firebase.database().ref('condominios');

var obj, tipo, condominios;

(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http) {

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                firebase.auth().currentUser.getIdToken()
                    .then(function (idToken) {
                        // Parse the ID token.
                        const payload = JSON.parse(b64DecodeUnicode(idToken.split('.')[1]));
                        // Confirm the user is an Admin.
                        if (payload["coordinador"] || user.email === "admin@alzar.com.gt") {
                            $scope.cargarCondominios();
                        } else {
                            window.location.replace("login.html")
                        }
                    });
            } else {
                window.location.replace("login.html")
            }
        });

        $scope.crear = function (valid) {
            if (valid) {

                waiting();

                var file = document.getElementById("foto").files[0];
                var preview = document.getElementById('imgPreview');
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
                        $("#progresoFile").width(progress + "%");
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
                        var timeStamp = new Date().getTime();

                        $scope.new.foto = downloadURL;
                        $scope.new.fecha_creacion = timeStamp;

                        try{
                            $scope.new.condominio_nombre = condominios[condominios.$indexFor($scope.new.condominio)].nombre; 
                        }catch{
                            $scope.new.condominio_nombre = "TODOS";
                        }

                 
            
                        $scope.new.creador = $scope.user.email;

                        $.ajax({
                            type: "POST",
                            url: 'https://us-central1-alzargt.cloudfunctions.net/crearUsuario',
                            data: {
                                json: JSON.stringify({
                                    usuario: $scope.new,
                                    id: $scope.user.uid
                                })
                            },
                            success: function (data, textStatus, xhr) {
                                Materialize.toast("Usuario creado con éxito", 5000);
                                destroyWaiting();
                            },
                            error: function (error) {
                                destroyWaiting();
                                Materialize.toast(error.responseText, 10000);
                                Materialize.toast("No se creo el usuario, vuelve a intentar más tarde", 12000)
                            }
                        });

                        document.getElementById("crearForm").reset();
                        $("#crearModal").modal("close")
                    })
                }
                if (file) {
                    reader.readAsDataURL(file);
                } else {
                    destroyWaiting();
                    preview.src = "";
                }


            } else {
                Materialize.toast("Revisa el formulario", 8000)
            }
        }

        $scope.guardar = function (i) {
            obj.$save($scope.editar).then(function (ref) {
                Materialize.toast("Se han guardado los cambios", 5000);
                $("#editarModal").modal("close");
            });
        }

        $scope.editarModal = function (i) {
            $scope.editar = obj[i];

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
                url: 'https://us-central1-alzargt.cloudfunctions.net/eliminarUsuario',
                data: {
                    json: JSON.stringify({
                        user_id: $scope.editar.$id,
                        id: $scope.user.uid
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
            $scope.editar = obj[i]
            $("#eliminarModal").modal("open")
        }

        $scope.cargarCondominios = function () {
            var tref = ref
            obj = $firebaseArray(ref
            );
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    Materialize.toast("Usuarios cargados", 2000);
                } else {
                    Materialize.toast("No hay usuarios", 2000);
                }
            });
            $scope.data = obj

            condominios = $firebaseArray(cref);
            condominios.$loaded().then(function () {
                if (condominios.length > 0) {
                    console.log("Condominios cargados")
                } else {
                    Materialize.toast("No hay condominios", 2000);
                }
            });
            $scope.condominios = condominios
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

                    $scope.editar.foto = downloadURL;

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
