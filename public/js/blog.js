"use strict";


var OneSignal = window.OneSignal || [];
OneSignal.push(["init", {
    appId: "533a19a2-edee-469d-8c6b-664aaadc532d",
    autoRegister: false,
    notifyButton: {
        enable: true, /* Required to use the notify button */
        size: 'medium', /* One of 'small', 'medium', or 'large' */
        theme: 'default', /* One of 'default' (red-white) or 'inverse" (white-red) */
        position: 'bottom-right', /* Either 'bottom-left' or 'bottom-right' */
        offset: {
            bottom: '0px',
            left: '0px', /* Only applied if bottom-left */
            right: '0px' /* Only applied if bottom-right */
        },
        prenotify: true, /* Show an icon with 1 unread message for first-time site visitors */
        showCredit: false, /* Hide the OneSignal logo */
        text: {
            'tip.state.unsubscribed': 'Suscribirse',
            'tip.state.subscribed': "Ya estás suscrito",
            'tip.state.blocked': "Estás bloqueado",
            'message.prenotify': 'Click para suscribirse',
            'message.action.subscribed': "¡Gracias por suscribirse!",
            'message.action.resubscribed': "Ya estás suscrito",
            'message.action.unsubscribed': "No volverás a recibir notificaciones",
            'dialog.main.title': 'Administrar notificaciones',
            'dialog.main.button.subscribe': 'SUBSCRIBIR',
            'dialog.main.button.unsubscribe': 'ELIMINAR SUSCRIPCIÓN',
            'dialog.blocked.title': 'Desbloquear notificaciones',
            'dialog.blocked.message': "Sigue las instrucciones:"
        },
        promptOptions: {
            /* These prompt options values configure both the HTTP prompt and the HTTP popup. */
            /* actionMessage limited to 90 characters */
            siteName: 'Correo Express GT',
            actionMessage: "Por favor suscribete.",
            /* acceptButtonText limited to 15 characters */
            acceptButtonText: "PERMITIR",
            /* cancelButtonText limited to 15 characters */
            cancelButtonText: "NO GRACIAS"
        }
    }
}]);


var currentUserType;
var usuario;

var ref = firebase.database().ref('blog');
var obj, tipo;

(function () {
    var app = angular.module("app", ["ngSanitize","firebase", "colorpicker.module"]);

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

                OneSignal.push(function () {
                    OneSignal.getUserId().then(function (userId) {
                        console.log("OneSignal User ID:", userId);
                        if (userId) {
                            firebase.auth().onAuthStateChanged(function (a) {
                                if (null !== a) {
                                    var a = firebase.auth().currentUser;
                                    if (null != a) {
                                        var uid = a.uid;
                                        firebase.database().ref("condominos").child($scope.condominio_id).child(uid).update({
                                            oneSignal: userId
                                        });
                                        OneSignal.sendTag("condominio", $scope.condominio_id);
                                    }
                                }
                            });

                        }
                    });
                });
            } else {
                window.location.replace("login.html")
            }
        });

        function cargarAmenidades() {
            obj = $firebaseArray(ref.child($scope.condominio_id).orderByChild("fecha").limitToLast(10));
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    setTimeout(() => {
                        $('ul.tabs').tabs();
                    }, 300);
                } else {
                    Materialize.toast("No hay amenidades", 2000);
                }

            });
            $scope.data = obj
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
