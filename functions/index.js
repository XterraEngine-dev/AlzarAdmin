const functions = require('firebase-functions');

const admin = require("firebase-admin");

var request = require('request');
const url = require('url');
const mkdirp = require('mkdirp-promise');

const _ = require('lodash');

const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

var serviceAccount = require("./service-account.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://alzargt.firebaseio.com"
});

const OneSignal = require('onesignal-node');
// create a new clinet 
const client = new OneSignal.Client({
    userAuthKey: 'ODlmMTA1ODYtYWZjMC00NzQwLWI4OWUtODc2ZTk0OGY5ZmIy',
    // note that "app" must have "appAuthKey" and "appId" keys
    app: { appAuthKey: 'ODlmMTA1ODYtYWZjMC00NzQwLWI4OWUtODc2ZTk0OGY5ZmIy', appId: '533a19a2-edee-469d-8c6b-664aaadc532d' }
});

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

var auth = {
    auth: {
        api_key: 'key-255ec2a4759f7c6b2306f9c297c7cfe4',
        domain: 'alzar.com.gt'
    }
}

var nodemailerMailgun = nodemailer.createTransport(mg(auth));
exports.enviarPush = functions.https.onRequest((req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    if (req.method === 'PUT') {
        res.status(403).send('¡Prohibido!');
        return;
    }
    if (req.method === 'POST') {
        var mensaje = req.body.mensaje;
        console.log(req.body)
        if (req.body.json) {
            var js = JSON.parse(req.body.json)
            mensaje = js.mensaje
            console.log(js)
        }
        if (typeof req.body === 'string') {
            var js = JSON.parse(req.body)
            mensaje = js.mensaje
            console.log(js)
        }
        var firstNotification = new OneSignal.Notification({
            contents: {
                en: mensaje.mensaje,
            }
        });
        firstNotification.setFilters([
            {
                "field": "tag",
                "key": "condominio",
                "relation": "=",
                "value": mensaje.segmentos
            }
        ]);
        console.log(firstNotification)
        client.sendNotification(firstNotification, function (err, httpResponse, data) {

            if (err) {
                console.log(err)
                res.status(400).send("Incorrecto, " + err);
            } else {
                console.log(data)
                res.status(200).send(data);
            }
        });
    } else {
        res.status(400).send("Incorrecto, " + "no hay mensaje");
    }
})

exports.amenidades = functions.database.ref('/amenidades/{conID}/{ameID}').onWrite(event => {
    var accion;
    if (event.data.previous.exists()) {
        // MODIFICACIÓN
        accion = "Modificación"

    } else {
        // CREACIÓN
        if (event.data.exists()) {
            accion = "Creación"
        }
    }
    if (!event.data.exists()) {
        // DELETION
        accion = "Eliminación"
        return null;
    }
    admin.database().ref("consola").push({
        usuario: event.params.userId,
        fecha: admin.database.ServerValue.TIMESTAMP,
        accion: accion + " de la amenidad " + event.data.val().nombre
    }).then(function () {
        return null;
    });
});
exports.condominios = functions.database.ref('/condominios/{conID}').onWrite(event => {
    var accion;
    if (event.data.previous.exists()) {
        // MODIFICACIÓN
        accion = "Modificación"

    } else {
        // CREACIÓN
        if (event.data.exists()) {
            accion = "Creación"
        }
    }
    if (!event.data.exists()) {
        // DELETION
        accion = "Eliminación"
        return null;
    }
    admin.database().ref("consola").push({
        usuario: event.params.userId,
        fecha: admin.database.ServerValue.TIMESTAMP,
        accion: accion + " del condominio " + event.data.val().nombre
    }).then(function () {
        return null;
    });
});
exports.tickets = functions.database.ref('/tickets/{tiID}/{condominoID}').onWrite(event => {
    var accion;
    if (event.data.previous.exists()) {
        // MODIFICACIÓN
        accion = "Modificación"

    } else {
        // CREACIÓN
        if (event.data.exists()) {
            accion = "Creación"
        }
    }
    if (!event.data.exists()) {
        // DELETION
        accion = "Eliminación"
        return null;
    }
    admin.database().ref("consola").push({
        usuario: event.params.userId,
        fecha: admin.database.ServerValue.TIMESTAMP,
        accion: accion + " del ticker del condominio " + event.data.val().nombre_condominio + " para el usuario " + event.data.val().correo_condomino + " con el código: " + event.params.condominoID
    }).then(function () {
        return null;
    });
});
exports.sanciones = functions.database.ref('/sanciones/{sanID}').onWrite(event => {
    var accion;
    if (event.data.previous.exists()) {
        // MODIFICACIÓN
        accion = "Modificación"

    } else {
        // CREACIÓN
        if (event.data.exists()) {
            accion = "Creación"
        }
    }
    if (!event.data.exists()) {
        // DELETION
        accion = "Eliminación"
        return null;
    }
    admin.database().ref("consola").push({
        usuario: event.params.userId,
        fecha: admin.database.ServerValue.TIMESTAMP,
        accion: accion + " de la sanción del condominio " + event.data.val().condominio
    }).then(function () {
        return null;
    });
});
exports.enviarCorreo = functions.https.onRequest((req, res) => {

    res.set('Access-Control-Allow-Origin', '*')

    if (req.method === 'PUT') {
        res.status(403).send('¡Prohibido!');
        return;
    }

    if (req.method === 'POST') {

        var mensaje = req.body.mensaje;
        console.log(req.body)
        if (req.body.json) {
            var js = JSON.parse(req.body.json)
            mensaje = js.mensaje
            console.log(js)
        }
        if (typeof req.body === 'string') {
            var js = JSON.parse(req.body)
            mensaje = js.mensaje
            console.log(js)
        }
        var receptor = mensaje.receptor;
        var titulo = mensaje.titulo;
        var mensaje_t = mensaje.mensaje;
        var logo = mensaje.logo;
        var condominio_nombre = mensaje.condominio_nombre;
        var emisor = mensaje.emisor;
        if (mensaje) {
            nodemailerMailgun.sendMail({
                from: { name: condominio_nombre, address: emisor },
                to: receptor,
                subject: titulo,
                'h:Reply-To': emisor,
                html: correo(titulo, mensaje_t, logo),
                text: mensaje
            }, function (err, info) {
                if (err) {
                    console.log('Error: ' + err);
                    res.status(400).send("Incorrecto, " + err);
                }
                else {
                    console.log('Response: ' + info);
                    res.status(200).send("Correcto, " + info);


                }
                return;
            });
        }
    }
});

