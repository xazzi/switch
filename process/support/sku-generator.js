skuGenerator = function(length, type, data, db) {
    function run(length, type, data, db) {
        var chars = getCharset(type);
        var result = '';

        for (var attempts = 0; attempts < 100; attempts++) {
            result = generateSKU(length, chars);

            var checkSQL = "SELECT * FROM history.active_sku WHERE sku = '" + result +
                "' AND date_id = '" + data.date.due.strings.monthDay +
                "' AND facility = '" + data.facility.destination + "';";

            db.history.execute(checkSQL);

            if (!db.history.isRowAvailable()) {
                // Reserve SKU
                var insertSQL = "INSERT INTO history.active_sku (sku, date_id, facility) VALUES ('" + result +
                    "', '" + data.date.due.strings.monthDay +
                    "', '" + data.facility.destination + "');";

                db.history.execute(insertSQL);

                // Update gang table
                var updateSQL = "UPDATE history.details_gang SET `sku` = '" + result +
                    "' WHERE `gang-number` = '" + data.gangNumber +
                    "' AND `project-id` = '" + data.projectID + "';";

                db.history.execute(updateSQL);
                return result;
            }
        }

        throw new Error("SKU generation failed after 100 attempts.");
    }

    return run(length, type, data, db)
}

// Helper: Generate character set
function getCharset(type) {
    if (type === 'alpha_uppercase') return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (type === 'alpha_lowercase') return 'abcdefghijklmnopqrstuvwxyz';
    if (type === 'numeric') return '0123456789';
    if (type === 'alphanumeric_uppercase') return '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (type === 'alphanumeric_lowercase') return '0123456789abcdefghijklmnopqrstuvwxyz';
    return '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
}

// Helper: Generate SKU
function generateSKU(length, chars) {
    var sku = '';
    for (var i = 0; i < length; i++) {
        var index = Math.floor(Math.random() * chars.length);
        sku += chars.charAt(index);
    }
    return sku;
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