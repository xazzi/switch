skuGenerator = function(length, type, data, db){

    function scanCSV(length, type, data, db){

        var result = '';
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

        if(type == 'alpha_uppercase'){
            chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if(type == 'alpha_lowercase'){
            chars = 'abcdefghijklmnopqrstuvwxyz';
        }
        if(type == 'numeric'){
            chars = '0123456789';
        }
        if(type == 'alphanumeric_uppercase'){
            chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if(type == 'alphanumeric_lowercase'){
            chars = '0123456789abcdefghijklmnopqrstuvwxyz';
        }

        makeSKU(chars);

        function makeSKU(chars){
            // Make a SKU.
            while (result.length < length){
                result += chars.charAt(Math.round(Math.random() * (chars.length) - 1) + 1)
            }
            
            // Check and see if the SKU is already in use.
            db.history.execute("SELECT * FROM history.active_sku WHERE sku = '" + result + "' and date_id = '" + data.dateID + "' and facility = '" + data.facility.destination + "';");
            if(db.history.isRowAvailable()){
                result = '';
                makeSKU(chars);
            }
                db.history.execute("INSERT INTO history.active_sku (sku, date_id, facility) VALUES ('" + result + "', '" + data.dateID + "', '" + data.facility.destination + "');");

                // Add the SKU number to the details_gang table
                db.history.execute("UPDATE history.details_gang SET `sku` = '" + result + "' WHERE (`gang-number` = '" + data.gangNumber + "' and `project-id` = '" + data.projectID + "');");
        }
        return result;
    }
    return contents = scanCSV(length, type, data, db)
}

skuGenerator_projectID = function(db){

    function generateID(db){

        var result = '';
        var length = 8;
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

        makeSKU(chars);

        function makeSKU(chars){
            // Make a SKU.
            while (result.length < length){
                result += chars.charAt(Math.round(Math.random() * (chars.length) - 1) + 1)
            }
            
            // Check and see if the SKU is already in use.
            db.history.execute("SELECT * FROM history.active_project WHERE `project-id`` = '" + result + "';");
            if(db.history.isRowAvailable()){
                result = '';
                makeSKU(chars);
            }
                db.history.execute("INSERT INTO history.active_project (`project-id`) VALUES ('" + result + "');");
        }
        return result;
    }
    return contents = generateID(db)
}

skuGeneratorSim = function(length, type){

    function scanCSV(length, type){

        var result = '';
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

        if(type == 'alpha_uppercase'){
            chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if(type == 'alpha_lowercase'){
            chars = 'abcdefghijklmnopqrstuvwxyz';
        }
        if(type == 'numeric'){
            chars = '0123456789';
        }
        if(type == 'alphanumeric_uppercase'){
            chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if(type == 'alphanumeric_lowercase'){
            chars = '0123456789abcdefghijklmnopqrstuvwxyz';
        }

        makeSKU(chars);

        function makeSKU(chars){
            // Make a SKU.
            while (result.length < length){
                result += chars.charAt(Math.round(Math.random() * (chars.length) - 1) + 1)
            }
        }
        return result;
    }
    return scanCSV(length, type)
}