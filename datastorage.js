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
    writeConfigurationfile(storage, template);
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

function getStorageFileContent(storage, template) {
    checkDirectory("configuration");
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
    if(runOnce) {
	runOnce = false;
	backup();
    }
    if(typeof(storage) === "undefined") {
	serviceLog("Cannot initialize undefined storage space");
	return false;
    }
    if(typeof(template) !== "object") {	template = {}; }
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
    checkDirectory("configuration");
    checkDirectory("configuration/backup");
    now = new Date().toJSON();
    var count = 0;
    try {
        fs.readdirSync("./configuration")
	    .filter(function(f) {
		return (f.indexOf("json") > 0)
	    }).forEach(function(s) {
		count++;
		fs.createReadStream("./configuration/" + s)
		    .pipe(fs.createWriteStream("./configuration/backup/" + now + "_" + s));
	    });
    } catch(err) {
	// log error and exit
	console.log("Error backing up files " + err);
	process.exit(1);
    }
    serviceLog("Backed up " + count + " storage spaces");
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