exports.crearUsuario = functions.https.onRequest((req, res) => {

    res.set('Access-Control-Allow-Origin', '*')

    if (req.method === 'PUT') {
        res.status(403).send('¡Prohibido!');
        return;
    }

    if (req.method === 'POST') {

        var id = req.body.id;
        var usuario = req.body.usuario;
        console.log(req.body)
        if (req.body.json) {
            var js = JSON.parse(req.body.json)
            id = js.id;
            usuario = js.usuario
            console.log(js)
        }
        if (typeof req.body === 'string') {
            var js = JSON.parse(req.body)
            id = js.id;
            usuario = js.usuario
            console.log(js)
        }
        if (id) {
            console.log("Creando usuario");

            admin.auth().getUser(id).then((userRecord) => {
                // The claims can be accessed on the user record.
                console.log(userRecord)
                if (userRecord && (userRecord.email === "admin@alzar.com.gt" || (userRecord.customClaims && userRecord.customClaims.coordinador))) {
                    var displayName = ""

                    if (usuario.nombre) {
                        displayName = usuario.nombre
                    }

                    admin.auth().createUser({
                        email: usuario.correo,
                        emailVerified: false,
                        password: usuario.contrasena,
                        displayName: displayName,
                        photoURL: usuario.foto,
                        disabled: false
                    }).then(function (userRecord) {
                        console.log("Successfully created new user:", userRecord.uid);
                        admin.database().ref("usuarios").child(userRecord.uid).set(usuario).then(function () {
                            var obj = {};
                            if (usuario.tipo == "coordinador") {
                                obj["coordinador"] = true;
                            }
                            if (usuario.tipo == "administrador") {
                                obj["administrador"] = true;
                                obj["condominio"] = usuario.condominio;
                            }
                            admin.auth().setCustomUserClaims(userRecord.uid, obj).then(function () {
                                res.status(200).send("correcto");
                                return;
                            }).catch(function (error) {
                                res.status(400).send("No se han podido asignar permisos de partido");
                                return
                            })
                        }).catch(function (error) {
                            res.status(400).send("No se ha guardado el condomino, " + error);
                            return;
                        })
                    }).catch(function (error) {
                        res.status(400).send("Incorrecto, " + error);
                        return;
                    });
                } else {
                    res.status(400).send("No tiene permisos para crear un condomino");
                }
            });

        } else {
            console.log(req.body)
            res.status(400).send("Se requiere UID ");
            return;
        }
    } else {
        res.status(400).send("Sólo se permiten peticiones PUT");
        return;
    }

});

