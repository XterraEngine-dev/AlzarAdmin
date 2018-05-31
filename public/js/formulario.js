"use strict";

var refR = firebase.database().ref('formularios');
var obj, tipo;

(function () {
    function getUrlVars() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');

            if ($.inArray(hash[0], vars) > -1) {
                vars[hash[0]] += "," + hash[1];
            }
            else {
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
        }
        return vars;
    }

    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseObject) {
        var formulario_id = getUrlVars()["id"];
        var condominio_id = getUrlVars()["cid"];
        var amenidad_id = getUrlVars()["aid"];
        console.log(formulario_id)
        obj = $firebaseObject(refR.child(condominio_id).child(amenidad_id).child(formulario_id));
        obj.$loaded().then(function () {
            firebase.database().ref("amenidades").child(condominio_id).child(amenidad_id).once("value").then(function (s) {
                var data_amenidad = s.val()
                if (data_amenidad) {
                    document.getElementById("condiciones_uso").innerHTML = data_amenidad.condiciones;
                    setTimeout(() => {
                        window.print();
                    }, 100);
                }
            })
        });
        $scope.data = obj

        


    })
})()