$( document ).ready(function() {


    $('.collapsible').collapsible();
    $('ul.tabs').tabs({
    });
    $('#aBNC').click(function( event ) {
        event.preventDefault();
    });
    $('#nBNC').click(function( event ) {
        event.preventDefault();
    });
    $('select').material_select();


    $('#loginCard').jAnimateOnce('fadeIn');
    $('#userDiv').jAnimateOnce('slideInRight');
    $('#passwordDiv').jAnimateOnce('slideInRight');
    $('#sendDiv').jAnimateOnce('slideInRight');
    $('#title').jAnimateOnce('zoomIn');
    $('#sendDiv').click( function(e){
    });
    $.validator.addMethod("valueNotEquals", function(value, element, arg){
        return arg !== value;
    }, "El valor no puede ser igual al propuesto.");
    $("#signInForm").validate({
        rules: {
			passwordE: {
				required: true,
				minlength: 6
			},
			emailE: {
				required: true,
				email: true
            },
            codigoEmpresa: {
                required: true,
                minlength: 6,
                maxlength: 6
            },
            edad: {
                required: true,
                range: [17,99],
                number: true
            },
            apellido: {
                required: true
            },
            nombre: {
                required: true
            },
            sexo: { 
                valueNotEquals: ""
            },
            dpi: {
                required: true,
                number: true
            }
        },
		messages: {
			passwordE: {
				required: "Por favor ingresa tu contraseña",
				minlength: "La contraseña debe contener al menos 5 carácteres"
            },
            codigoEmpresa: {
				required: "Por favor ingresa el código de seguridad",
                minlength: "El código debe contener 6 carácteres",
                maxlength: "El código debe contener 6 carácteres",
            },
            emailE: "Ingresa un correo válido",
            nombre: "Ingresa tus nombres",
            apellido: "Ingresa tus apellidos",
            sexo: {
				required: "Por favor selecciona tu sexo"
            },
            edad: {
                required: "Por favor ingresa tu edad", 
                number: "Ingresa tu edad como un número"
            },
            dpi: {
                required: "Por favor ingresa tu DPI", 
                number: "Por favor ingresa tu DPI como un número"
            },
		},
            invalidHandler: function(event, validator) {
                var errors = validator.numberOfInvalids();
                if (errors) {
                    $('#sendDiv').jAnimate("tada");
                    Materialize.toast("Revisa los datos, errores: " + errors, 3000)
                } else {
                    
                }
            },
            submitHandler: function(form) {
                var key = firebase.database().ref("crearUsuarios").push({
                    correo: form.emailE.value,
                    contrasena: form.passwordE.value,
                    empresaUid: actualEmpresaUid.value,
                    nombres: form.nombre.value,
                    apellidos: form.apellido.value,
                    sexo: form.sexo.value,
                    edad: form.edad.value,
                    dpi: form.dpi.value
                }).key;
                firebase.database().ref("crearUsuarios").child(key).on("child_removed", function(data){
                    firebase.auth().signInWithEmailAndPassword(form.emailE.value, form.passwordE.value).then(function(user) {
                        if (user) {
                            window.location.assign("/index.html");
                        }
                    }).catch(function(error) {
                        if (error) {
                            var errorCode = error.code;
                            var errorMessage = error.message;
                            Materialize.toast("Algo ha ocurrido, error: " + error.message, 5000);
                            console.error(error.code);
                        }
                    });
                });
            }
    })
    $("#logInForm").validate({
			rules: {
				password: {
					required: true,
					minlength: 6
				},
				user: {
					required: true,
					email: true
                },
                codigoEmpresa: {
                    required: true,
                    minlength: 6,
                    maxlength: 6
                }
			},
			messages: {
				password: {
					required: "Por favor ingresa tu contraseña",
					minlength: "La contraseña debe contener al menos 5 carácteres"
                },
                codigoEmpresa: {
					required: "Por favor ingresa el código de seguridad",
                    minlength: "El código debe contener 6 carácteres",
                    maxlength: "El código debe contener 6 carácteres",
                },
				user: "Ingresa un correo válido"
			},
            invalidHandler: function(event, validator) {
                console.log(errors)
                var errors = validator.numberOfInvalids();
                if (errors) {
                    $('#sendDiv').jAnimate("tada");
                    Materialize.toast("Revisa los datos, errores: " + errors, 3000)
                } else {
                    
                }
            },
            submitHandler: function(form) {
                $('#sendI').jAnimate("bounceOut");
                firebase.auth().signInWithEmailAndPassword(form.user.value, form.password.value).then(function(user) {
                    $('#sendI').jAnimate("fadeOutLeftBig");
                    console.log(user);
                }).catch(function(error) {
                    if (error) {
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        Materialize.toast("Algo ha ocurrido, error: " + error.message, 5000);
                        console.error(error.code);
                    }
                });
            }
    });
    
});
var actualEmpresaUid;
function verificarCodigoEmpresa(){
    var codigoEmpresa = $("#codigoEmpresa").val().toUpperCase();
    if ($("#codigoEmpresa").valid()) {
        console.log(codigoEmpresa)
        waiting();
         firebase.database().ref('empresasCodigos').child(codigoEmpresa).once("value", function(snapshot){
            destroyWaiting();
            if (snapshot.val()) {
                Materialize.toast("Empresa correcta", 3000);
                actualEmpresaUid = snapshot.val().empresaUid;
                firebase.database().ref('empresas').child(snapshot.val().empresaUid).once("value", function(element) {
                    
                    var datos = element.val();
                    $("#firstStep").fadeOut(300);
                    $("#nextStep").fadeIn(300);
                    if (datos.logo) {
                        $("#logoEmpresa").attr("src", datos.logo);
                        $("#nombreEmpresa").html(datos.nombre);
                    }
                    if (datos.sucursales) {
                        $.each(datos.sucursales, function(index, value) {
                            $("#sucursal").append('<option value="'+index+'" selected>'+value.nombre+'</option>')
                        }); 
                        $('select').material_select();
                    }
                });    
                    
            } else {
                Materialize.toast("No se ha encontrado el código", 3000);
                
                $("#codigoEmpresa").val("")
            }
        }, function(error){
            destroyWaiting();
            if (error) {
                console.log(error)
                Materialize.toast("No se ha encontrado el código", 3000);
                $("#codigoEmpresa").val("");
            } else {

            }
        })
    }
}