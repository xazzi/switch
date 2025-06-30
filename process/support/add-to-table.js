addToTable = function(s, db, table, parameter, example, data, userInfo, object, orderSpecs, tableFormat) {
    var original = parameter;
    parameter = sanitizeParameter(parameter);
    updateLegacyParameter(s, db, table, original, parameter);

    var selectQuery = buildSelectQuery(s, table, parameter, tableFormat, object, orderSpecs);
    db.settings.execute(selectQuery);

    if (db.settings.isRowAvailable()) {
        db.settings.fetchRow();

        if (tableFormat === "new") {
            patchMissingNewFields(db, table, parameter, orderSpecs);
        }

        return parseSpecsRow(table, db, parameter, object, orderSpecs, data);
    }

    var insertQuery = buildInsertQuery(table, parameter, tableFormat, example, object, orderSpecs);
    db.settings.execute(insertQuery);

    sendEmail_db(s, data, null, getEmailResponse("New Entry", null, table, data, userInfo, parameter), userInfo);

    return null;
}

function sanitizeParameter(param) {
    if (param == null) return param;
    return param.replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/,/g, '\\,');
}

function updateLegacyParameter(s, db, table, original, sanitized) {
    if (original == null) return;
    if (sanitized.length !== original.length) {
        var legacyParam = original.replace(/"|'/g, '');
        db.settings.execute("SELECT * FROM settings.`" + table + "` WHERE parameter = '" + legacyParam + "';");
        if (db.settings.isRowAvailable()) {
            db.settings.execute("UPDATE settings.`" + table + "` SET `parameter` = '" + sanitized + "' WHERE (`parameter` = '" + legacyParam + "');");
        }
    }
}

function patchMissingNewFields(db, table, parameter, orderSpecs) {
    if (db.settings.getString(1) == null) {
        db.settings.execute("UPDATE settings.`" + table + "` SET `prism-code` = '" + orderSpecs.code + "' WHERE (`prism-value` = '" + parameter + "');");
    }
    if (db.settings.getString(2) == null) {
        db.settings.execute("UPDATE settings.`" + table + "` SET `prism-label` = '" + orderSpecs.label + "' WHERE (`prism-value` = '" + parameter + "');");
    }
}

function parseSpecsRow(table, db, parameter, object, orderSpecs, data) {
    switch (table) {
        case "specs_paper":
            var map = {
                slc: Number(db.settings.getString(5)),
                bri: Number(db.settings.getString(6)),
                sln: Number(db.settings.getString(7)),
                lou: Number(db.settings.getString(8)),
                arl: Number(db.settings.getString(9)),
                wix: Number(db.settings.getString(10)),
                vn: Number(db.settings.getString(11)),
                sb: Number(db.settings.getString(12)),
                cle: Number(db.settings.getString(13))
            };

            var abbr = data.facility.abbr.toLowerCase();
            var mapId = null;

            if (abbr && map[abbr] != null && !isNaN(map[abbr])) {
                mapId = map[abbr];
            }

            var enabled = mapId !== null;

            return {
                enabled: enabled,
                value: db.settings.getString(1),
                accountTypeCode: db.settings.getString(2),
                map: map,
                mapId: mapId
            };

        case "mxml_mapping":
            return {
                enabled: db.settings.getString(8) === 'y',
                value: db.settings.getString(2) || db.settings.getString(1) || null,
                prismValue: db.settings.getString(1),
                key: null,
                coating: {
                    front: db.settings.getString(3),
                    back: db.settings.getString(4)
                },
                laminate: {
                    front: db.settings.getString(5),
                    back: db.settings.getString(6)
                }
            };

        case "specs_item-name":
            return {
                active: true,
                value: db.settings.getString(1),
                subprocess: db.settings.getString(4)
            };

        case "options_a-frame":
            return {
                enabled: db.settings.getString(7) === 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) || db.settings.getString(3) || null,
                attributes: {
                    color: db.settings.getString(8),
                    type: db.settings.getString(9)
                }
            };

        case "options_yard-frame":
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1),
                undersize: db.settings.getString(5) == 1
            };

        case "options_corner":
        case "options_shape":
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1),
                applyProductLabel: db.settings.getString(5) === "y"
            };

        case "attr_material":
            return specs = {
                enabled: true,
                value: db.settings.getString(3) || db.settings.getString(2) || null
            };

        case "options_cut":
        case "options_edge":
        case "options_display":
        case "options_base":
        case "options_side":
        case "options_view-direction":
        case "options_print-direction":
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            };

        case "options_mount":
            return specs = {
                active: db.settings.getString(4) == "None" ? false : true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }

        case "options_unwind":
            return specs = {
                active: true,
                value: db.settings.getString(1),
                enable: db.settings.getString(4) === "y",
                key: db.settings.getString(5),
                rotation: db.settings.getString(6)
            }

        case "options_grommets":
            return specs = {
				active: true,
				key: db.settings.getString(4)
            };

        case "options_hems":
            return {
                value: db.settings.getString(1).replace(/"/g, ''),
                enable: db.settings.getString(4) === "y",
                method: db.settings.getString(5),
                side: {
                    top: db.settings.getString(6) === "y",
                    bottom: db.settings.getString(7) === "y",
                    left: db.settings.getString(8) === "y",
                    right: db.settings.getString(9) === "y"
                },
                webbing: db.settings.getString(10) === "y"
            };

        case "options_pockets":
            return {
                value: db.settings.getString(1),
                enable: db.settings.getString(4) === "y",
                method: "Active",
                side: {
                    top: db.settings.getString(5) === "y",
                    bottom: db.settings.getString(6) === "y",
                    left: db.settings.getString(7) === "y",
                    right: db.settings.getString(8) === "y"
                },
                size: {
                    top: db.settings.getString(9),
                    bottom: db.settings.getString(10),
                    left: db.settings.getString(11),
                    right: db.settings.getString(12)
                }
            };

        case "options_hardware":
            return {
                active: true,
                prism: {
                    code: db.settings.getString(1),
                    label: db.settings.getString(2),
                    value: db.settings.getString(3).replace(/"/g, '')
                },
                template: {
                    id: db.settings.getString(7),
                    active: false,
                    name: null
                },
                nickname: {
                    global: db.settings.getString(8),
                    slc: db.settings.getString(9),
                    wxm: db.settings.getString(10)
                },
                displaySize: {
                    global: db.settings.getString(11),
                    slc: db.settings.getString(12),
                    wxm: db.settings.getString(13)
                },
                enabled: db.settings.getString(14) === "y",
                example: db.settings.getString(15),
                dateAdded: db.settings.getString(16)
            };

        case "options_diecut":
            return {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1),
                applyProductLabel: db.settings.getString(5) === "y"
            };

        case "options_paper":
            return {
                enabled: db.settings.getString(7) === 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) || db.settings.getString(3) || null,
                prismValue: db.settings.getString(3)
            };

        case "options_coating":
            return {
                enabled: db.settings.getString(9) === 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) || db.settings.getString(3) || null,
                key: db.settings.getString(10),
                front: db.settings.getString(5),
                back: db.settings.getString(6)
            };

        case "options_laminate":
            return {
                enabled: db.settings.getString(9) === 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) || db.settings.getString(3) || null,
                key: db.settings.getString(10),
                front: db.settings.getString(5),
                back: db.settings.getString(6)
            };

        case "orderspecs_substrate":
        case "orderspecs_substrate_combined":
            return {
                enabled: db.settings.getString(7) === 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) || db.settings.getString(3) || null,
                prismValue: db.settings.getString(3)
            };

        case "orderspecs_coating_front":
        case "orderspecs_coating_back":
        case "orderspecs_laminate_front":
        case "orderspecs_laminate_back":
        case "options_material-thickness":
        case "options_print-finish":
        case "options_print-method":
        case "options_bindplace":
            return {
                enabled: db.settings.getString(7) === 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) || db.settings.getString(3) || null
            };

        default:
            return null;
    }
}

