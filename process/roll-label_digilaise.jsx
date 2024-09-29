try{
    var $doc = app.activeDocument;

    // Remove all clipping paths   
    var allPaths = $doc.pageItems; 
    for(i=allPaths.length-1; i>=0; i--){
        if(allPaths[i].clipping == true){
            try{
                allPaths[i].remove();
            }catch(e){}
        }
    }

    var top = {
        thruCut: 0,
        kissCut: 0,
        eyemark: 0
    }

    var allPaths = $doc.pageItems;
    for(var j=0; j<allPaths.length; j++){
        if(allPaths[j].filled){
            if(allPaths[j].fillColor.typename == "SpotColor"){
                if(allPaths[j].fillColor.spot.name == "Eyemark"){
                    if(Math.round(allPaths[j].top) > top.eyemark){
                        top.eyemark = Math.round(allPaths[j].top)
                    }
                }
            }
        }
        if(allPaths[j].stroked){
            if(allPaths[j].strokeColor.spot.name == "Thru-cut"){
                if(Math.round(allPaths[j].top) > top.thruCut){
                    top.thruCut = Math.round(allPaths[j].top)
                }
            }
        }
        if(allPaths[j].stroked){
            if(allPaths[j].strokeColor.spot.name == "Kiss-cut"){
                if(Math.round(allPaths[j].top) > top.kissCut){
                    top.kissCut = Math.round(allPaths[j].top)
                }
            }
        }
    }

    // Remove the CMYK version of the Eyemarks
    var allPaths = $doc.pageItems;
    for (var ii=allPaths.length-1; ii>=0; ii--){
        if(allPaths[ii].filled){
            if(allPaths[ii].fillColor.typename == "CMYKColor"){
                allPaths[ii].remove();
            }
        }
    }

    //Remove the Spot version of the Eyemarks
    var allPaths = $doc.pageItems;
    for (var ii=allPaths.length-1; ii>=0; ii--){
        if(allPaths[ii].filled){
            if(allPaths[ii].fillColor.typename == "SpotColor"){
                if(allPaths[ii].fillColor.spot.name == "Eyemark"){
                    allPaths[ii].remove();
                    continue;
                }
                if(allPaths[ii].fillColor.spot.name == "Dieline"){
                    allPaths[ii].remove();
                    continue;
                }
            }
        }
    }

    //Remove all but the top row of Thru-cuts
    var allPaths = $doc.pageItems;
    for (var ii=allPaths.length-1; ii>=0; ii--){
        if(allPaths[ii].stroked){
            if(allPaths[ii].strokeColor.spot.name == "Thru-cut"){
                if(Math.round(allPaths[ii].top) != top.thruCut){
                    allPaths[ii].remove();
                }
            }
        }
    }

    //Remove all but the top row of Kiss-cuts
    var allPaths = $doc.pageItems;
    for (var ii=allPaths.length-1; ii>=0; ii--){
        if(allPaths[ii].stroked){
            if(allPaths[ii].strokeColor.spot.name == "Kiss-cut"){
                if(Math.round(allPaths[ii].top) != top.kissCut){
                    allPaths[ii].remove();
                }
            }
        }
    }

    // Rotate the art.
    var allLayers = $doc.layers
    for(var n=0; n<allLayers.length; n++){
        var totalMatrix = app.getScaleMatrix(-100,100);  
        var newGroup = allLayers[n].groupItems.add();  
        for(var a = allLayers[n].pageItems.length-1; a > 0; a--){  
            app.activeDocument.layers[n].pageItems[a].moveToBeginning(newGroup);
        }
        newGroup.rotate(-90);
    }

    // Change the artboard to be the width of the product + at least an offset from the art.
    var width  = newGroup.width;
    var height = newGroup.height;
    for (i=0; i<$doc.artboards.length; i++) {
        var abBounds = $doc.artboards[i].artboardRect; // left, top, right, bottom

        var pWidth = abBounds[2] - abBounds[0];
        var offset = .0625 * 72;

        var ableft = newGroup.left - offset;
        var abtop = newGroup.top + ((pWidth - newGroup.height)/2);
        var abwidth = newGroup.width;
        var abheight = newGroup.height;

        var abright = newGroup.left + newGroup.width + offset;
        var abbottom = abtop - pWidth;

        $doc.artboards[i].artboardRect = [ableft, abtop, abright, abbottom];
    }

    $doc.activeLayer.name = "DieLine"

}catch(e){}

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