exports.eliminarUsuario = functions.https.onRequest((req, res) => {
    res.header("Access-COntrol-Allow-Origin", "*");
    if (req.method === 'PUT') {
        res.status(403).send('¡Prohibido!');
        return;
    }

    if (req.method === 'POST') {
        var uid = req.body.user_id;
        var id = req.body.id
        if (req.body.json) {
            var js = JSON.parse(req.body.json)
            id = js.id;
            uid = js.user_id;
            console.log(js)
        }
        if (typeof req.body === 'string') {
            var js = JSON.parse(req.body)
            id = js.id;
            uid = js.user_id;
            console.log(js)
        }

        if (id) {
            console.log("El usuario", id, "está eliminando a: " + uid);

            admin.auth().getUser(id).then((userRecord) => {
                if (userRecord && (userRecord.email === "admin@alzar.com.gt" || (userRecord.customClaims && userRecord.customClaims.coordinador))) {
                    admin.auth().deleteUser(uid).then(function () {
                        console.log("Se ha eliminado al usuario");
                        admin.database().ref("usuarios").child(uid).set({}).then(function () {
                            res.status(200).send("Se ha eliminado al usuario");
                            return;
                        }).catch(function (error) {
                            res.status(400).send("No se ha eliminado al usuario de la base de datos, " + error);
                            return;
                        })
                    }).catch(function (error) {
                        console.log("Error eliminando al usuario, ", error);
                        res.status(400).send("No se ha eliminado al usuario, " + error);
                        return;
                    });
                } else {
                    res.status(400).send("Se requieren permisos de administrador");
                    return;
                }
            }).catch((error) => {
                res.status(400).send("El usuario coordinador no existe");
                return;
            });
        } else {
            res.status(400).send("Se requiere un user id y el id identificador");
            return;
        }
    } else {
        res.status(400).send("Sólo se permiten peticiones PUT");
        return;
    }
});

exports.crearCondomino = functions.https.onRequest((req, res) => {

    res.set('Access-Control-Allow-Origin', '*')

    if (req.method === 'PUT') {
        res.status(403).send('¡Prohibido!');
        return;
    }

    if (req.method === 'POST') {

        var id = req.body.id;
        var usuario = req.body.usuario;
        console.log(req.body)
        if (req.body.json) {
            var js = JSON.parse(req.body.json)
            id = js.id;
            usuario = js.usuario
            console.log(js)
        }
        if (typeof req.body === 'string') {
            var js = JSON.parse(req.body)
            id = js.id;
            usuario = js.usuario
            console.log(js)
        }
        if (id && usuario) {
            console.log("Creando usuario");
            console.log(usuario)
            admin.auth().getUser(id).then((userRecord) => {
                // The claims can be accessed on the user record.
                console.log(userRecord)
                if (userRecord && (userRecord.email === "admin@alzar.com.gt" || (userRecord.customClaims && (userRecord.customClaims.coordinador || userRecord.customClaims.administrador)))) {
                    var displayName = ""

                    if (usuario.nombre) {
                        displayName = usuario.nombre
                    }
                    var additionalClaims = {
                        condomino: true
                    }
                    var nombre_condominio = usuario.condominio_nombre.replace(/\s/g, '');
                    nombre_condominio = nombre_condominio.replace(/[^\dA-Z]/gi, '').
                        nombre_condominio = nombre_condominio.toLowerCase();

                    admin.database().ref("condominos").child(usuario.condominio).child(usuario.condominio + usuario.codigo).once("value").then((su) => {

                        var usuarioCrear = {
                            uid: usuario.condominio + usuario.codigo,
                            email: usuario.codigo + "@" + nombre_condominio + ".com",
                            displayName: usuario.nombre,
                            password: usuario.contrasena
                        }

                        if (su.val()) {
                            console.log("Usuario ya existe");
                            delete usuario.contrasena;
                        }

                        admin.database().ref("condominos").child(usuario.condominio).child(usuario.condominio + usuario.codigo).update(usuario).then(function () {

                            if (!su.val())
                                admin.auth().createUser(usuarioCrear).then(function (userRecord) {
                                    // See the UserRecord reference doc for the contents of userRecord.
                                    console.log("Successfully created new user:", userRecord.uid);
                                    res.status(200).send(userRecord.uid);
                                    return;
                                }).catch(function (error) {
                                    console.log("Error creating new user:", error);
                                    var mensaje = ""
                                    switch (error.code) {
                                        case "auth/invalid-argument":
                                            mensaje = "Existen campos invalidos"
                                            break;
                                        case "auth/invalid-disabled-field":
                                            mensaje = "Existen campos invalidos o deshabilitados"
                                            break;
                                        case "auth/invalid-display-name":
                                            mensaje = "El nombre es incorrecto"
                                            break;
                                        case "auth/invalid-email-verified":
                                            mensaje = "Correo electrónico debe verificarse"
                                            break;
                                        case "auth/invalid-email":
                                            mensaje = "Correo electrónico inválido"
                                            break;
                                        case "auth/invalid-password":
                                            mensaje = "Contraseña inválida"
                                            break;
                                        case "auth/invalid-phone-number":
                                            mensaje = "El número de teléfono es inválido"
                                            break;
                                        case "auth/invalid-uid":
                                            mensaje = "El User ID es incorrecto"
                                            break;
                                        case "auth/uid-alread-exists":

                                            mensaje = "El usuario ya existe"
                                            break;
                                        default:
                                            mensaje = "El servidor no ha podido resolver este caso"
                                            break;
                                    }
                                    res.status(400).send("Algo ha sucedido " + mensaje);
                                    return;
                                });
                            else {
                                res.status(200).send(userRecord.uid);
                                return;
                            }

                        }).catch(function (error) {
                            res.status(400).send(error);
                            return;
                        })
                    })


                } else {
                    res.status(400).send("No tiene permisos para crear un usuario");
                    return;
                }
            });

        } else {
            console.log(req.body)
            res.status(400).send("Se requiere UID y un USUARIO");
            return;
        }
    } else {
        res.status(400).send("Sólo se permiten peticiones PUT");
        return;
    }

});

