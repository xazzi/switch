try{
    var $doc = app.activeDocument;

    var layer = {
        artwork: createLayer("Artwork", true),
        marker: createLayer("Marker", true),
    };

    var allPaths = $doc.pageItems;

    // Remove all clipping paths    
    for(i=allPaths.length-1; i>=0; i--){
        if(allPaths[i].clipping == true){
            try{
                allPaths[i].remove();
            }catch(e){}
        }
    }

    var allPaths = $doc.pageItems;
    var topRow = 0

    for(var j=0; j<allPaths.length; j++){
        if(Math.round(allPaths[j].top) > topRow){
            topRow = Math.round(allPaths[j].top)
        }
    }

    for (var i=allPaths.length-1; i>=0; i--){
        if(Math.round(allPaths[i].top) != topRow){
            allPaths[i].remove();
        }
    }

    var allPaths = $doc.pageItems;

    for(var ii=0; ii<allPaths.length; ii++){
        if(allPaths[ii].strokeColor.spot != undefined){
            if(allPaths[ii].strokeColor.spot.name == "Thru-cut"){
                allPaths[ii].move(layer.artwork, ElementPlacement.PLACEATBEGINNING)
            }
        }else{
            allPaths[ii].move(layer.marker, ElementPlacement.PLACEATBEGINNING)
        }
    }

    //$doc.layers.getByName("Layer 1").remove();

}catch(e){

}

function createLayer(name, print){
    var $doc = app.activeDocument;

    var color = makeRGBColor(0,0,0);
    
    try{
        var createLayer = $doc.layers.getByName(name);
    }catch(e){
        if($doc.activeLayer.name == "Layer 1" && name == "Art"){
            var createLayer = $doc.activeLayer;
        }else{
            var createLayer = $doc.layers.add();
        }
        createLayer.name = name;
    }
    
        createLayer.printable = print;
        createLayer.color = color;
    
    return createLayer;
}

function makeRGBColor(r,g,b){
    if(r > 255){r = 255}; if(r < 0){r = 0};
    if(g > 255){g = 255}; if(g < 0){g = 0};
    if(b > 255){b = 255}; if(b < 0){b = 0};
        var color = new RGBColor();
            color.red = r;
            color.green = g;
            color.blue = b;
        return color;
}