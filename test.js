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
	   "Uninitialized write should fail");
    assert(datastorage.read("luusto") === false,
	   "Uninitialized read should fail");
    assert(datastorage.info().length === 0,
	   "Uninitialized info should be empty");
    assert(datastorage.isInitialized("luusto") === false,
	   "Query on uninitialized storage should return false");

    // initialize storages:
    assert(datastorage.initialize("luusto") === true,
	   "First initialize should succeed");
    assert(datastorage.initialize("juusto", {default: "emmental"}) === true,
	   "First initialize with template should succeed");
    assert(datastorage.isInitialized("luusto") === true,
	   "Query on initialized storage should return true");

    // initialized storages access:
    assert(Object.keys(datastorage.read("luusto")).length === 0,
	   "Initialized read of empty storage should succeed");
    assert(Object.keys(datastorage.read("juusto")).length === 1,
	   "Initialized read of storage with template should succeed");
    assert(datastorage.read("juusto").default === "emmental",
	   "Initialized read of storage with template should succeed");

    assert(datastorage.write("luusto", {kallo:1, olkaluu:2, kylkiluu:24, sormiluut:28}) === true,
	   "Initialized write should succeed");
    assert(Object.keys(datastorage.read("luusto")).length === 4, "Initialized read should succeed");
    assert(datastorage.read("luusto").kallo === 1, "Initialized read should succeed");
    assert(datastorage.read("luusto").kylkiluu === 24, "Initialized read should succeed");
    assert(datastorage.info().length === 2, "Initialized info should contain 2 files");
    assert(datastorage.flush() === undefined, "flush should not return any value");

    // file contents
    assert(JSON.parse(fs.readFileSync("configuration/juusto.json")).content.default === "emmental",
	   "Storage file should be parseable JSON");
    assert(JSON.parse(fs.readFileSync("configuration/luusto.json")).content.sormiluut === 28,
	   "Storage file should be parseable JSON");

    // backing up files
    assert(datastorage.backup() === true,
	   "Backup when nothing to backup should succeed");
    assert(fs.readdirSync("./configuration/backup").length === 0,
	   "Backup directory should be empty when nothing to backup");
    assert(datastorage.initialize("kuusto", false, true) === true,
	   "Initialize without template and backup set to true should succeed");
    assert(datastorage.initialize("suusto", {lihas: "kieli", luu: "hampaat"} , true) === true,
	   "Initialize with template and backup set to true should succeed");
    assert(datastorage.backup() === true,
	   "Backup when content files to backup exist should succeed");
    var backupFiles = fs.readdirSync("configuration/backup");
    assert(backupFiles.length === 2, "Two backup files should exist");

} catch(err) {
    console.log(err);
    process.exit(1);
}

console.log("All tests passed!");
