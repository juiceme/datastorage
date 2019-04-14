var fs = require("fs");

var storageList = [];
var flushTimeOut;
var flushTimeoutMilliseconds = 2000;
var SystemLogger;
var runOnce = true;

function createDirectory(directory) {
    try {
	fs.mkdirSync("./" + directory);
	serviceLog("Created directory " + directory);
    } catch(err) {
	console.log("Error creating directory " + directory + " : " + err);
	process.exit(1);
    }
}

function writeConfigurationFile(storage, content, createBackups) {
    try {
	var contentString = JSON.stringify({ file:storage, backup:createBackups, content:content });
	fs.writeFileSync("./configuration/" + storage + ".json", contentString + "\n");
	serviceLog("Wrote to storage space " + storage + ": " + contentString);
    } catch(err) {
	console.log("Error writing to configuration file " + err);
	process.exit(1);
    }
}

function createConfigurationFile(storage, template, createBackups) {
    writeConfigurationFile(storage, template, createBackups);
}

function checkDirectory(directory) {
    try {
	if(fs.statSync("./" + directory).isDirectory() === true) {
	    serviceLog("Storage directory " + directory + " exists");
	    return true;
	} else {
	    console.log("Error; directory " + directory + " is a file");
	    process.exit(1);
	}
    } catch(err) {
	if(err.code === "ENOENT") {
	    createDirectory(directory);
	    return true;
	} else {
	    // log error and exit
	    console.log("Error accessing directory " + directory + " : " + err);
	    process.exit(1);
	}
    }
}

function getStorageFileContent(storage, template, createBackups) {
    checkDirectory("configuration");
    try {
	content = fs.readFileSync("./configuration/" + storage + ".json");
	return(JSON.parse(content));
    } catch(err) {
	if(err.code === "ENOENT") {
	    createConfigurationFile(storage, template, createBackups);
	    return { file:storage, backup:createBackups, content:template }
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

function initialize(storage, template, createBackups) {
    if(runOnce) {
	runOnce = false;
	backup();
    }
    if(typeof(storage) === "undefined") {
	serviceLog("Cannot initialize undefined storage space");
	return false;
    }
    if(typeof(createBackups) !== "boolean" ) { createBackups = false; }
    if(typeof(template) !== "object") { template = {}; }
    if(!isStorageInitialized(storage)) {
	serviceLog("Creating storage space " + storage);
	storageList.push(getStorageFileContent(storage, template, createBackups));
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
    var oldItem = storageList.filter(function(s) { return (s.file === storage); })[0];
    var newList = storageList.filter(function(s) { return (s.file !== storage); });
    newList.push({ file: storage, backup:oldItem.backup, content: newContent })
    storageList = newList;
    clearTimeout(flushTimeOut);
    flushTimeOut = setTimeout(function() {
	flush();
    }, flushTimeoutMilliseconds);
    return true;
}

function deleteStorage(storage)
{
    if(!isStorageInitialized(storage)) {
	serviceLog("Cannot delete uninitialized storage space " + storage);
	return false;
    }
    var newList = storageList.filter(function(s) { return (s.file !== storage); });
    storageList = newList;
    if(fs.existsSync("./configuration/" + storage + ".json") !== true) {
	serviceLog("Cannot delete nonexistent storage space file " + storage + ".json");
	return false;
    }
    fs.unlinkSync("./configuration/" + storage + ".json");
    serviceLog("Deleted storage space " + storage);
    return true;
}

function info() {
    return storageList;
}

function backup() {
    checkDirectory("configuration");
    checkDirectory("configuration/backup");
    now = new Date().toJSON().replace(/\:/g, ".");
    var countAll = 0;
    var countBackups = 0;
    try {
        fs.readdirSync("./configuration")
	    .filter(function(f) {
		return (f.indexOf("json") > 0)
	    }).forEach(function(s) {
		countAll++;
		var content = JSON.parse(fs.readFileSync("./configuration/" + s));
		if(content.backup === true) {
		    countBackups++;
		    fs.createReadStream("./configuration/" + s)
			.pipe(fs.createWriteStream("./configuration/backup/" + now + "_" + s));
		    }
	    });
    } catch(err) {
	// log error and exit
	console.log("Error backing up files " + err);
	process.exit(1);
    }
    serviceLog("Checked " + countAll + " files and backed up " + countBackups + " storage spaces.");
    return true;
}

function flush() {
    var flushCount = 0;
    storageList.forEach(function(s) {
	flushCount++;
	writeConfigurationFile(s.file, s.content, s.backup);
    });
    serviceLog("Flushed " + flushCount + " storage spaces too disk");
}

function setLogger(logger) {
    systemLogger = logger;
}

module.exports.initialize = initialize;
module.exports.isInitialized = isStorageInitialized;
module.exports.info = info;
module.exports.read = read;
module.exports.write = write;
module.exports.deleteStorage = deleteStorage;
module.exports.backup = backup;
module.exports.flush = flush;
module.exports.setLogger = setLogger;
