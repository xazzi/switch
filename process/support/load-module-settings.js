loadModuleSettings = function(s){

    // Set all of the settings from the module itself
    var module = {
        scriptSource: s.hasProperty("scriptSource") ? s.getPropertyValue("scriptSource") : undefined,
        fileSource: s.hasProperty("fileSource") ? s.getPropertyValue("fileSource") : undefined,
        enabled: s.hasProperty("enabled") ? s.getPropertyValue("enabled") == "Yes" : undefined,
        database: {
            selection: s.hasProperty("databases") ? s.getPropertyValue("databases") : undefined,
            general: s.hasProperty("databaseGeneral") ? s.getPropertyValue("databaseGeneral") : undefined,
            history: s.hasProperty("databaseHistory") ? s.getPropertyValue("databaseHistory") : undefined,
            email: s.hasProperty("databaseEmail") ? s.getPropertyValue("databaseEmail") : undefined
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

    // Database options
    if(module.database.selection == "prod"){
        module.database.general = "prod"
        module.database.history = "prod"
        module.database.email = "prod"
    }

    if(module.database.selection == "dev"){
        module.database.general = "dev"
        module.database.history = "dev"
        module.database.email = "dev"
    }

    // Dev Settings options
    if(module.devSettings.modified){
        module.devSettings.ignoreSubmit = s.getPropertyValue("ignoreSubmit") == "Yes"
        module.devSettings.forceUser = s.getPropertyValue("forceUser")
    }

    return module
}
