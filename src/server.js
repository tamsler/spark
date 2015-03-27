var rest = require('restler');
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;

var db;
var DB_USER = process.env.SPARK_DB_USER;
var DB_PW = process.evn.SPARK_DB_PW;
var SP_URL = process.env.SPARK_URL;
var SP_TOKEN = process.env.SPARK_TOKEN;

var mongoClient = new MongoClient(new Server('ds055709.mongolab.com', 55709), { native_parser: false });
var tempCollection;

mongoClient.open(function(err, mongoClient) {

    if(err) {

        console.log("DEBUG: err : ", err.message);
    }

    db = mongoClient.db("spark");

    db.authenticate(DB_USER, DB_PW, function(err, result) {

        if(err) {

            console.log("DEBUG: err 2 : ", err.message);
        }
        else {

            tempCollection = db.collection("temp");

            setInterval(getData, 60000);
        }
    });
});

function getData() {

    rest.get(SP_URL, {accessToken : SP_TOKEN}).on('complete', function(data) {

        if(data && data.result && data.coreInfo && data.coreInfo.last_heard) {

        tempCollection.insert({ "t" : data.result, "d" : new Date(data.coreInfo.last_heard) }, function(err, result) {

                if(err) {

                    console.log("ERROR: DB insert : ", err.message);
                }
            });
        }
        else {

            console.log("ERROR: Got no valid data from Spark REST call : %j", data);
        }
    });
}

