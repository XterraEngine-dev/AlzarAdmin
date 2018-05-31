"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('mis_reservas');
var refFF = firebase.database().ref('formularios');
var obj, tipo;


var uid_condominio;


var uid_formulario;
var uid_amenidad;
var uid_condomino;

var nombre_usuario;


(function () {
    var app = angular.module("app", ["firebase", "colorpicker.module"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http) {
        $scope.condominio_nombre = localStorage.getItem("condominio_nombre");
        console.log($scope.condominio_nombre)
        $scope.condominio_id = localStorage.getItem("condominio_id");

        uid_condominio = localStorage.getItem("condominio_id");



        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                // console.log('uid_condomino: ' + $scope.user);

                uid_condomino = $scope.user.uid;

                console.log($scope.user.uid);




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
            var hoy = new Date();
            hoy.setMonth(hoy.getMonth() - 6);
            hoy.setHours(0, 0, 0, 0);
            var hoy_6_meses = new Date();
            hoy_6_meses.setMonth(hoy_6_meses.getMonth() + 1);
            var inicioVigenciaTimeStamp = hoy.getTime();
            var finalVigenciaTimeStamp = hoy_6_meses.getTime()
            obj = $firebaseArray(ref.child(uid_condominio).child(uid_condomino).orderByChild("fecha").startAt(inicioVigenciaTimeStamp).endAt(finalVigenciaTimeStamp));
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    setTimeout(() => {
                        $('ul.tabs').tabs();
                    }, 300);
                } else {
                    Materialize.toast("No hay reservas", 2000);
                }
            });
            $scope.data = obj
        }

        $scope.realizarReserva = function (id, id_formulario) {

            uid_amenidad = id;
            uid_formulario = id_formulario;

            $("#modalFormulario").modal("open")

            console.log('id_formulario: ' + id_formulario);
            refFF.child(uid_condominio).child(uid_condomino).child(id).once("value").then(function (s) {
                $scope.$apply(function () {
                    $scope.formulario_id = id_formulario;
                    $scope.formulario = s.val();



                    console.log("uid_amenidad" + id);
                    // console.log($scope.formulario)
                });
            });
       
        }
        $scope.guardarDatos = function () {

            if (!$scope.datos.numero || !$scope.datos.nombre) {
                Materialize.toast("No has ingresado todos los datos", 5000);
                return;
            }
            var file = document.getElementById("archivo").files[0];

            if (!file) {
                alert("Por favor toma una fotografía a la boleta y súbela")
                return;
            }

            var reader = new FileReader();
            waiting();
            reader.onloadend = function () {
                var fileName = file.name;
                var uploadTask = firebase.storage().ref("mis_reservas").child(fileName).put(file);

                uploadTask.on('state_changed', function (snapshot) {
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                }, function (error) {
                    Materialize.toast("Ha ocurrido un error, " + error)
                }, function () {
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    var hoy = new Date();
                    $scope.datos.foto = downloadURL;

                    //FORMULARIOS

                    refFF.child(uid_condominio).child(uid_amenidad).child(uid_formulario).update({
                        numero_boleta: $scope.datos.numero,
                        banco_boleta: $scope.datos.nombre,
                        fecha_deposito: hoy.getTime(),
                        imagen: downloadURL,
                        estado: "aprobacion"
                    });

                    //MIS RESERVAS

                        ref.child(uid_condominio).child(uid_condomino).child(uid_formulario).update({
                            numero_boleta: $scope.datos.numero,
                            banco_boleta: $scope.datos.nombre,
                            imagen: downloadURL,
                            fecha_deposito: hoy.getTime(),
                            estado: "aprobacion"
                        }).then(function (s) {
                        firebase.database().ref("usuarios").orderByChild("condominio").equalTo($scope.condominio_id).once("value").then(function (s) {
                            s.forEach(usuario => {
                                if (usuario.val().correo) $scope.enviarCorreo(usuario.val().correo)
                            });
                        })
                    })
                    //aqui cerrar model 
                    Materialize.toast("Los datos se han enviado", 5000);
                    // window.close();
                    destroyWaiting();
                });
            }

            reader.readAsDataURL(file);

        }

        $scope.borrarSearch = function () {
            $scope.search = "";

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
                    // alert('Closed');
                }
            });
        });
        $scope.enviarCorreo = function (correo) {
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarCorreo',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            receptor: correo,
                            mensaje: mensajeTemplate($scope.formulario.nombre, $scope.condominio_data.nombre, $scope.user_data.nombre, $scope.formulario.fecha_seleccionada, $scope.formulario.total),
                            titulo: "Datos de pago de reserva entregados",
                            logo: $scope.condominio_data.logo,
                            condominio_nombre: $scope.condominio_data.nombre,
                            emisor: $scope.user_data.correo
                        }
                    })
                },
                success: function (data, textStatus, xhr) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                },
                error: function (error) {
                    console.log(error)
                }
            });
        }
        function mensajeTemplate(nombre_amenidad, nombre_condominio, nombre_condomino, fecha_seleccionada, total) {
            return `
            <p>
                Se han enviado datos de pago para una reserva de la amenidad ${nombre_amenidad}, del condominio ${nombre_condominio}. <br><br>
                Reserva realizada por: ${nombre_condomino}.
                <br>
                <br>
                Para la fecha: ${timeConverter(fecha_seleccionada)}
                <br>
                <br>
                Por un valor total de: Q ${total}.
                <br>
                <br>
                Para ver los formularios de reserva haz clic <a href="https://app.alzar.com.gt/admin/reservas.html" target="_blank">aquí</a>.
            </p>
            `
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

