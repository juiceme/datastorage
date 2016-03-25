fs = require("fs");
assert = require("assert");
datastorage = require("./datastorage");

function myLogger(logline) { console.log((new Date()) + " --- " + logline); };

// enable logs by uncommenting the line below;
// datastorage.setLogger(myLogger);

// delete all config files
try { fs.readdirSync("configuration/backup")
      .forEach(function(s) { fs.unlinkSync("configuration/backup/" + s); });
    } catch(err) {};
try { fs.rmdirSync("configuration/backup"); } catch(err) {};
try { fs.readdirSync("configuration")
      .forEach(function(s) { fs.unlinkSync("configuration/" + s); });
    } catch(err) {};
try { fs.rmdirSync("configuration"); } catch(err) {};

// run tests with assert
try {
    // uninitialized storages access:
    assert(datastorage.write("luusto", {varpaat:5, polvet:2}) === false,
	   "Uninitalized write should fail");
    assert(datastorage.read("luusto") === false,
	   "Uninitalized read should fail");
    assert(datastorage.info().length === 0,
	   "Uninitalized info should be empty");

    // initialize storages:
    assert(datastorage.initialize("luusto") === true,
	   "First initialize should succeed");
    assert(datastorage.initialize("juusto", {default: "emmental"}) === true,
	   "First initialize with template should succeed");

    // initialized storages access:
    assert(Object.keys(datastorage.read("luusto")).length === 0,
	   "Initalized read of empty storage should succeed");
    assert(Object.keys(datastorage.read("juusto")).length === 1,
	   "Initalized read of storage with template should succeed");
    assert(datastorage.read("juusto").default === "emmental",
	   "Initalized read of storage with template should succeed");

    assert(datastorage.write("luusto", {kallo:1, olkaluu:2, kylkiluu:24, sormiluut:28}) === true,
	   "Ininitalized write should succeed");
    assert(Object.keys(datastorage.read("luusto")).length === 4, "Ininitalized read should succeed");
    assert(datastorage.read("luusto").kallo === 1, "Ininitalized read should succeed");
    assert(datastorage.read("luusto").kylkiluu === 24, "Ininitalized read should succeed");
    assert(datastorage.info().length === 2, "Initalized info should contain 2 files");
    assert(datastorage.flush() === undefined, "flush should not return any value");

    // file contents
    assert(JSON.parse(fs.readFileSync("configuration/juusto.json")).default === "emmental",
	   "Storage file should be parseable JSON");
    assert(JSON.parse(fs.readFileSync("configuration/luusto.json")).sormiluut === 28,
	   "Storage file should be parseable JSON");
} catch(err) {
    console.log(err);
    process.exit(1);
}

console.log("All tests passed!");
