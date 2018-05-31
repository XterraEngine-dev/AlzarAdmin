"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('condominos');
var cref = firebase.database().ref('condominios');

var obj, tipo, condominios;

(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http) {
        $scope.seleccionados = [];
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

        $scope.check = function (i, v) {
            setTimeout(() => {
                if (i != null && v) {
                    if (v.selected) {
                        $scope.seleccionados = $scope.data.map(function (item) {
                            if (item.selected)
                                return {
                                    imagen: "https://chart.googleapis.com/chart?cht=qr&chl=" + item.contador + "&chs=400x400&chld=L|0",
                                    numero: item.contador
                                }
                        });
                    } else {
                        $scope.seleccionados = $scope.data.map(function (item) {
                            if (item.selected)
                                return {
                                    imagen: "https://chart.googleapis.com/chart?cht=qr&chl=" + item.contador + "&chs=400x400&chld=L|0",
                                    numero: item.contador
                                }
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
                return {
                    imagen: "https://chart.googleapis.com/chart?cht=qr&chl=" + item.contador + "&chs=400x400&chld=L|0",
                    numero: item.contador
                }
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

        $scope.imprimirQRS = function () {
            if ($scope.seleccionados.length > 0) {
                imagenes = [];
                waiting()
                var exist = $scope.seleccionados.filter(function (v) {
                    return typeof v !== 'undefined' && v !== null
                })
                console.log(exist)
                getImages(exist, 0, exist.length);
            } else {
                Materialize.toast("No hay ningun condomino seleccionado", 8000);
            }
        }
        var imagenes = [];
        function getImages(a, i, final) {

            if (i < final) {
                console.log(a[i], i)
                if (a[i])
                    convertFileToDataURLviaFileReader(a[i], function (base64Img) {

                        if (base64Img.includes("data:image/jpg;base64") || base64Img.includes("data:image/png;base64")) {
                            imagenes.push({
                                imagen: base64Img,
                                numero: a[i].numero
                            });
                        }
                        i++;
                        getImages(a, i, final)
                    })
            } else {
                createPDF(imagenes);
            }
        }
        function convertFileToDataURLviaFileReader(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                var reader = new FileReader();
                reader.onloadend = function () {
                    console.log("Resultado cargado")
                    callback(reader.result);
                }
                reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', url.imagen);
            xhr.responseType = 'blob';
            xhr.send();
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
        function createPDF(imagenes) {
            if (imagenes.length > 0) {
                var docDefinition = {
                    pageSize: 'LETTER',

                    // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
                    pageMargins: [40, 60, 60, 100],
                    content: [

                    ],
                    defaultStyle: {
                        columnGap: 20
                    }
                };
                console.log(imagenes)
                imagenes.forEach((imagen, i) => {
                    docDefinition.content.push({
                        columns: [
                            {
                                image: imagen.imagen,
                                width: 80,
                                height: 80,
                                margin: [5, 5]
                            },
                            {
                                height: 70,
                                fontSize: 12,
                                width: 80,
                                text: "No.:  " + imagen.numero,
                                margin: [5, 15]
                            }
                        ],
                        // optional space between columns
                        columnGap: 20
                    });
                });
                destroyWaiting();
                pdfMake.createPdf(docDefinition).download();
            } else {
                destroyWaiting();
                Materialize.toast("No se ha podido exportar el archivo, intenta de nuevo", 8000)
            }
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
function oddOrEven(x) {
    return (x & 1) ? false : true /*es par = true*/;

}