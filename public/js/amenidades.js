"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('amenidades');
var cref = firebase.database().ref('condominios');

var obj, tipo, condominios, album, fechas, horarios;

(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http) {
        var time = new Date(), anio = time.getFullYear();
        $scope.anios = [
            anio - 1,
            anio,
            anio + 1
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
        var mesActual = meses[time.getMonth()];

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
            var dejar = true;
            var mensaje = "Existe un error"
            if (!nuevo.codigo || !nuevo.codigo.length) {
                dejar = false;
                mensaje = "Debe existir un código"
            }
            if (!nuevo.nombre || !nuevo.nombre.length) {
                dejar = false;
                mensaje = "Debe existir un nombre"
            }
            if (!nuevo.descripcion || !nuevo.descripcion.length) {
                dejar = false;
                mensaje = "Debe existir una descripción"
            }
            if (!nuevo.capacidad || isNaN(nuevo.capacidad)) {
                dejar = false;
                mensaje = "Debe ingresar la capacidad máxima"
            }
            if (!nuevo.costo_hora && !nuevo.costo_uso) {
                dejar = false;
                mensaje = "Debe ingresar o Costo por hora o Costo por uso"
            } else {
                if (nuevo.costo_uso && isNaN(nuevo.costo_uso)) {
                    dejar = false;
                    mensaje = "El costo por Uso debe ser u número"
                }
                if (nuevo.costo_hora && isNaN(nuevo.costo_hora)) {
                    dejar = false;
                    mensaje = "El costo por Hora debe ser u número"
                }
            }
            if (!nuevo.horas_maximas || isNaN(nuevo.horas_maximas)) {
                dejar = false;
                mensaje = "Debe ingresar la cantidad máxima de horas disponibles para alquiler"
            }
            if (!nuevo.deposito || isNaN(nuevo.deposito)) {
                dejar = false;
                mensaje = "Debe ingresar una cantidad para realizar en depósito"
            }
            if (!nuevo.hora_maxima || isNaN(nuevo.hora_maxima)) {
                dejar = false;
                mensaje = "Debe ingresar la hora máxima disponible en horario normal"
            }
            if (!nuevo.hora_minima || isNaN(nuevo.hora_minima)) {
                dejar = false;
                mensaje = "Debe ingresar la hora mínima disponible en horario normal"
            }
            if (nuevo.dias && nuevo.dias.constructor !== Array) {
                dejar = false;
                mensaje = "Debe ingresar los días disponibles en horario normal"
            }
            if (nuevo.dias_especiales) if (isNaN(nuevo.hora_minima_especial) && isNaN(nuevo.hora_maxima_especial)) {
                dejar = false;
                mensaje = "Debe ingresar la hora mínima y hora máxima disponibles en horario especial"
            }

            if (dejar) {
                nuevo.creacion = + new Date();
                nuevo.creador = $scope.user.email;

                obj.$add(nuevo).then(function (ref) {
                    $("#crearModal").modal("close");
                    Materialize.toast("Amenidad creada", 8000);
                    document.getElementById("crearForm").reset();
                });

            } else {
                Materialize.toast("Error: " + mensaje, 8000);
            }
        }

        $scope.guardar = function (i) {
            var nuevo = $scope.editar;
            var dejar = true;
            var mensaje = "Existe un error"
            if (!nuevo.codigo || !nuevo.codigo.length) {
                dejar = false;
                mensaje = "Debe existir un código"
            }
            if (!nuevo.nombre || !nuevo.nombre.length) {
                dejar = false;
                mensaje = "Debe existir un nombre"
            }
            if (!nuevo.descripcion || !nuevo.descripcion.length) {
                dejar = false;
                mensaje = "Debe existir una descripción"
            }
            if (!nuevo.capacidad || isNaN(nuevo.capacidad)) {
                dejar = false;
                mensaje = "Debe ingresar la capacidad máxima"
            }
            if (!nuevo.costo_hora && !nuevo.costo_uso) {
                dejar = false;
                mensaje = "Debe ingresar o Costo por hora o Costo por uso"
            } else {
                if (nuevo.costo_uso && isNaN(nuevo.costo_uso)) {
                    dejar = false;
                    mensaje = "El costo por Uso debe ser u número"
                }
                if (nuevo.costo_hora && isNaN(nuevo.costo_hora)) {
                    dejar = false;
                    mensaje = "El costo por Hora debe ser u número"
                }
            }
            if (!nuevo.horas_maximas || isNaN(nuevo.horas_maximas)) {
                dejar = false;
                mensaje = "Debe ingresar la cantidad máxima de horas disponibles para alquiler"
            }
            if (!nuevo.deposito || isNaN(nuevo.deposito)) {
                dejar = false;
                mensaje = "Debe ingresar una cantidad para realizar en depósito"
            }
            if (!nuevo.hora_maxima || isNaN(nuevo.hora_maxima)) {
                dejar = false;
                mensaje = "Debe ingresar la hora máxima disponible en horario normal"
            }
            if (!nuevo.hora_minima || isNaN(nuevo.hora_minima)) {
                dejar = false;
                mensaje = "Debe ingresar la hora mínima disponible en horario normal"
            }
            if (nuevo.dias && nuevo.dias.constructor !== Array) {
                dejar = false;
                mensaje = "Debe ingresar los días disponibles en horario normal"
            }
            if (nuevo.dias_especiales) if (isNaN(nuevo.hora_minima_especial) && isNaN(nuevo.hora_maxima_especial)) {
                dejar = false;
                mensaje = "Debe ingresar la hora mínima y hora máxima disponibles en horario especial"
            }

            if (dejar) {
                nuevo.modficacion = + new Date();
                obj.$save(nuevo).then(function (ref) {
                    Materialize.toast("Se han guardado los cambios", 5000);
                    $("#editarModal").modal("close");
                });
            } else {
                Materialize.toast("Error: " + mensaje, 8000);
            }

        }

        $scope.editarModal = function (i) {
            $scope.editar = i;

            setTimeout(() => {
                Materialize.updateTextFields();
            }, 300);

            $("#editarModal").modal("open");
        }

        $scope.eliminarModal = function (i) {
            $scope.editar = i
            $("#eliminarModal").modal("open")
        }
        $scope.elimnar = function () {
            obj.$remove($scope.editar).then(function (ref) {
                Materialize.toast("Se ha eliminado la Amenidad", 8000);
            });
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
                    Materialize.toast("Condóminos cargados", 2000);
                } else {
                    Materialize.toast("No hay condóminos", 2000);
                }
            });
            $scope.data = obj
        }

        $scope.borrarSearch = function () {
            $scope.search = "";
        }
        $scope.subirFoto = function (nueva, idInput) {
            $scope.modificarImagen($scope.actualRef, nueva, idInput)
        }
        $scope.modificarFoto = function (i) {
            $scope.editar = i;
            $scope.actualRef = ref.child($scope.condominioSeleccionado).child(obj[i].$id).child("foto")
            $("#archivoModal").modal("open");
        }
        $scope.verAlbum = function (i) {
            var key = i.$id
            $scope.actualRef = ref.child($scope.condominioSeleccionado).child(key).child("album")
            album = $firebaseArray($scope.actualRef)
            $scope.noCargandoAlbum = false;
            album.$loaded().then(function () {
                $scope.noCargandoAlbum = true;
                setTimeout(() => {
                    $scope.$apply();
                }, 50);
            });
            $scope.album = album;
            $("#albumModal").modal("open");
        }
        $scope.modificarImagen = function (ref, nueva, idInput) {
            var name = ref.push().key
            var archivo = document.getElementById(idInput).files[0];
            if (!archivo) {
                Materialize.toast("Primero selecciona una imagen", 5000)
                return
            }
            var uploadTask = firebase.storage().ref('amenidades').child(name).put(archivo);
            waiting();
            uploadTask.on('state_changed', function (snapshot) {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case firebase.storage.TaskState.PAUSED: // or 'paused'
                        console.log('Upload is paused');
                        break;
                    case firebase.storage.TaskState.RUNNING: // or 'running'
                        console.log('Upload is running');

                        break;
                }
            }, function (error) {
                // Handle unsuccessful uploads
            }, function () {
                destroyWaiting();
                $("#archivoModal").modal("close");
                Materialize.toast("Archivo subido", 5000);
                var downloadURL = uploadTask.snapshot.downloadURL;
                if (nueva) {
                    ref.child(name).set({ imagen: downloadURL }).then(function (s) {
                        console.log("Almacenado en base de datos")
                    }).catch(function (e) {
                        Materialize.toast("No se pudo guardar en base de datos, error: " + error, 5000)
                    })
                } else {
                    ref.update({ imagen: downloadURL }).then(function (s) {
                        console.log("Almacenado en base de datos")
                    }).catch(function (e) {
                        Materialize.toast("No se pudo guardar en base de datos, error: " + error, 5000)
                    })
                }
            });
        }

        // FUNCIONES PARA NO DISPONIBLES
        $scope.verNoDisponibles = function (i) {
            $scope.editar = i;
            $("#noDisponiblesModal").modal("open");
        }
        $scope.cargarFechas = function () {
            var fref = firebase.database().ref("reservas").child($scope.anioSeleccionado).child($scope.mesSeleccionado).child("fecha");
            fechas = $firebaseArray(fref);
            $scope.noCargandoFechas = false;
            fechas.$loaded().then(function () {
                $scope.noCargandoFechas = true;
                var noDias = daysInMonth($scope.mesSeleccionado, $scope.anioSeleccionado)
                var diasA = []
                for (let i = 1; i <= noDias; i++) {
                    diasA.push(i)
                }
                $scope.diasA = diasA;
                console.log(fechas)
                $scope.fechas = fechas;
                setTimeout(() => {
                    $scope.$apply();
                }, 50);
                Materialize.toast("Fechas cargadas");
            });
        }
        $scope.modificarLaDisponibilidad = function () {
            var d = $scope.diaSeleccionado;
            var indice = $scope.fechas.$indexFor(d);
            console.log($scope.fechas, d, indice)
            var disponibilidad = true;
            var administrador = true;
            if (indice != -1)
                if ($scope.fechas[indice]) {
                    if (!$scope.fechas[indice].administrador && $scope.fechas[indice].estado) {
                        Materialize.toast("No puedes cambiar la dispoibilidad, debido a que las amenidades lo han completado", 8000);
                        return;
                    } else {
                        administrador = $scope.fechas[indice].administrador;
                        disponibilidad = !$scope.fechas[indice].estado;
                    }
                }

            if (confirm("Confirma, ¿la amenidad modificar la disponibilidad para el " + d + "/" + $scope.mesSeleccionado + "/" + $scope.anioSeleccionado)) {
                firebase.database().ref("reservas").child($scope.anioSeleccionado).child($scope.mesSeleccionado).child("fecha").child(d).update({
                    estado: disponibilidad,
                    administrador: administrador
                })
            }
        }
        // FUNCIONES PARA HORARIOS
        $scope.verHorarios = function (i) {
            $scope.editar = i
            var href = ref.child($scope.condominioSeleccionado).child($scope.editar.$id).child("horarios");
            $scope.noCargandoHorarios = false;
            horarios = $firebaseArray(href);
            horarios.$loaded().then(function () {
                $scope.noCargandoHorarios = true;
            });
            $scope.horarios = horarios;
            $("#horariosModal").modal("open");
        }
        $scope.agregarHorario = function () {
            var horario = $scope.horario;
            if (isNaN(horario.minima)) {
                Materialize.toast("Revisa la hora mínima, debe ser un número entero", 8000)
                return;
            }
            if (isNaN(horario.maxima)) {
                Materialize.toast("Revisa la hora máxima, debe ser un número entero", 8000)
                return;
            }
            var minima = parseInt(horario.minima)
            minima = minima > 24 ? 24 : minima
            minima = minima < 1 ? 1 : minima
            var maxima = parseInt(horario.maxima)
            maxima = maxima > 24 ? 24 : maxima;
            maxima = maxima < 1 ? 1 : maxima;
            if (minima > maxima) {
                Materialize.toast("El horario debe ser lógico", 8000);
                return;
            }
            $scope.horarios.$add({
                dias: horario.dia,
                minima: minima,
                maxima: maxima
            }).then(function (ref) {
                document.getElementById("agregarHorarioForm").reset();
                Materialize.toast("Se ha agregado el horario", 5000);
                $("#horariosModal").modal("open");
            })
        }
        $scope.eliminarHorario = function (i) {
            if (confirm("¿Seguro de eliminar el horario?"))
                $scope.horarios.$remove(i).then(function (ref) {
                    Materialize.toast("Se ha eliminado el horario", 5000)
                });
        }

        $scope.editarCondiciones = function (id) {
            $scope.editar = obj[obj.$indexFor(id)];
            if ($scope.editar.nota) {
                tinymce.activeEditor.setContent($scope.editar.nota);
            } else {
                tinymce.activeEditor.setContent("");
            }

            $("#htmlModal").modal("open")
        }

        $(document).ready(function () {
            $('ul.tabs').tabs();
            $(".color").each(function (value) {
                cargarColorInput(this)
            })
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
        function daysInMonth(month, year) {
            return new Date(year, month, 0).getDate();
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

