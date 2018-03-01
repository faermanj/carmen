function getEnv(varName, defaultValue) {
    var result = "";
    try {
        ObjC.import("stdlib");
        result = $.getenv(varName);
    } catch (e) {
        console.log(e);
        result = defaultValue;
    }
    //console.log(`${varName} = ${result}`);
    return result;
}

module.exports.getEnv = getEnv