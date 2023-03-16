getEmailResponse = function(query, product, matInfo, data, userInfo, email){

    var subject, body, to, cc, bcc;
    var itemNotes = "";
    var gangNotes = "";
    var escalate = "To escalate an issue, please forward this email to Chelsea McVay and Bret Combe."

    var sendTo = {
        bret: "bret.c@digitalroominc.com",
        chelsea: "chelsea.mv@digitalroominc.com"
    }

    if(data != null){
        gangNotes += "\nItem Notes:\n"
        if(data.notes.length == 0){
            gangNotes += "None" + "\n";
        }else{
            for(var i in data.notes){
                gangNotes += data.notes[i] + "\n";
            }
        }
    }

    if(email != null){
        gangNotes += "\nRotation Adjustments:\n"
        if(email.rotations.length == 0){
            gangNotes += "None" + "\n";
        }else{
            for(var i in email.rotations){
                gangNotes += email.rotations[i] + "\n";
            }
        }
        gangNotes += "\nSubmit Errors:\n"
        if(email.errors.length == 0){
            gangNotes += "None" + "\n";
        }else{
            for(var i in email.errors){
                gangNotes += email.errors[i] + "\n";
            }
        }
    }

    if(product != null){
        for(var i in product.notes){
            itemNotes += product.notes[i] + "\n";
        }
    }

    switch(query){
        case "Butt Cut":
            subject = "Missing Template: " + product.width + "x" + product.height;
            body = "The following item is missing the required template for the butt-cut process: " + "\n\n" + "Item: " + product.itemNumber + "\n" + "Width: " + product.width + "\n" + "Height: " + product.height;
            to = [userInfo.email];
            cc = [sendTo.bret];
            bcc = [];
        break;
        case "Butt Cut v1":
            subject = "Missing Cut File for Butt Cut: " + product.width + "x" + product.height;
            body = "The following item is missing the required template for the butt-cut process: " + "\n\n" + "Item: " + product.itemNumber + "\n" + "Width: " + product.width + "\n" + "Height: " + product.height + ".\n" + "Please create it via the launcher after processing.";
            to = [userInfo.email];
            cc = [sendTo.bret];
            bcc = [];
        break;
        case "Undefined User":
            subject = "Undefined User!";
            body = "Email: " + userInfo;
            to = [sendTo.bret]
            cc = [sendTo.chelsea]
            bcc = [];
        break;
        case "Undefined Material v1":
            //paper, material, itemName do not exist in matInfo, these are being pulled from orderSpecs pass in.
            subject = "Undefined Material: " + data.projectID;
            body = "The following material specs are undefined:" + "\n\n" + "Paper: " + matInfo.paper.value + "\n" + "Material: " + matInfo.material.value + "\n" + "ItemName: " +  matInfo.itemName + "\n" + "Facility: " +  matInfo.facility  + "\n\n" + "ItemName is not required to be defined, but Paper must be in the database for production.";
            to = [sendTo.chelsea,sendTo.bret]
            cc = [userInfo.email]
            bcc = [];
        break;
        case "Unmapped Paper":
            //paper, material, itemName do not exist in matInfo, these are being pulled from orderSpecs pass in.
            subject = "Undefined Paper Mapping: " + data.projectID;
            body = "The following paper specs are not mapped:" + "\n\n" + "Paper: " + matInfo.paper + "\n" + "Material: " + matInfo.material + "\n" + "ItemName: " +  matInfo.itemName + "\n" + "Facility: " +  matInfo.facility  + "\n\n" + "ItemName is not required to be defined, but Paper must be in the database for production.";
            to = [sendTo.chelsea,sendTo.bret]
            cc = [userInfo.email]
            bcc = [];
        break;
        case "New Entry":
            subject = "New Table Entry!";
            body = "A new entry has been added to the " + matInfo + " table!";
            to = [sendTo.bret,sendTo.chelsea]
            //to = [sendTo.bret]
            cc = []
            bcc = [];
        break;
        case "Item Notes":
            subject = "Item Notes: " + product.itemNumber;
            body = "These things happened to your gang:" + "\n\n" + itemNotes;
            to = [userInfo.email]
            cc = []
            bcc = [];
        break;
        case "Gang Notes":
            subject = "Gang Summary: " + data.projectID;
            body = "Process: " + matInfo.prodName + "\n" + "Subprocess: " + data.subprocess + "\n" + "Facility: " +  data.facility.destination + "\n" + "Due Date: " +  data.date.due + "\n" + gangNotes + "\n" + escalate;
            to = [userInfo.email];
            cc = []
            bcc = [];
        break;
        case "Reprint":
            subject = "Item is a Reprint: " + product.jobItemId;
            body =  "Gang: " + data.projectID + "\n" + "Order: " + product.jobOrderId + "\n" + "Item: " + product.jobItemId + "\n" + "Reason: " + product.reprintReason + "\n\n" + "This item is a reprint from a previous order. Please check the reason in IMS and the accuracy of the file on the approval report in Switch.";
            to = [userInfo.email];
            cc = []
            bcc = [];
        break;
        case "Replacement":
            subject = "Item is a Replacement: " + product.jobItemId;
            body =  "Gang: " + data.projectID + "\n" + "Order: " + product.jobOrderId + "\n" + "Item: " + product.jobItemId + "\n\n" + "Undersizing has been disabled." + "\n\n" + "This is assumed to be a replacement product for an a-frame.";
            to = [sendTo.bret, sendTo.chelsea];
            cc = []
            bcc = [];
        break;
        case "API GET Failed":
            subject = "API GET Failed: " + data.projectID;
            body = "This job failed to gather the extra information required for processing, likely due to network problems. Please try again.\n\n" + escalate;
            to = [userInfo.email]
            cc = []
            bcc = [sendTo.bret];
        break;
        case "No Facility Assigned":
            //jobItemId does not exist in matInfo, these are being pulled from orderSpecs pass in.
            subject = "No Facility Assigned: " + matInfo.jobItemId;
            body = "No facility is assigned to " + matInfo.jobItemId + ", it has been rejected from gang " + data.projectID + ".\n\n" + escalate;
            to = [userInfo.email]
            cc = []
            bcc = [sendTo.bret];
        break;
        case "Missing File":
            subject = "Missing File: " + product.itemNumber;
            body = "The following file was missing: " + "\n\n" + "Name: " + product.contentFile + "\n" + "Gang: " + data.projectID;
            to = [userInfo.email]
            cc = []
            bcc = [sendTo.bret];
        break;
        case "Prism Post Success":
            subject = "Prism Post Success: " + data.projectID;
            body = "The following gang successfully posted to Prism: " + "\n\n" + "Gang: " + data.projectID + "\n" + "No further action is needed.";
            to = [userInfo.email]
            cc = []
            bcc = [];
        break;
        case "Prism Post Fail":
            subject = "Prism Post Fail: " + data.projectID;
            body = "The following gang failed to post to Prism: " + "\n\n" + "Gang: " + data.projectID + "\n" + "Please manually finalize the gang on the dashboard.\n\n" + escalate;
            to = [userInfo.email]
            cc = []
            bcc = [sendTo.bret];
        break;
        case "Usage Rejection":
            subject = "Usage Rejected: " + data.projectID;
            body = "The following gang was rejected by the user: " + "\n\n" + "Gang: " + data.projectID + "\n" + "Material: " + data.process + "\n" + "User: " + userInfo.first + " " + userInfo.last + "\n\n" + escalate;
            to = [userInfo.email]
            cc = []
            bcc = [];
        break;
        case "DS 13ozBanner":
            subject = "DS 13ozBanner: " + product.jobItemId;
            body = "The following item is a doublesided 13ozBanner assigned to SLC and needs to be re-routed: " + "\n\n" + "Item: " + product.jobItemId + "\n" + "Material: " + matInfo.prodName + "\n\n" + "It was rejected by the imposition process and was not ganged in Phoenix.";
            to = [userInfo.email]
            cc = [sendTo.chelsea]
            bcc = [];
        break;
        case "Oversized Weld":
            subject = "Oversided Weld: " + product.jobItemId;
            body = "The following item is a welded banner over 168\" assigned to ARL and needs to be re-routed: " + "\n\n" + "Item: " + product.jobItemId + "\n" + "Material: " + matInfo.prodName + "\n\n" + "It was rejected by the imposition process and was not ganged in Phoenix.";
            to = [userInfo.email]
            cc = [sendTo.bret]
            bcc = [];
        break;
        default:
            subject = "Oops...";
            body = "This is a generic error because Bret didn't do his job very well and now we have a problem."
            to = [userInfo.email]
            cc = [sendTo.bret]
            bcc = [];
    }

    var message = {
        subject: subject,
        body: body,
        to: to,
        cc: cc,
        bcc: bcc
    }

    return message;
}