try{

    var $doc = app.activeDocument;
    var allPaths = $doc.pageItems;

    var layer = {
        register: createLayer("register", true),
        thruCut: createLayer("Thru-cut", true)
    }
    
    // Move the regmarks to the register layer.
    var allPaths = $doc.pageItems
    for(var i=0; i<allPaths.length; i++){
        if(allPaths[i].filled){
            var tempLayer = createLayer("register", true);
            allPaths[i].move(tempLayer, ElementPlacement.PLACEATBEGINNING)
        }
    }

    var perimeter = {
        top: null,
        bottom: null,
        left: null,
        right: null
    }

    var size = {
        width: null,
        height: null
    }

    // Get the locations of the current cut paths.
    var allPaths = $doc.pageItems
    for(var i=0; i<allPaths.length; i++){
        allPaths[i].bottom = allPaths[i].top - allPaths[i].height;
        allPaths[i].right = allPaths[i].left + allPaths[i].width;
        if(allPaths[i].stroked){
            if(allPaths[i].strokeColor.spot.name == "Thru-cut"){
                size.width == null ? size.width = allPaths[i].width : null;
                size.height == null ? size.height = allPaths[i].height : null;
                perimeter.top == null ? perimeter.top = allPaths[i].top : perimeter.top < allPaths[i].top ? perimeter.top = allPaths[i].top : null;
                perimeter.bottom == null ? perimeter.bottom = allPaths[i].bottom : perimeter.bottom > allPaths[i].bottom ? perimeter.bottom = allPaths[i].bottom : null;
                perimeter.left == null ? perimeter.left = allPaths[i].left : perimeter.left > allPaths[i].left ? perimeter.left = allPaths[i].left : null;
                perimeter.right == null ? perimeter.right = allPaths[i].right : perimeter.right < allPaths[i].right ? perimeter.right = allPaths[i].right : null;
            }
        }
    }

    // Create the new perimeter cut path.
    var keyline = layer.thruCut.pathItems.rectangle(perimeter.top, perimeter.left, perimeter.right - perimeter.left, perimeter.top - perimeter.bottom)
        keyline.pixelAligned = false;
        keyline.filled = false;
        keyline.strokeColor = $doc.swatches.getByName('Thru-cut').color;
    
    // Create the columns.
    var xAxis = perimeter.left + size.width
    while(xAxis < perimeter.right){
        var verticals = layer.thruCut.pathItems.add();
            verticals.filled = false;
            verticals.strokeColor = $doc.swatches.getByName('Thru-cut').color;
            verticals.setEntirePath([[xAxis, perimeter.top], [xAxis, perimeter.bottom]]);
            
            xAxis += size.width;
    }

    // Create the rows.
    var yAxis = perimeter.top - size.height
    while(yAxis > perimeter.bottom){
        var horizontals = $doc.pathItems.add();
            horizontals.filled = false;
            horizontals.strokeColor = $doc.swatches.getByName('Thru-cut').color;
            horizontals.setEntirePath([[perimeter.left, yAxis], [perimeter.right, yAxis]]);
            yAxis -= size.height;
    }

    try{
        $doc.layers.getByName("Layer 1").remove();
    }catch(e){}

}catch(e){
    $error = e.description; 
    //$status = failJob;
    $doc.close(SaveOptions.DONOTSAVECHANGES)
}

function createLayer(name, print){
    var $doc = app.activeDocument;

    var color = makeRGBColor(0,0,0);
        if(name == "White"){color = makeRGBColor(216,0,122)}
        if(name == "Art"){color = makeRGBColor(79,128,255);}
        if(name == "Hole-cut"){color = makeRGBColor(0,159,238)}
        if(name == "Thru-cut"){color = makeRGBColor(255,79,79)}
        if(name == "regmark"){color = makeRGBColor(79,255,79)}
        if(name == "Crease-cut"){color = makeRGBColor(216,0,122)}
        if(name == "Kiss-cut"){color = makeRGBColor(255,241,0)}
        if(name == "DS Marks"){color = makeRGBColor(26,24,24)}
    
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