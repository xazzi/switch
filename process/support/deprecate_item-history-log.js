// This function logs the items that failed checks, the info is later used in the Gang Summary emails.
// Moved to sql statements support js.

logItemFailure = function(reason, itemId, data, db, s) {
    function run(reason, itemId, data, db, s){
        data.notes.push([itemId, "Removed", reason]);          //TODO data.notes to be removed at a later date
        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
            ["project-id", data.projectID],
            ["item-number", itemId]
        ], [
            ["status", "Removed from Gang"],
            ["note", reason]
        ]));
        return true; //true means remove item from gang (so any return in item-check-helpers that log here will be removed)
    }
    return run(reason, itemId, data, db, s)
}