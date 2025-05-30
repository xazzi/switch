compileCSV = function(product, matInfo, scale, orderArray, data, marksArray, dashInfo, size){
	// Compile the CSV information.	
	return infoArray = [
		["Project ID", data.projectID],
		["Name",product.contentFile],
		["Artwork File",data.repository + product.artworkFile],
		["Ordered",product.quantity],
		["Stock",product.stock],
		["Grade",product.grade + " gsm"],
		["Spacing Type",matInfo.spacing.type],
		["Spacing",product.spacingBase],
		["Spacing Top",product.spacingTop],
		["Spacing Bottom",product.spacingBottom],
		["Spacing Left",product.spacingLeft],
		["Spacing Right",product.spacingRight],
        ["Offcut Top",product.offcut.top],
        ["Offcut Bottom",product.offcut.bottom],
        ["Offcut Left",product.offcut.left],
        ["Offcut Right",product.offcut.right],
		["Bleed Type",product.bleed.type],
		["Bleed",product.bleed.base],
		["Bleed Top",product.bleed.top],
		["Bleed Bottom",product.bleed.bottom],
		["Bleed Left",product.bleed.left],
		["Bleed Right",product.bleed.right],
		["Rotation",product.rotation],
		["Allowed Rotations",product.allowedRotations],
		["Width",size.width],
		["Height",size.height],
        ["Scale Width",scale.width],
		["Scale Height",scale.height],
		["View Width",product.width],
		["View Height",product.height],
		["Description",product.description],
		["Shape Search",product.shapeSearch],
		["Notes","SheetLevelData"], //Unused?
		["Page Handling",product.pageHandling],
		["METRIX_NAME",product.orderNumber],
		["Item Number",product.itemNumber],
		["Coating",data.coating.value],
		["Product Notes",orderArray.productNotes],
		["A-Frame Type",orderArray.frame.value],
		["Mount Info",orderArray.mount.value],
		["Base Type",orderArray.base.active ? orderArray.base.value : orderArray.display.active ? orderArray.display.value : "Unknown Hardware"],
		["Die Design Source",product.dieDesignSource],
		["Die Design Name",product.dieDesignName],
		["Max Overruns",product.overrunMax],
		["Min Overruns",product.overrunMin],
		["Ship Date",orderArray.date.due],
		["Abbr Date",product.date.abbr],
        ["Ship Type",product.shipType],
		["Due Date",data.date.due],
		["Abbr Due Date",data.date.due.split('-')[2]],
		["Item Due Date",product.date.due],
		["Gang Info",data.phoenix.gangLabel],
		["Group",product.group],
		["Custom Label",product.customLabel.value],
		["Custom Label Size",product.customLabel.size],
		["Edge Top",product.pocket.top == true ? "Pocket" : product.hemValue],
		["Edge Bottom",product.pocket.bottom == true ? "Pocket" : product.hemValue],
		["Edge Left",product.pocket.left == true ? "Pocket" : product.hemValue],
		["Edge Right",product.pocket.right == true ? "Pocket" : product.hemValue],
		["Finishing Type",orderArray.finishingType],
		["Dash Offset",typeof(dashInfo["offset"]) == "undefined" ? "None" : dashInfo.offset],
		["Late",product.late],
		["Reprint",product.reprint.status],
		["Gang Reprint",data.reprint],
        ["Script Name",product.script.name],
		["Script Parameters",product.script.parameters],
		["Script Dynamic",product.script.dynamic],
		["Script Pockets",product.script.pockets],
		["Item Name",product.itemName],
		["Facility",data.facility.destination],
		["Pages",orderArray.pageQty],
		["Folding Patterns",product.foldingPatterns],
		["Type",product.type],
		["Binding Method",product.bindingMethod],
		["Binding Edge",product.bindingEdge],
		["Reading Order",product.readingOrder],
		["N-Up",product.nUp],
		["N-Up Gap",product.nUpGap],
		["Paper",data.paper.replace(/[,;"']/g,'')],
		["Marks",marksArray]// Keep this one last so it's easier to read the CSV
	];
}