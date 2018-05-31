var currentUserType;
var usuario;

var ref = firebase.database().ref('condominios');
var obj, tipo;

(function () {
    var app = angular.module("app", ["firebase", "colorpicker.module"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http) {

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                firebase.auth().currentUser.getIdToken()
                    .then(function (idToken) {
                        // Parse the ID token.
                        const payload = JSON.parse(b64DecodeUnicode(idToken.split('.')[1]));
                        // Confirm the user is an Admin.
                        if (payload["administrador"] || payload["coordinador"] || user.email === "admin@alzar.com.gt") {
                            if (payload["coordinador"] || user.email === "admin@alzar.com.gt") {
                                cargarCondominios();
                            } else {
                                firebase.database().ref("usuarios").child(user.uid).child("condominio").once("value").then(function (s) {
                                    if (s.val()) {
                                        console.log(s.val())
                                        cargarCondominios(s.val());
                                    }
                                })

                            }
                        } else {
                            window.location.replace("login.html")
                        }
                    });
            } else {
                window.location.replace("login.html")
            }
        });

        $scope.crear = function (valid) {
            console.log(valid)
            
            if (valid) {

                var file = document.getElementById("logo").files[0];
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

                        var file2 = document.getElementById("logoFi").files[0];
                        var preview2 = document.getElementById('imgPreviewFi');
                        var reader2 = new FileReader();

                        reader2.onloadend = function () {

                            preview2.src = reader2.result;
                            var width = preview2.clientWidth;
                            var height = preview2.clientHeight;

                            if (width / height !== 1) {
                                Materialize.toast("Debe ser una imagen cuadrada (Proporción 1:1)", 10000);
                            }
                            var fileName2 = file2.name;

                            var uploadTask2 = firebase.storage().ref("condominios").child(fileName2).put(file2);

                            uploadTask2.on('state_changed', function (snapshot) {
                                var progress2 = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                console.log('Upload is ' + progress2 + '% done');
                                $("#progresoFileFi").width(progress2 + "%");
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
                                var downloadURL2 = uploadTask2.snapshot.downloadURL;

                                var timeStamp = new Date().getTime();

                                $scope.new.logo = downloadURL;
                                $scope.new.fondo = downloadURL2;
                                $scope.new.fecha_creacion = timeStamp;
                              

                                var llave = ref.push().key

                                $scope.new.creador = $scope.user.email;
                                $scope.new.fid = llave;
                                if ($scope.new.maximo_disponible) $scope.new.maximo_disponible = parseInt($scope.new.maximo_disponible || 0) || 0;
                       
                                
                                ref.child(llave).set($scope.new).then(function (snap) {
                                    Materialize.toast("Se ha creado el condominio", 5000);
                                })

                                document.getElementById("crearForm").reset();
                                $("#crearModal").modal("close")

                            });
                        }

                        if (file2) {
                            reader2.readAsDataURL(file2);
                        } else {
                            preview2.src = "";
                        }


                    })
                }
                if (file) {
                    reader.readAsDataURL(file);
                } else {
                    preview.src = "";
                }


            } else {
                Materialize.toast("Revisa el formulario", 8000)
            }

       
        }

        $scope.guardar = function (i) {
            if ($scope.editar.maximo_disponible) $scope.editar.maximo_disponible = parseInt($scope.editar.maximo_disponible  || 0) ||  0;
            obj.$save($scope.editar).then(function (ref) {
                Materialize.toast("Se han guardado los cambios", 5000);
                $("#editarModal").modal("close");
            });
        }

        $scope.editarModal = function (i) {
            $scope.editar = i;

            setTimeout(() => {
                Materialize.updateTextFields();
            }, 300);

            $("#editarModal").modal("open");
        }

        $scope.eliminar = function () {
            obj.$remove($scope.editar).then(function (ref) {
                Materialize.toast("Se ha eliminado ƒ condominio", 5000);
                $("#eliminarModal").modal("close")
            }).catch(function (e) {
                Materialize.toast("Algo ha ocurrido, el servidor dice: " + e, 8000)
            });
        }

        $scope.eliminarModal = function (i) {
            $scope.editar = i;
            $("#eliminarModal").modal("open");
        }

        function cargarCondominios(id) {
            var tref = ref
            if (id) {
                tref = ref.orderByChild("fid").equalTo(id)
            }
            obj = $firebaseArray(tref);
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    Materialize.toast("Condominios cargados", 2000);
                } else {
                    Materialize.toast("No hay condominios", 2000);
                }

            });
            $scope.data = obj
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

                    $scope.editar.logo = downloadURL;

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
        $scope.cambiarFondo = function () {
            var file = document.getElementById("logoF").files[0];
            var preview = document.getElementById('imgPreviewF');
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
                    $("#progresoFileF").width(progress + "%");
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

                    $scope.editar.fondo = downloadURL;

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