exports.eliminarCondomino = functions.https.onRequest((req, res) => {
    res.header("Access-COntrol-Allow-Origin", "*");
    if (req.method === 'PUT') {
        res.status(403).send('¡Prohibido!');
        return;
    }

    if (req.method === 'POST') {
        var uid = req.body.user_id;
        var id = req.body.id
        var condominio = req.body.condominio;
        if (req.body.json) {
            var js = JSON.parse(req.body.json)
            id = js.id;
            uid = js.user_id;
            condominio = js.condominio;
            console.log(js)
        }
        if (typeof req.body === 'string') {
            var js = JSON.parse(req.body)
            id = js.id;
            uid = js.user_id;
            condominio = js.condominio;
            console.log(js)
        }

        if (id) {
            console.log("El usuario", id, "está eliminando a: " + uid);

            admin.auth().getUser(id).then((userRecord) => {
                if (userRecord && (userRecord.email === "admin@alzar.com.gt" || (userRecord.customClaims && (userRecord.customClaims.coordinador || userRecord.customClaims.administrador)))) {
                    admin.auth().deleteUser(uid).then(function () {
                        console.log("Se ha eliminado al usuario");
                        admin.database().ref("condominos").child(condominio).child(uid).set({}).then(function () {
                            res.status(200).send("Se ha eliminado al usuario");
                            return;
                        }).catch(function (error) {
                            res.status(400).send("No se ha eliminado al condomino de la base de datos, " + error);
                            return;
                        })
                    }).catch(function (error) {
                        console.log("Error eliminando al usuario, ", error);
                        res.status(400).send("No se ha eliminado al condomino, " + error);
                        return;
                    });
                } else {
                    res.status(400).send("Se requieren permisos de administrador");
                    return;
                }
            }).catch((error) => {
                res.status(400).send("El condomino no existe");
                return;
            });
        } else {
            res.status(400).send("Se requiere un user id y el id identificador");
            return;
        }
    } else {
        res.status(400).send("Sólo se permiten peticiones PUT");
        return;
    }
});

