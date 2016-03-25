var fs = require("fs");

var storageList = [];
var flushTimeOut;
var flushTimeoutMilliseconds = 2000;
var SystemLogger;

function createConfigurationDirectory() {
    try {
	fs.mkdirSync("./configuration");
	serviceLog("Created storage directory");
    } catch(err) {
	console.log("Error creating configuration directory " + err);
	process.exit(1);
    }
}

function writeConfigurationfile(storage, content) {
    try {
	var contentString = JSON.stringify(content) 
	fs.writeFileSync("./configuration/" + storage + ".json", contentString);
	serviceLog("Wrote to storage space " + storage + ": " + contentString);
    } catch(err) {
	console.log("Error writing to configuration file " + err);
	process.exit(1);
    }
}

function createConfigurationfile(storage, template) {
    writeConfigurationfile(storage, JSON.stringify(template));
}

function checkConfigurationDirectory() {
    try {
	if(fs.statSync("./configuration").isDirectory() === true) {
	    serviceLog("Storage directory exists");
	    return true;
	} else {
	    console.log("Error; configuration directory is a file");
	    process.exit(1);
	}
    } catch(err) {
	if(err.code === "ENOENT") {
	    createConfigurationDirectory();
	    return true;
	} else {
	    // log error and exit
	    console.log("Error accessing configuration directory " + err);
	    process.exit(1);
	}
    }

}

function getStorageFileContent(storage, template) {
    checkConfigurationDirectory();
    try {
	content = fs.readFileSync("./configuration/" + storage + ".json");
	return(JSON.parse(content));
    } catch(err) {
	if(err.code === "ENOENT") {
	    createConfigurationfile(storage, template);
	    return template;
	} else {
	    // log error and exit
	    console.log("Error accessing configuration  " + err);
	    process.exit(1);
	}
    }
}

function isStorageInitialized(storage) {
    if(storageList.filter(function(s) {
	return (s.file === storage);
    }).length === 0) {
	return false;
    } else {
	return true;
    }
}

function serviceLog(info) {
    if(typeof(systemLogger) === "function") {
	systemLogger(info);
    }
}


// Exports //

function initialize(storage, template) {
    if(typeof(template) !== "object") {
	template = {};
    }
    if(!isStorageInitialized(storage)) {
	serviceLog("Creating storage space " + storage);
	storageList.push({ file: storage, content: getStorageFileContent(storage, template) });
	return true;
    } else {
	serviceLog("Storage space " + storage + " already initialized");
	return false;
    }
}

function read(storage) {
    if(!isStorageInitialized(storage)) {
	serviceLog("Cannot read uninitialized storage space " + storage);
	return false;
    }

    return storageList.filter(function(s) {
	return (s.file === storage);
    })[0].content;
}

function write(storage, newContent) {
    if(!isStorageInitialized(storage)) {
	serviceLog("Cannot write to uninitialized storage space " + storage);
	return false;
    }
    var newList = storageList.filter(function(s) {
	return (s.file !== storage);
    });
    newList.push({ file: storage, content: newContent })
    storageList = newList;
    clearTimeout(flushTimeOut);
    flushTimeOut = setTimeout(function() {
	flush();
    }, flushTimeoutMilliseconds);

    return true;
}

function info() {
    return storageList;
}

function backup() {
    serviceLog("Backed up storage spaces");
}

function flush() {
    var flushCount = 0;
    storageList.forEach(function(s) {
	flushCount++;
	writeConfigurationfile(s.file, s.content);
    });
    serviceLog("Flushed " + flushCount + " storage spaces too disk");
}

function setLogger(logger) {
    systemLogger = logger;
}

module.exports.initialize = initialize;
module.exports.info = info;
module.exports.read = read;
module.exports.write = write;
module.exports.backup = backup;
module.exports.flush = flush;
module.exports.setLogger = setLogger;