getEmailResponse = function(query, product, matInfo, data, userInfo, parameter_1){

    var subject, body, to, cc, bcc;
    var active = false;
    var escalate = "To escalate an issue, please forward this email to Chelsea McVay and Bret Combe."

    var sendTo = {
        bret: "bret.c@digitalroominc.com",
        chelsea: "chelsea.mv@digitalroominc.com",
        archie: "archimedes.t@digitalroominc.com"
    }

    if(query == "Empty Gang"){
        if(matInfo == null){
            matInfo = {
                prodName: "Failed"
            }
        }
    }

    switch(query){
        case "Undefined User":
            active = true;
            subject = "Undefined User!";
            body = "Email: " + userInfo;
            to = [sendTo.bret]
            cc = [sendTo.chelsea]
            bcc = [];
        break;
        case "Undefined Material":
            //paper, material, itemName do not exist in matInfo, these are being pulled from orderSpecs pass in.
            active = true;
            subject = "Undefined Material: " + data.gangNumber;
            body = "The following material specs are undefined:" + "\n\n" + "Paper: " + matInfo.paper.value + "\n" + "Material: " + matInfo.material.value + "\n" + "ItemName: " +  matInfo.itemName + "\n" + "Facility: " +  matInfo.facility  + "\n\n" + "ItemName is not required to be defined, but Paper must be in the database for production.";
            to = [sendTo.chelsea,sendTo.bret]
            cc = [userInfo.email]
            bcc = [];
        break;
        case "New Entry":
            active = true;
            subject = "New Table Entry!";
            body = "A new entry has been added to the " + matInfo + " table!" + "\n\n" + parameter_1;
            to = [sendTo.bret,sendTo.chelsea,sendTo.archie]
            cc = []
            bcc = [];
        break;
        case "New Entry Failed":
            active = true;
            subject = "New Table Entry Failed!";
            body = "A new entry has failed when adding to the " + matInfo + " table!" + "\n\n" + parameter_1;
            to = [sendTo.bret,sendTo.chelsea,sendTo.archie]
            cc = []
            bcc = [];
        break;
        case "Empty Gang":
            active = true;
            subject = "Empty Gang: " + data.gangNumber;
            body = "Process: " + matInfo.prodName + "\n" + "Subprocess: " + data.subprocess + "\n" + "Facility: " +  data.facility.destination + "\n" + "Due Date: " +  data.date.due + "\n" + "All files removed from gang due to errors." + "\n" + escalate;
            to = [userInfo.email];
            cc = []
            bcc = [];
        break;
        case "Facility Mismatch":
            active = true;
            subject = "Facility Mismatch: " + data.gangNumber;
            body = "Process: " + matInfo.prodName + "\n" + "Due Date: " +  data.date.due + "\n\n" + "At least 1 item in your gang has a different facility, please use the routing tool when submitting.";
            to = [userInfo.email];
            cc = []
            bcc = [];
        break;
        case "Gang Notes":
            active = false;
            subject = "Gang Summary: " + data.gangNumber;
            body = "Process: " + matInfo.prodName + "\n" + "Subprocess: " + data.subprocess + "\n" + "Facility: " +  data.facility.destination + "\n" + "Due Date: " +  data.date.due + "\n" + gangNotes + "\n" + escalate;
            to = [userInfo.email];
            cc = []
            bcc = [];
        break;
        case "Reprint":
            active = false;
            subject = "Item is a Reprint: " + product.jobItemId;
            body =  "Gang: " + data.gangNumber + "\n" + "Order: " + product.jobOrderId + "\n" + "Item: " + product.jobItemId + "\n" + "Reason: " + product.reprintReason + "\n\n" + "This item is a reprint from a previous order. Please check the reason in IMS and the accuracy of the file on the approval report in Switch.";
            to = [userInfo.email];
            cc = []
            bcc = [];
        break;
        case "Replacement":
            active = false;
            subject = "Item is a Replacement: " + product.jobItemId;
            body =  "Gang: " + data.gangNumber + "\n" + "Order: " + product.jobOrderId + "\n" + "Item: " + product.jobItemId + "\n\n" + "Undersizing has been disabled." + "\n\n" + "This is assumed to be a replacement product for an a-frame.";
            to = [sendTo.bret, sendTo.chelsea];
            cc = []
            bcc = [];
        break;
        case "API GET Failed":
            active = false;
            subject = "API GET Failed: " + data.gangNumber;
            body = "This job failed to gather the extra information required for processing, likely due to network problems. Please try again.\n\n" + escalate;
            to = [userInfo.email]
            cc = []
            bcc = [sendTo.bret];
        break;
        case "Rejected Subprocess":
            active = true;
            subject = "Rejected Subprocess: " + product.itemNumber;
            body = "Process: " + matInfo.prodName + "\n" + "Subprocess: " + data.subprocess + "\n" + "Facility: " +  data.facility.destination + "\n" + "Due Date: " +  data.date.due + "\n" + "Subprocess still in development, rejecting." + "\n" + escalate;
            to = [userInfo.email];
            cc = [sendTo.bret,sendTo.chelsea]
            bcc = [];
        break;
        case "Prism Post Success":
            active = false;
            subject = "Prism Post Success: " + data.gangNumber;
            body = "The following gang successfully posted to Prism: " + "\n\n" + "Gang: " + data.gangNumber + "\n" + "No further action is needed.";
            to = [userInfo.email]
            cc = []
            bcc = [];
        break;
        case "Prism Post Fail":
            active = true;
            subject = "Prism Post Fail: " + data.gangNumber;
            body = "The following gang failed to post to Prism: " + "\n\n" + "Gang: " + data.gangNumber + "\n" + "Please manually finalize the gang on the dashboard.\n\n" + escalate;
            to = [userInfo.email]
            cc = []
            bcc = [sendTo.bret];
        break;
        case "Usage Rejection":
            active = true;
            subject = "Usage Rejected: " + data.gangNumber;
            body = "The following gang was rejected by the user: " + "\n\n" + "Gang: " + data.gangNumber + "\n" + "Material: " + data.process + "\n" + "User: " + userInfo.first + " " + userInfo.last + "\n\n" + escalate;
            to = [userInfo.email]
            cc = []
            bcc = [];
        break;
        case "Phoenix Product Notification":
            active = true;
            subject = "Product setup needs attention!";
            body = "A new packaging size or style needs to be setup.";
            to = [sendTo.bret,sendTo.chelsea]
            cc = []
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