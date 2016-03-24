hii = require("./datastorage");

function myLogger(logline) { console.log(logline); };

//hii.setLogger(myLogger);

// uninitialized spaces access:
hii.write("lapaluu", {blingbling: "lupalaa"});
console.log("READ: " + JSON.stringify(hii.read("lapaluu")));
hii.info();

// normal access:
hii.initialize("olkaluu");
hii.write("olkaluu", {paaluu: "luupala"});
hii.write("olkaluu", {sipuli: "sapuli"});
console.log("READ: " + JSON.stringify(hii.read("olkaluu")));
hii.info();
hii.flush();

hii.initialize("autch", myLogger);
console.log("READ: " + JSON.stringify(hii.read("autch")));
hii.write("autch", {kipuili: "kapuli"});
