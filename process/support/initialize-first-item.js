initializeFirstItem = function(data, matInfo, orderSpecs) {
    data.prodName = matInfo.prodName;
    data.prodMatFileName = matInfo.prodMatFileName ?? matInfo.prodName;

    data.paper = orderSpecs.paper.value;
    data.prismStock ??= orderSpecs.paper.value;

    data.cover.value = orderSpecs.cover.value;

    data.date.due = orderSpecs.date.due;

    data.doubleSided = orderSpecs.doubleSided;
    data.secondSurface = orderSpecs.secondSurface;

    data.laminate = {
        active: orderSpecs.laminate.active,
        method: orderSpecs.laminate.method,
        value: orderSpecs.laminate.value,
    };

    data.coating.front = {
        enabled: orderSpecs.coating.front.enabled,
        label: orderSpecs.coating.front.label,
        value: orderSpecs.coating.front.value,
    };

    data.coating.back = {
        enabled: orderSpecs.coating.back.enabled,
        label: orderSpecs.coating.back.label,
        value: orderSpecs.coating.back.value,
    };

    data.mount = {
        active: orderSpecs.mount.active
    };

    data.impositionProfile = {
        name: matInfo.impositionProfile,
        method: `Default (${matInfo.phoenixMethodUserFriendly})`
    };

    data.cropGang = matInfo.cropGang;
    data.finishingType = orderSpecs.finishingType;
    data.rotateFront = matInfo.rotateFront;
    data.rotateBack = matInfo.rotateBack;
    data.rotate90 = matInfo.rotate90;
    data.sideMix = matInfo.sideMix;
    data.printer = matInfo.printer.name;
    data.phoenixPress = matInfo.phoenixPress;
    data.phoenixStock = matInfo.phoenixStock;

    data.phoenix.printExport = matInfo.phoenix.printExport;
    data.phoenix.cutExport = matInfo.phoenix.cutExport;

    data.phoenix.gangLabel.push(matInfo.prodName);

    // Label rules
    const isLFP = matInfo.type === "roll" || matInfo.type === "sheet";
    if (isLFP && (data.frontCoating?.enabled || data.backCoating?.enabled || data.laminate?.active)) {
        data.phoenix.gangLabel.push("Lam");
    }

    if (data.mount.active) {
        data.phoenix.gangLabel.push("Mount");
    }
}
