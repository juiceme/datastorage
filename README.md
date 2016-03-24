# datastorage

A node.js persistent object cache and data storage module.

## Description

Datastorage is a module that stores and caches JSON objects, usable with any nodejs script. Each object is saved/retrieved transparently from a JSON text file under configuration directory.

## Installation

Datasrorage has no external dependencies.

## Features

* Objects stored in JSON files
* Automatic backup of current configuration
  
## Coming soon!

* Probably more enhancements as I think them up :)
    
## Documentation
```
var dataStorage = require("./datastorage");
dataStorage.initialize("objectName");
dataStorage.info("objectName");
dataStorage.read("objectName");
dataStorage.write("objectName", dataObject);
dataStorage.backup();
dataStorage.flush();
dataStorage.setLogger(loggerFunction);
```

## License

Datastorage is available under the GPLv3 license.
