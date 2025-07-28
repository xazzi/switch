// Expose single entry function
buildXml = function(s, file, phoenixPlanDS, handoffDataDS, validation, handoffData) {
    function run(s, file, phoenixPlanDS, handoffDataDS, validation, handoffData){
        var layoutNodes = phoenixPlanDS.evalToNodes('//job/layouts/layout');
        var productNodes = phoenixPlanDS.evalToNodes('//job/products/product');
        var handoffDataNodes = handoffDataDS.evalToNodes("//products/product");
        var name = escapeXml(handoffDataDS.evalToString("//base/prismStock"));

        file.open(File.Append);

        startXmlFile(file);
        openNode(file, "job");

        writeElement(file, "id", phoenixPlanDS.evalToString('//job/id'));
        writeElement(file, "name", "House Stock");
        writeElement(file, "notes", handoffDataDS.evalToString("//base/projectNotes"));
        writeElement(file, "default-bleed", "0.25");
        writeElement(file, "units", phoenixPlanDS.evalToString('//job/units'));
        writeElement(file, "run-length", phoenixPlanDS.evalToString('//job/run-length'));
        writeElement(file, "sheet-usage", phoenixPlanDS.evalToString('//job/sheet-usage'));
        writeElement(file, "overrun", phoenixPlanDS.evalToString('//job/overrun'));
        writeElement(file, "layout-count", phoenixPlanDS.evalToString('//job/layout-count'));

        // --- Layouts ---
        openNode(file, "layouts");
        for (var i = 0; i < layoutNodes.length; i++) {
            var node = layoutNodes.at(i);
            openNode(file, "layout");

            writeElement(file, "id", node.evalToString('id'));
            writeElement(file, "index", node.evalToString('index'));
            writeElement(file, "name", node.evalToString('name'));
            writeElement(file, "workstyle", handoffData.workstyle);
            writeElement(file, "run-length", node.evalToString('run-length'));
            writeElement(file, "waste", node.evalToString('waste'));
            writeElement(file, "plates", node.evalToString('plates'));
            writeElement(file, "sheet-usage", node.evalToString('sheet-usage'));
            writeElement(file, "default-bleed", "0.25");
            writeElement(file, "placed", node.evalToString('placed'));
            writeElement(file, "overrun", node.evalToString('overrun'));

            // --- Surfaces ---
            openNode(file, "surfaces");
                openNode(file, "surface");
                    writeElement(file, "side", node.evalToString('//surfaces/surface/side'));

                    openNode(file, "press");
                        writeElement(file, "id", node.evalToString('//surfaces/surface/press/id'));
                        writeElement(file, "name", handoffDataDS.evalToString("//settings/printer"));
                    closeNode(file, "press");

                    openNode(file, "stock");
                        writeElement(file, "name", name);
                        writeElement(file, "id", node.evalToString('//surfaces/surface/stock/id'));
                    closeNode(file, "stock");

                    openNode(file, "grade");
                        writeElement(file, "name", node.evalToString('//surfaces/surface/grade/name'));
                        writeElement(file, "weight", node.evalToString('//surfaces/surface/grade/weight'));
                    closeNode(file, "grade");

                    openNode(file, "sheet");
                        writeElement(file, "name", escapeXml(node.evalToString('surfaces/surface/sheet/name')));
                        writeElement(file, "id", node.evalToString('surfaces/surface/sheet/id'));
                        writeElement(file, "width", escapeXml(node.evalToString('surfaces/surface/sheet/width')));
                        writeElement(file, "height", escapeXml(node.evalToString('surfaces/surface/sheet/height')));
                    closeNode(file, "sheet");

                closeNode(file, "surface");
            closeNode(file, "surfaces");

            closeNode(file, "layout");
        }
        closeNode(file, "layouts");

        // --- Products ---
        openNode(file, "products");
        for (var j = 0; j < productNodes.length; j++) {
            for (var n = 0; n < handoffDataNodes.length; n++) {
                var product = productNodes.at(j);
                var dataNode = handoffDataNodes.at(n);

                var productKey = product.evalToString('name').split('_')[1];
                var contentKey = dataNode.evalToString('contentFile').split('_')[1];

                if (productKey != contentKey) continue;
                if (validation.removals.items.toString().match(new RegExp(dataNode.evalToString('itemNumber'), "g"))) break;

                openNode(file, "product");
                    writeElement(file, "index", product.evalToString('index'));
                    writeElement(file, "name", product.evalToString('name'));
                    writeElement(file, "color", product.evalToString('color'));
                    writeElement(file, "ordered", product.evalToString('ordered'));
                    writeElement(file, "description", dataNode.evalToString('itemNumber'));
                    writeElement(file, "notes", dataNode.evalToString('notes'));
                    writeElement(file, "width", escapeXml(product.evalToString('width')));
                    writeElement(file, "height", escapeXml(product.evalToString('height')));
                    writeElement(file, "placed", product.evalToString('placed'));
                    writeElement(file, "total", product.evalToString('total'));
                    writeElement(file, "overrun", product.evalToString('overrun'));

                    openNode(file, "properties");
                        openNode(file, "property");
                            writeElement(file, "value", dataNode.evalToString('orderNumber'));
                        closeNode(file, "property");
                    closeNode(file, "properties");

                    openNode(file, "layouts");
                        var indexPlacedNodes = product.evalToNode("layouts").getChildNodes();
                        for (var k = 0; k < indexPlacedNodes.length; k++) {
                            writeSelfClosingLayout(file,
                                indexPlacedNodes.at(k).getAttributeValue('index'),
                                indexPlacedNodes.at(k).getAttributeValue('placed')
                            );
                        }
                    closeNode(file, "layouts");

                closeNode(file, "product");
                break;
            }
        }
        closeNode(file, "products");
        closeNode(file, "job");

        file.close();
    }
    run(s, file, phoenixPlanDS, handoffDataDS, validation, handoffData)
}

// Escapes double quotes for XML compatibility
function escapeXml(value) {
    if (!value) return "";
    return value.replace(/\"/g, "&quot;");
}

function writeElement(file, tag, value) {
    var escaped = escapeXml(value);
    file.write("<" + tag + ">" + escaped + "</" + tag + ">\n");
}

function openNode(file, tag) {
    file.write("<" + tag + ">\n");
}

function closeNode(file, tag) {
    file.write("</" + tag + ">\n");
}

function writeSelfClosingLayout(file, index, placed) {
    var line = "<layout index='" + index + "' placed='" + placed + "'/>\n";
    file.write(line);
}

function startXmlFile(file) {
    var header = "<?xml version='1.0' encoding='UTF-8'?>\n";
    file.write(header);
}
