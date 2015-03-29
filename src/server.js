var http = require('http');
var fs = require('fs');
var rest = require('restler');
var MongoClient = require('mongodb').MongoClient;

var SP_DB = process.env.SP_DB;
var SP_URL = process.env.SP_URL;
var SP_TOKEN = process.env.SP_TOKEN;
var SP_DB_KEY = process.env.SP_DB_KEY;

var tempCollection;

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

MongoClient.connect(SP_DB, function(err, db) {

    if(err) {

        console.log("DEBUG: err : ", err.message);
    }
    else {

        tempCollection = db.collection("temp");

        setInterval(getData, 60000);

        fs.readFile('./index.html', function (err, html) {

            if (err) {

                throw err;
            }

            http.createServer(function(request, response) {

                if("/" === request.url) {

                    response.writeHeader(200, {"Content-Type": "text/html"});
                    response.end(html);
                }
                else if(request.url.indexOf("/data") === 0) {

                    var date = new Date();
                    date.setHours(date.getHours() - 16);
                    var url = 'https://api.mongolab.com/api/1/databases/spark/collections/temp?q={ "d" : { "$gte" : { "$date" : "' + date.toISOString() +' " } } }&apiKey=' + SP_DB_KEY;

                    rest.get(url).on('complete', function(data) {

                        if(data) {

                            response.writeHeader(200, {"Content-Type": "application/json"});
                            response.end(JSON.stringify(data));
                        }
                        else {

                            response.writeHeader(500, {"Content-Type": "application/json"});
                            response.end("[]");
                        }
                    });
                }
                else {

                    response.writeHeader(200, {"Content-Type": "text/plain"});
                    response.end("Hello");
                }
            }).listen(8080);
        });
    }
});