exports.cambiarContrasena = functions.https.onRequest((req, res) => {
    res.header("Access-COntrol-Allow-Origin", "*");
    if (req.method === 'PUT') {
        res.status(403).send('¡Prohibido!');
        return;
    }

    if (req.method === 'POST') {
        var uid = req.body.user_id;
        var id = req.body.id
        var nuevaContrasena = req.body.id;
        if (req.body.json) {
            var js = JSON.parse(req.body.json)
            id = js.id;
            uid = js.user_id;
            nuevaContrasena = js.nuevaContrasena;
            console.log(js)
        }
        if (typeof req.body === 'string') {
            var js = JSON.parse(req.body)
            id = js.id;
            uid = js.user_id;
            nuevaContrasena = js.nuevaContrasena;
            console.log(js)
        }

        if (id) {
            console.log("El usuario", id, "está cambiando a: " + uid);

            admin.auth().getUser(id).then((userRecord) => {
                if (userRecord && (userRecord.email === "admin@alzar.com.gt" || (uid == id || userRecord.customClaims && (userRecord.customClaims.coordinador || userRecord.customClaims.administrador)))) {
                    console.log("La nueva contraseña es: " + nuevaContrasena);
                    admin.auth().updateUser(uid, {
                        password: nuevaContrasena,
                    }).then(function (userRecord) {
                        // See the UserRecord reference doc for the contents of userRecord.
                        console.log("Contraseña actualizada", userRecord.toJSON());
                        res.status(200).send("Contraseña actualizada");
                        return;
                    }).catch(function (error) {
                        console.log("Error al actualizar contraseña:", error);
                        res.status(400).send("Error al actualizar contraseña:", error);
                        return;
                    });
                } else {
                    res.status(400).send("Se requieren permisos");
                    return;
                }
            }).catch((error) => {
                res.status(400).send("No existe");
                return;
            });
        } else {
            res.status(400).send("Se requiere un user id y el id identificador");
            return;
        }
    } else {
        res.status(400).send("Sólo se permiten peticiones PUT");
        return;
    }
});



function correo(titulo, mensaje, logo) {
    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">

<head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${titulo}</title>


    <style type="text/css">
        table.informativa * {
            border: 1px solid black;
        }
        thead {
            background-color: lightblue 
        }
        img {
            max-width: 100%;
        }

        body {
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: none;
            width: 100% !important;
            height: 100%;
            line-height: 1.6em;
        }

        body {
            background-color: #f6f6f6;
        }

        @media only screen and (max-width: 640px) {
            body {
                padding: 0 !important;
            }
            h1 {
                font-weight: 800 !important;
                margin: 20px 0 5px !important;
            }
            h2 {
                font-weight: 800 !important;
                margin: 20px 0 5px !important;
            }
            h3 {
                font-weight: 800 !important;
                margin: 20px 0 5px !important;
            }
            h4 {
                font-weight: 800 !important;
                margin: 20px 0 5px !important;
            }
            h1 {
                font-size: 22px !important;
            }
            h2 {
                font-size: 18px !important;
            }
            h3 {
                font-size: 16px !important;
            }
            .container {
                padding: 0 !important;
                width: 100% !important;
            }
            .content {
                padding: 0 !important;
            }
            .content-wrap {
                padding: 10px !important;
            }
            .invoice {
                width: 100% !important;
            }
        }
            
        
    </style>
</head>

<body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;"
    bgcolor="#f6f6f6">

    <table class="body-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;"
        bgcolor="#f6f6f6">
        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;"
                valign="top"></td>
            <td class="container" width="600" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;"
                valign="top">
                <div class="content" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
                    <table class="main" width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;"
                        bgcolor="#fff">
                        <tr style="text-align:center;">
                            <td style="padding:40px">
                                <img src="${logo}" alt="" srcset="" style="max-width: 160px;object-fit: contain;object-position: center;">
                            </td>
                        </tr>

                        <tr  style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="alert alert-warning" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 16px; vertical-align: top; color: #fff; font-weight: 500; text-align: center; border-radius: 3px 3px 0 0; background-color: #FF9F00; margin: 0; padding: 20px;"
                                align="center" bgcolor="#FF9F00" valign="top">
                                ${titulo}
                            </td>
                        </tr>
                        <tr  style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;"
                                valign="top">
                                ${mensaje}
                            </td>
                        </tr>
                        <tr style="text-align:center;">
                            <td style="padding:40px">
                                <img src="https://app.alzar.com.gt/admin/img/logo.png" alt="" srcset="" style="max-width: 160px;object-fit: contain;object-position: center;">
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
            <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;"
                valign="top"></td>
        </tr>
    </table>
</body>

</html>
    `
}

var sendNotification = function (data) {
    var headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic ODlmMTA1ODYtYWZjMC00NzQwLWI4OWUtODc2ZTk0OGY5ZmIy"
    };

    var options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
    };

    var https = require('https');
    var req = https.request(options, function (res) {
        res.on('data', function (data) {
            console.log("Response:");
            console.log(JSON.parse(data));
        });
    });

    req.on('error', function (e) {
        console.log("ERROR:");
        console.log(e);
    });

    req.write(JSON.stringify(data));
    req.end();
};