function buildSelectQuery(s, table, parameter, tableFormat, object, orderSpecs) {
    if (tableFormat === "mapping") {
        return "SELECT * FROM settings.`" + table + "` WHERE prism_value = '" + parameter + "' AND account_type_code = '" + orderSpecs.accountTypeCode + "';";
    }
    if (table === "options_hardware") {
        return "SELECT * FROM settings.`" + table + "` WHERE `prism-value` = '" + parameter + "' AND width = '" + object.width + "' AND height = '" + object.height + "';";
    }
    if (tableFormat === "new") {
        return "SELECT * FROM settings.`" + table + "` WHERE `prism-value` = '" + parameter + "';";
    }
    if (tableFormat === "orderspecs") {
        return "SELECT * FROM settings.`" + table + "` WHERE `prism_value` = '" + parameter + "';";
    }
    if (tableFormat === "attr") {
        return "SELECT * FROM settings.`" + table + "` WHERE `prism-value` = '" + parameter + "';";
    }
    if (tableFormat === "mxml") {
        return "SELECT * FROM settings.`" + table + "` WHERE `mxml_value` = '" + parameter + "';";
    }
    return "SELECT * FROM settings.`" + table + "` WHERE parameter = '" + parameter + "';";
}

function buildInsertQuery(table, parameter, tableFormat, example, object, orderSpecs) {
    if (tableFormat === "mapping") {
        return "INSERT INTO settings.`" + table + "` (prism_value, account_type_code, date_added, example_item) VALUES ('" + parameter + "','" + orderSpecs.accountTypeCode + "','" + new Date() + "','" + example + "');";
    }
    if (table === "options_hardware") {
        return "INSERT INTO settings.options_hardware (`example-item`, `prism-code`, `prism-label`, `prism-value`, `item-name`, width, height, `date-added`) VALUES ('" + object.jobItemId + "','" + orderSpecs.code + "','" + orderSpecs.label + "','" + orderSpecs.value + "','" + object.itemName + "','" + object.width + "','" + object.height + "','" + new Date() + "');";
    }
    if (tableFormat === "new") {
        return "INSERT INTO settings.`" + table + "` (`prism-code`, `prism-label`, `prism-value`, `date-added`, `example-item`) VALUES ('" + orderSpecs.code + "','" + orderSpecs.label + "','" + orderSpecs.value + "','" + new Date() + "','" + example + "');";
    }
    if (tableFormat === "orderspecs") {
        return "INSERT INTO settings.`" + table + "` (`prism_code`, `prism_label`, `prism_value`, `date_added`, `example_item`) VALUES ('" + orderSpecs.code + "','" + orderSpecs.label + "','" + orderSpecs.value + "','" + new Date() + "','" + example + "');";
    }
    if (tableFormat === "attr") {
        return "INSERT INTO settings.`" + table + "` (`prism-name`, `prism-value`, `date_added`, `example_item`) VALUES ('" + orderSpecs.attribute_name + "','" + orderSpecs.attr_value + "','" + new Date() + "','" + example + "');";
    }
    if (tableFormat === "mxml") {
        return "INSERT INTO settings.`" + table + "` (mxml_value, date_added) VALUES ('" + parameter + "','" + new Date() + "');";
    }
    return "INSERT INTO settings.`" + table + "` (parameter, date_added, example_item) VALUES ('" + parameter + "','" + new Date() + "','" + example + "');";
}
