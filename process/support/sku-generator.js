skuGenerator = function(length, type, data, dbConn){

    function scanCSV(length, type, data, dbConn){

        var result = '';
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

        if(type == 'alpha_uppercase'){
            chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if(type == 'alpha_lowercase'){
            chars = 'abcdefghijklmnopqrstuvqxys';
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
            var db_active_sku = new Statement(dbConn);
                db_active_sku.execute("SELECT * FROM digital_room.active_sku WHERE sku = '" + result + "' and date_id = '" + data.dateID + "' and facility = '" + data.facility + "';");
            if(db_active_sku.isRowAvailable()){
                result = '';
                makeSKU(chars);
            }
                db_active_sku.execute("INSERT INTO digital_room.active_sku (sku, date_id, facility, gang_number) VALUES ('" + result + "', '" + data.dateID + "', '" + data.facility + "', '" + data.projectID + "');");
        }
        return result;
    }
    return contents = scanCSV(length, type, data, dbConn)
}