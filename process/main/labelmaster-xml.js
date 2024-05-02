runLabelmasterXml = function(s, job){
    function labelmasterXml(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));

            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                dateID: handoffDataDS.evalToString("//base/dateID"),
                facility: handoffDataDS.evalToString("//misc/facility"),
                dueDate: handoffDataDS.evalToString("//base/dueDate"),
                sku: handoffDataDS.evalToString("//base/sku"),
                paper: handoffDataDS.evalToString("//base/paper"),
                process: handoffDataDS.evalToString("//base/process"),
                subprocess: handoffDataDS.evalToString("//base/subprocess"),
                prodMatFileName: handoffDataDS.evalToString("//base/prodMatFileName"),
                printer: handoffDataDS.evalToString("//settings/printer"),
                laminate: handoffDataDS.evalToString("//settings/laminate") == "true" ? "-Lam" : "",
                mount: handoffDataDS.evalToString("//settings/mount") == "true" ? "-Mount" : "",
                surface: handoffDataDS.evalToString("//settings/secondsurf") == "true" ? "-2ndSurf" : "",
                rush: handoffDataDS.evalToString("//base/rush") == "true" ? "-RUSH" : "",
                whiteink: handoffDataDS.evalToString("//settings/whiteink") == "true" ? "-W" : ""
            }
            
            var phoenixPlanDS = loadDataset_db("Phoenix Plan");
            var phoenixPlan = {
                index: phoenixPlanDS.evalToString("//layouts/layout/index"),
                qty: phoenixPlanDS.evalToString("//layouts/layout/run-length")
            }
            
            var newXML = s.createNewJob();
            var xmlPath = newXML.createPathWithName(handoffData.projectID + ".xml", false);
            var xmlFile = new File(xmlPath);

            generateXml(s, handoffDataDS, xmlFile);

            newXML.sendToSingle(job.getPath())
            
            
        }catch(e){
            s.log(2, "Critical Error: Labelmaster XML")
            job.sendToNull(job.getPath())
        }
    }
    labelmasterXml(s, job)
}

function generateXml(s, handoffDataDS, xmlFile){
    xmlFile.open(File.Append);
    xmlFile.writeLine("<?xml version='1.0' encoding='UTF-8'?>");
    
    xmlFile.writeLine('<JobSEI>');

        xmlFile.writeLine('<Meta>');
            writeXmlString(xmlFile, "Description", "Empty Script");
            xmlFile.writeLine('<Creation Author="Bret Combe" Date="2016-09-27T10:14:21" Version="Stage" />');
            xmlFile.writeLine('<Thumbnail Format="PNG" Data="ABAgMEBQYHCAoA==" />');
        xmlFile.writeLine('</Meta>');

        writeXmlString(xmlFile, "ZoneDivision", "AUTO");
        xmlFile.writeLine('<ZoneDimension Width="150" />');

        xmlFile.writeLine('</LabelMaster>');
            writeXmlString(xmlFile, "ModuleStep", "54");
            xmlFile.writeLine('<Slitting>');
                writeXmlString(xmlFile, "Position", "45");
            xmlFile.writeLine('</Slitting>');
        xmlFile.writeLine('</LabelMaster>');

        xmlFile.writeLine('<Material Name="Generic">');
            writeXmlString(xmlFile, "Library", "POLYPROPILENE");
        xmlFile.writeLine('</Material>');

        xmlFile.writeLine('<Object Name="Printela1">');
            xmlFile.writeLine('<File Type="PDF" Unit="MM">C:\\Jobs\\Gang-Index.pdf</File>');
            xmlFile.writeLine('<Rotate Angle="-90" Ref="C"/>');
            writeXmlString(xmlFile, "Optimize", "Full");
        xmlFile.writeLine('</Object>');

    xmlFile.writeLine('</JobSEI>');
    xmlFile.close();
}

function writeXmlString(xmlFile, xmlLabel, xmlVariable){
	xmlFile.write("<" + xmlLabel + ">");
	xmlFile.write(xmlVariable);
	xmlFile.writeLine("</" + xmlLabel + ">");
}