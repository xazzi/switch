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
                projectID: handoffDataDS.evalToString("//base/projectID")
            }
            
            var phoenixPlanDS = loadDataset_db("Phoenix Plan");
            var phoenixPlan = {
                index: phoenixPlanDS.evalToString("//layouts/layout/index"),
                contentFile: phoenixPlanDS.evalToString("//products/product/name"),
                width: phoenixPlanDS.evalToString("//products/product/width").replace('"',''),
                height: phoenixPlanDS.evalToString("//products/product/height").replace('"','')
            }

            var productNodes = handoffDataDS.evalToNodes("//products/product");
            for(var n=0; n<productNodes.length; n++){
                if(phoenixPlan.contentFile == productNodes.at(n).evalToString('contentFile')){
                    handoffData.rotation = productNodes.at(n).evalToString('rotation');
                    break;
                }
            }

            var moduleStep = 0
            var library = "WPSP"
            var gutter = .0625*2

            if(contains([270,90,-90,-270], handoffData.rotation)) {
                moduleStep = (Number(phoenixPlan.width) + gutter)
            }
            
            if(contains([360,180,0,-180,-360], handoffData.rotation)){
                moduleStep = (Number(phoenixPlan.height) + gutter)
            }

            // Convert to MM
            moduleStep = moduleStep*25.4;

            // Round to the 1000th
            moduleStep = Math.round(moduleStep*1000)/1000
            
            var newXML = s.createNewJob();
            var xmlPath = newXML.createPathWithName(handoffData.projectID + '-' + phoenixPlan.index + ".xml", false);
            var xmlFile = new File(xmlPath);
            //var xmlFile = new File("C://Switch//Development//" + handoffData.projectID + ".xml");

            generateXml(s, job, handoffData, phoenixPlan, xmlFile, moduleStep, library);

            newXML.sendToSingle(xmlPath);

            job.sendToNull(job.getPath());
            
            
        }catch(e){
            s.log(2, "Critical Error: Labelmaster XML, " + e)
            job.sendToNull(job.getPath())
        }
    }
    labelmasterXml(s, job)
}

function generateXml(s, job, handoffData, phoenixPlan, xmlFile, moduleStep, library){
    xmlFile.open(File.Append);
    xmlFile.writeLine("<?xml version='1.0' encoding='UTF-8'?>");
    
    xmlFile.writeLine('<JobSEI>');

        writeXmlString(xmlFile, "ZoneDivision", "ON");
        //xmlFile.writeLine('<ZoneDimension Width="150" />');

        xmlFile.writeLine('<LabelMaster>');
            writeXmlString(xmlFile, "ModuleStep", moduleStep);
            //xmlFile.writeLine('<Slitting>');
            //    writeXmlString(xmlFile, "Position", "45");
            //xmlFile.writeLine('</Slitting>');
        xmlFile.writeLine('</LabelMaster>');

        xmlFile.writeLine('<Material Name="Generic">');
            writeXmlString(xmlFile, "Library", library);
        xmlFile.writeLine('</Material>');

        xmlFile.writeLine('<Object Name="' + handoffData.projectID + '-' + phoenixPlan.index + '">');
            xmlFile.writeLine('<File Type="PDF" Unit="MM">\\\\SLN-GANGS-P01\\data\\Digital\\SEI cut\\' + job.getName() + '</File>');
            xmlFile.writeLine('<Rotate Angle="0" Ref="C"/>');
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