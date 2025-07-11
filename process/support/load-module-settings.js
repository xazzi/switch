loadModuleSettings = function(s){
    function getProp(key) {
        return s.hasProperty(key) ? s.getPropertyValue(key) : undefined;
    }

    function getCodebase() {
        var codebase = getProp("codebase");
        return codebase === "other" ? getProp("branch") : codebase;
    }

    var module = {
        codebase: getCodebase(),
        fileSource: getProp("fileSource"),
        enabled: getProp("enabled") === "Yes",
        database: {
            imposition: getProp("database")
        },
        devSettings: {
            modified: getProp("devSettings") === "Modified",
            ignoreSubmit: undefined,
            forceUser: undefined
        },
        localEnvironment: getProp("localEnvironment"),
        phoenixServer: getProp("phoenixServer"),
        prismPost: getProp("prismPost") === "Yes",
        prismEndpoint: getProp("prismEndpoint"),
        timezone: getProp("timezone")
    };

    if (module.devSettings.modified) {
        module.devSettings.ignoreSubmit = getProp("ignoreSubmit") === "Yes";
        module.devSettings.forceUser = getProp("forceUser");
    }

    return module;
}

/*
loadModuleSettings = function(s){

    // Set all of the settings from the module itself
    var module = {
        codebase: s.hasProperty("codebase") ? s.getPropertyValue("codebase") == "other" ? s.getPropertyValue("branch") : s.getPropertyValue("codebase") : undefined,
        fileSource: s.hasProperty("fileSource") ? s.getPropertyValue("fileSource") : undefined,
        enabled: s.hasProperty("enabled") ? s.getPropertyValue("enabled") == "Yes" : undefined,
        database: {
            imposition: s.hasProperty("database") ? s.getPropertyValue("database") : undefined
        },
        devSettings: {
            modified: s.hasProperty("devSettings") ? s.getPropertyValue("devSettings") == "Modified" : undefined,
            ignoreSubmit: s.hasProperty("ignoreSubmit") ? false : undefined,
            forceUser: s.hasProperty("forceUser") ? "None" : undefined
        },
        localEnvironment: s.hasProperty("localEnvironment") ? s.getPropertyValue("localEnvironment") : undefined,
        phoenixServer: s.hasProperty("phoenixServer") ? s.getPropertyValue("phoenixServer") : undefined,
        prismPost: s.hasProperty("prismPost") ? s.getPropertyValue("prismPost") == "Yes" : undefined,
        prismEndpoint: s.hasProperty("prismEndpoint") ? s.getPropertyValue("prismEndpoint") : undefined,
        timezone: s.hasProperty("timezone") ? s.getPropertyValue("timezone") : undefined
    }

    // Dev Settings options
    if(module.devSettings.modified){
        module.devSettings.ignoreSubmit = s.getPropertyValue("ignoreSubmit") == "Yes"
        module.devSettings.forceUser = s.getPropertyValue("forceUser")
    }

    return module
}
*/