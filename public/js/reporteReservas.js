"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('formularios');



var uref = firebase.database().ref('condominos');
var cref = firebase.database().ref('condominios');
var aref = firebase.database().ref('amenidades');
var obj, tipo, condominios, condominos, lecturas, amenidades;

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
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
        ];
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
        }) // CARGAR DATOS DE USUARIO
        $scope.cargarCondominio = function (id) {

            if (!$scope.condominioSeleccionado)
                $scope.condominioSeleccionado = id;
            if (!id)
                id = $scope.condominioSeleccionado;

            var mesT = $scope.mesSeleccionado;
            var anioT = $scope.anioSeleccionado;

            if (!id || !mesT || !anioT)
                return;

            $scope.amenidades = $firebaseArray(aref.child(id));
            $scope.amenidades.$loaded().then(function () {
                console.log("Amenidades", $scope.amenidades)
            })


            if (!$scope.amenidadSeleccionada) {
                Materialize.toast("Seleccione una amenidad", 5000);
                return;
            }
            if (!$scope.mesSeleccionado) {
                Materialize.toast("Seleccione un mes", 5000);
                return;
            }
            if (!$scope.anioSeleccionado) {
                Materialize.toast("Seleccione un año", 5000);
                return;
            }
            $scope.noCargando = false;
            var tref = ref.child(id).child($scope.amenidadSeleccionada).child($scope.anioSeleccionado).child($scope.mesSeleccionado)
            $scope.data = $firebaseArray(tref);
            $scope.data.$loaded().then(function () {
                console.log($scope.data, tref)
                Materialize.toast("Formularios de reservas buscados", 5000);
                $scope.noCargando = true;
            });

        }
        $scope.exportarUsuarios = function () {
            var mystyle = {
                sheetid: 'FORMULARIOS DE RESERVA ' + condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre + " " + $scope.amenidades[$scope.amenidades.$indexFor($scope.amenidadSeleccionada)].nombre + " " + $scope.mesSeleccionado + "-" + $scope.anioSeleccionado,
                headers: true,
                caption: {
                    title: 'FORMULARIOS DE RESERVA ' + condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre + " " + $scope.amenidades[$scope.amenidades.$indexFor($scope.amenidadSeleccionada)].nombre + " " + $scope.mesSeleccionado + "-" + $scope.anioSeleccionado
                },
                columns: [
                    { columnid: 'no_reserva', title: "No. Reserva" },
                    { columnid: 'codigo', title: "Código de Domicilio" },
                    { columnid: 'nombre', title: 'Nombre de quien reserva' },
                    { columnid: 'telefono', title: "Teléfono de quien reserva" },
                    { columnid: 'fecha', title: "Fecha de reservación" },
                    { columnid: 'minima', title: "Hora inicial" },
                    { columnid: 'maxima', title: "Hora final" },
                    { columnid: 'invitados', title: "No. Invitados" },
                    { columnid: 'valor_reserva', title: "Valor de la Reserva" },
                ]
            };
            $scope.lecturas = []
            $scope.data.forEach(u => {
                var fechat = timeConverter(u.fecha);
                $scope.lecturas.push({
                    no_reserva: u.$id || "",
                    codigo: u.codigo || "",
                    nombre: u.nombre || "",
                    telefono: u.telefono || "",
                    fecha: fechat || "",
                    minima: u.minima || "",
                    maxima: u.maxima || "",
                    invitados: u.invitados || "",
                    valor_reserva: u.valor_reserva || "",
                });
            });
            alasql('SELECT * INTO XLS("FORMULARIOS DE RESERVA.xls",?) FROM ?', [mystyle, $scope.lecturas]);
        }
        $scope.enviarRecordatorios = function () {
            if ($scope.data.length > 0) {
                waiting();
                enviarRecordatorio($scope.data, 0, $scope.data.length - 1);
            }
        }
        var d = new Date();
        // Set it to one month ago
        d.setDate(d.getDate() - 3);

        $scope.actual_time_menos_3 = d.getTime();
        console.log($scope.actual_time_menos_3)
        $scope.verHistorial = function (i) {
            var contador = $scope.data[i].contador
            lecturas = $firebaseArray(ref.child($scope.condominioSeleccionado).child(contador));
            $scope.lecturas = lecturas;
            $("#modalHistorial").modal("open")
        }
        $scope.eliminarReserva = function (i) {
            if (confirm("¿Está seguro de eliminar la Reserva?"))
                $scope.data.$remove(i).then(function (ref) {
                    Materialize.toast("El formulario de Reserva se ha eliminado", 8000);
                });
        }
        function enviarRecordatorio(a, j, final) {
            var u = a[j]
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarCorreo',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            receptor: u.correo,
                            mensaje: mensajeTemplate(u.codigo, u.l_actual, u.l_anterior, u.lectura, timeConverter(u.fecha)),
                            titulo: "Lectura de consumo de Agua Potable",
                            logo: condominios[condominios.$indexFor($scope.condominioSeleccionado)].logo,
                            condominio_nombre: condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre,
                            emisor: $scope.user.email
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
        function mensajeTemplate(no_casa, l_actual, l_anterior, lectura, fecha) {
            return `
            <p>La casa ${no_casa}, ha consumido <b>${lectura} metros cúbicos</b>.
            <br><br><br>
            La lectura actual del contador es de ${l_actual} metros cúbicos, y la lectura anterior ${l_anterior} metros cúbicos. 
            La fecha de la toma de lectura es ${fecha}.
            <br><br><br>
            Si tiene dudas o consultas con su lectura o consumos, por favor hacerlas a la Administración durante los 3 días siguientes a la fecha de esta lectura.
            `
        }
        function timeConverter(UNIX_timestamp) {
            var a = new Date(UNIX_timestamp);
            var year = a.getFullYear();
            var month = a.getMonth() + 1;
            var date = a.getDate();
            var time = date + '/' + month + '/' + year;
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