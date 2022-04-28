getEmailResponse = function(query, product, matInfo, data, userInfo){

    var subject, body, to, cc;
    var itemNotes = "";
    var gangNotes = "";

    var email = {
        bret: "bret.c@digitalroominc.com",
        dalenna: "dalenna.mv@digitalroominc.com",
        chelsea: "chelsea.mv@digitalroominc.com",
        gary: "gary.s@digitalroominc.com",
        chris: "chris.r@digitalroominc.com"
    }

    if(data != null){
        for(var i in data.notes){
            gangNotes += data.notes[i] + "\n";
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
            to = [userInfo.email]
            cc = [email.bret]
        break;
        case "Butt Cut v1":
            subject = "Missing Cut File for Butt Cut: " + product.width + "x" + product.height;
            body = "The following item is missing the required template for the butt-cut process: " + "\n\n" + "Item: " + product.itemNumber + "\n" + "Width: " + product.width + "\n" + "Height: " + product.height + ".\n" + "Please create it via the launcher after processing.";
            to = [userInfo.email]
            cc = [email.bret]
        break;
        case "Undefined Material":
            subject = "Undefined Material: " + data.projectID;
            body = "The following material specs are undefined:" + "\n\n" + "Paper: " + matInfo.imsPaper + "\n" + "ItemName: " +  matInfo.imsItemName  + "\n\n" + "ItemName is not required to be defined, but Paper must be in the database for production.";
            to = [userInfo.email]
            cc = [email.bret,email.chelsea]
        break;
        case "Undefined Material v1":
            subject = "Undefined Material: " + data.projectID;
            //paper, material, itemName do not exist in matInfo, these are being pulled from orderSpecs pass in.
            body = "The following material specs are undefined:" + "\n\n" + "Paper: " + matInfo.paper + "\n" + "Material: " + matInfo.material + "\n" + "ItemName: " +  matInfo.itemName  + "\n\n" + "ItemName is not required to be defined, but Paper must be in the database for production.";
            to = [userInfo.email]
            cc = [email.bret,email.chelsea]
        break;
        case "Item Notes":
            subject = "Item Notes: " + product.itemNumber;
            body = "These things happened to your file:" + "\n\n" + itemNotes;
            to = [userInfo.email]
            cc = [email.bret]
        break;
        case "Gang Notes":
            subject = "Gang Notes: " + data.projectID;
            body = "These things happened to your file:" + "\n\n" + gangNotes;
            to = [userInfo.email];
            cc = [email.bret]
        break;
        case "API GET Failed":
            subject = "API GET Failed: " + data.projectID;
            body = "This job failed to gather the extra information required for processing, likely due to network problems. Please try again. \n\nIf the problem persists, try harder.";
            to = [userInfo.email]
            cc = [email.bret]
        break;
        case "Missing File":
            subject = "Missing File: " + product.itemNumber;
            body = "The following file was missing: " + "\n\n" + "Name: " + product.contentFile + "\n" + "Gang: " + data.projectID;
            to = [userInfo.email]
            cc = [email.bret]
        break;
        case "Prism Post Success":
            subject = "Prism Post Success: " + data.projectID;
            body = "The following gang successfully posted to Prism: " + "\n\n" + "Gang: " + data.projectID + "\n" + "No further action is needed.";
            to = [userInfo.email]
            cc = []
        break;
        case "Prism Post Fail":
            subject = "Prism Post Fail: " + data.projectID;
            body = "The following gang failed to post to Prism: " + "\n\n" + "Gang: " + data.projectID + "\n" + "Please manually finalize the gang on the dashboard.";
            to = [userInfo.email]
            cc = [email.bret]
        break;
        case "Usage Rejection":
            subject = "Usage Rejected: " + data.projectID;
            body = "The following gang was rejected by the user: " + "\n\n" + "Gang: " + data.projectID + "\n" + "Material: " + data.process + "\n" + "User: " + userInfo.first + " " + userInfo.last;
            to = [userInfo.email]
            cc = [email.bret]
        break;
        case "DS 13ozBanner":
            subject = "DS 13ozBanner: " + product.jobItemId;
            body = "The following item is doublesided 13ozBanner assigned to SLC and needs to be re-routed: " + "\n\n" + "Item: " + product.jobItemId + "\n" + "Material: " + matInfo.prodName + "\n\n" + "It was rejected by the imposition process and was not ganged in Phoenix.";
            to = [userInfo.email]
            cc = [email.bret,email.chelsea]
        break;
        default:
            subject = "Oops...";
            body = "This is a generic error because Bret didn't do his job very well and now we have a problem."
            to = [userInfo.email]
            cc = [email.bret]
    }

    var message = {
        subject: subject,
        body: body,
        to: to,
        cc: cc
    }

    return message;
}