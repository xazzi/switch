dartTemplateCheck = function(s, orderArray, data, db, matInfo){

    // Check if the item is on the dart_items table.
    db.general.execute("SELECT * FROM digital_room.dart_items WHERE `type` = '" + orderArray.itemName + "' AND length = '" + orderArray.box.length + "' AND width = '" + orderArray.box.width + "' AND depth = '" + orderArray.box.depth + "' AND `flat-width` = '" + orderArray.width + "' AND `flat-height` = '" + orderArray.height + "';");
    if(!db.general.isRowAvailable()){

        // Add it if it isn't and select it to pull down.
        db.general.execute("INSERT INTO digital_room.dart_items(`type`, length, width, depth, `flat-width`, `flat-height`) VALUES ('" + orderArray.itemName + "','" + orderArray.box.length + "','" +orderArray.box.width + "','" + orderArray.box.depth + "','" + orderArray.width + "','" + orderArray.height + "');");
        db.general.execute("SELECT * FROM digital_room.dart_items WHERE `type` = '" + orderArray.itemName + "' AND length = '" + orderArray.box.length + "' AND width = '" + orderArray.box.width + "' AND depth = '" + orderArray.box.depth + "' AND `flat-width` = '" + orderArray.width + "' AND `flat-height` = '" + orderArray.height + "';");
    }

        // Pull the dart_item data down.
        db.general.fetchRow();

    var temp = {
        status: "Ready",
        nesting:{
            approved: db.general.getString(7) == 'y' ? true : false
        },
        template:{
            approved: db.general.getString(8) == 'y' ? true : false,
            itemID: db.general.getString(0),
            name: null
        },
        qrCode: db.general.getString(9),
        style: db.general.getString(10)
    }

    // Prioritize using a template, so check for it first.
    // Check if the template is approved.
    if(temp.template.approved){

        // If nesting is not an option, use the template profile.
        if(!temp.nesting.approved){
            matInfo.impositionProfile = "Corrugate_Template"
        }

        // Run the procedure to see if we have designated templates.
        db.general.execute('CALL digital_room.getTemplateUsables(' + temp.template.itemID + ')');

        // If we do not have any specific templates, return out of the code and let Phoenix find it automatically.
        if(!db.general.isRowAvailable()){
            return temp;
        }

        // If we do have template linkes, pull them back and post them to the name.
        while(db.general.isRowAvailable()){
            db.general.fetchRow();
            temp.template.name = db.general.getString(0);
        }

        // Return out of the code with the template info.
        return temp
    }

    // If templates are not an option, check if nesting is.
    if(temp.nesting.approved){
        matInfo.impositionProfile = "Corrugate_NoTemplate"
        return temp
    }

    // If template nor free-nest are enabled, flat as not ready for production.
    // If possible, generage the PHX file as a baseline and save to working folder.
    matInfo.impositionProfile = "Corrugate_NoTemplate"
    matInfo.approved = false
    temp.status = "No Method Ready"

    /*
    // Do something with this, so the user knows what happened via the email and it's logged in the database.
    data.notes.push([orderArray.jobItemId,"Removed","Template not ready for production."]);
    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
        ["project-id",data.projectID],
        ["item-number",orderArray.jobItemId]
    ],[
        ["status","Removed from Gang"],
        ["note","Template not ready for production."]
    ]))
        */

    return temp
}