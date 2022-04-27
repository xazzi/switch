// For use in Switch.

skuGenerator = function(length, type, dateID){

    function scanCSV(length, type, dateID){

        var skuLog = new File("C:\\Switch/SKU/" + dateID + "_" + length + ".txt");
        if(!skuLog.exists){
            skuLog.open(File.Append);
            skuLog.writeLine("Logged Randomly Generated Numbers")
            skuLog.close()
        }

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
                skuLog.open(File.ReadOnly);
            var lines = skuLog.read().split('\n');
                for(i=0; i<lines.length; i++){
                    if(lines[i] == result){
                        // If it's in use then search again.
                        skuLog.close();
                        result = '';
                        makeSKU(chars);
                    }
                }
                skuLog.close();
        }

            skuLog.open(File.Append);
            skuLog.writeLine(result);
            skuLog.close(); 

        return result;
    }

    return contents = scanCSV(length, type, dateID)
}