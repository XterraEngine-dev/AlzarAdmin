"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('tickets');
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
            obj = $firebaseArray(ref.child($scope.condominio_id).child($scope.user_data.codigo));
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    setTimeout(() => {
                        $('ul.tabs').tabs();
                    }, 300);
                } else {
                    Materialize.toast("No hay Tickets", 2000);
                }

            });
            $scope.data = obj
        }

        function cambiarLogo(file) {
            return new Promise(resolve => {
                var reader = new FileReader();
                waiting()
                reader.onloadend = function () {

                    var fileName = file.name;

                    var uploadTask = firebase.storage().ref("tickets").child(fileName).put(file);

                    uploadTask.on('state_changed', function (snapshot) {
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');

                    }, function (error) {
                        destroyWaiting();
                        Materialize.toast("Ha ocurrido un error, " + error)
                    }, function () {
                        destroyWaiting();
                        var downloadURL = uploadTask.snapshot.downloadURL;
                        $scope.new.archivo = downloadURL;
                        crearTicket($scope.new)
                    })
                }
                if (file) {
                    reader.readAsDataURL(file);
                } else {
                    preview.src = "";
                }
            });
        }

        $scope.crearTicket = function () {
            var archivo = document.getElementById("archivo").files[0];
            if (!$scope.new) {
                Materialize.toast("Primero debes ingresar la información del Ticket", 5000)
            }
            if (archivo) {
                cambiarLogo(archivo);
            } else {
                crearTicket($scope.new)
            }
        }
        function crearTicket(nuevo) {
            var fecha = new Date();
            nuevo.fecha = fecha.getTime();
            nuevo.nombre_condomino = $scope.user_data.nombre;
            nuevo.correo_condomino = $scope.user_data.correo;
            nuevo.condominio_id = $scope.condominio_id;
            nuevo.abierto = true
            ref.child($scope.condominio_id).child($scope.user_data.codigo).push(nuevo).then(function (ts) {
                
                Materialize.toast("Se ha generado un Ticket para soporte", 5000);
                $("#modalCrearTicket").modal("close");
                document.getElementById("crearForm").reset();
                firebase.database().ref("usuarios").orderByChild("condominio").equalTo($scope.condominio_id).once("value").then(function (s) {
                    s.forEach(usuario => {
                        if (usuario.val().correo) $scope.enviarCorreo(usuario.val().correo, "Ticket de Soporte #" + ts.key , nuevo.asunto)
                    });
                });
                $scope.$apply(function () {
                    $scope.new = {};
                })
            });
        }

        $scope.borrarSearch = function () {
            $scope.search = "";
        }

        $scope.abrirRespuestas = function (objeto) {
            $("#modalRespuestas").modal('open');
            $scope.editar = objeto;
            $scope.respuesta = {}
            var respuestas = $firebaseArray(ref.child($scope.condominio_id).child($scope.user_data.codigo).child(objeto.$id).child("respuestas"));
            respuestas.$loaded().then(function() {
                Materialize.updateTextFields();
            })
            $scope.respuestas = respuestas;
        }
        $scope.crearRespuesta = function (m) {
            console.log($scope.respuesta, m)
            if ($scope.respuesta) {
                $scope.respuesta.condomino = true
                var hoy = new Date();
                $scope.respuesta.fecha = hoy.getTime();
                $scope.respuestas.$add($scope.respuesta).then(function (s) {
                    console.log(s)
                    Materialize.toast("Respuesta enviada", 5000);
                    document.getElementById("enviarRespuesta").reset();
                    firebase.database().ref("usuarios").orderByChild("condominio").equalTo($scope.condominio_id).once("value").then(function (s) {
                        s.forEach(usuario => {
                            if (usuario.val().correo) $scope.enviarCorreo(usuario.val().correo, "Ticket de Atención #" + $scope.editar.$id, $scope.respuesta.mensaje)
                        });
                    });
                });
            }
        }
        $scope.enviarCorreo = function (correo, titulo, mensaje) {
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarCorreo',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            receptor: correo,
                            mensaje: mensajeTemplate($scope.user_data.nombre, mensaje),
                            titulo: titulo,
                            logo: $scope.condominio_data.logo,
                            condominio_nombre: $scope.condominio_data.nombre,
                            emisor: $scope.user_data.correo
                        }
                    })
                },
                success: function (data, textStatus, xhr) {
                    
                },
                error: function (error) {
                    console.log(error)
                }
            });
        }
        function mensajeTemplate(nombre_condominio, mensaje) {
            return `
            <p>
                Se ha utilizado el sistema de tickets, por el condomino: ${nombre_condominio}.
                <br>
                <br>
                El mensaje es: ${mensaje}
            </p>
            `
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
