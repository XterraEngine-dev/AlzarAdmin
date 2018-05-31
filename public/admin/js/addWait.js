function waiting() {
    var overlay = jQuery('<div class="valign-wrapper center-align overlay"><div style="margin: auto;" class="preloader-wrapper big active center-align">'
        +'<div class=" spinner-layer spinner-red-only center-align">'
            +'<div class="circle-clipper left">'
                +'<div class="circle"></div>'
                +'</div><div class="gap-patch">'
                +'<div class="circle"></div>'
                +'</div><div class="circle-clipper right">'
                +'<div class="circle"></div>'
                +'</div>'
            +'</div>'
        +'</div> </div>');
    overlay.appendTo(document.body)
}
function destroyWaiting(){
    setTimeout(function() {
        $("div.overlay").fadeOut(300, function(){
            $("div.overlay").remove();
        });    
    }, 500);
}
function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}