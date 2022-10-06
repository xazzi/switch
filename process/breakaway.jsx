try{
    var hemSize = 1*72

    var $doc = app.activeDocument;

    var allPaths = $doc.pageItems
    for(var j=0; j<allPaths.length; j++){
        if(allPaths[j].stroked){
            if(allPaths[j].strokeColor.spot != undefined){
                if(allPaths[j].strokeColor.spot.name == "Thru-cut"){
                    allPaths[j].width = allPaths[j].width + hemSize;
                    break;
                }
            }
        }
    }
}catch(e){

}