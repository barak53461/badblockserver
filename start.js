
const SQLITE3 = require('SQLITE3').verbose();
const QS = require('querystring');
const HTTP = require('http');

const HOST = `0.0.0.0`;
const PORT = 8080;
const SINGLEAPOSTROPHE = /'/g;
const QUARYDBTOCLIENT = "SELECT * from ads;";
//initilizes database connection
var db = new SQLITE3.Database('./AdRemove.db', SQLITE3.OPEN_READWRITE,(err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the adRemove SQlite database.');
});
//doubles each single apostrophe so when we inject the sql string the apostrophe dosent stop the string
function sqlecapeapostephi(str){
  return str.replace(SINGLEAPOSTROPHE,SINGLEAPOSTROPHE+SINGLEAPOSTROPHE);
}

function updatekarma(nodeid,isad) {
  console.log('updating karma' + (!isad));
  isad = (isad == 'true')// checks if isad equals true if not assumes false
  db.serialize(() =>{
    if(isad) {
      console.log(isad + "its a ad");
      db.run(`UPDATE ads SET karma=karma+1 WHERE id=${nodeid}`),(err) =>{
      if(err) {
        console.log(err.message);
      }
    }
  }else {
    console.log(isad + "its no ad");
    db.run(`UPDATE ads SET karma=karma-1 WHERE id=${nodeid}`),(err) =>{
      if(err) {
        console.log(err.message);
      }
    }
  }
  });
}

const server = HTTP.createServer((req, res) =>{
  res.statusCode = 200;
  res.setHeader('Content-type','text/plain');
 // res.setHeader('Content-type','application/json');
    if (req.method == 'POST') {
      var body = '';

      req.on('data', function (data) {
        //makes shure that during the connection it collects all data sent
          body += data;

          // kills the connection if the user sent to much data
          // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
          if (body.length > 1e6)
              req.connection.destroy();
      });
      
      req.on('end', function () {
          //parse the data gathered during the connection
          var post = QS.parse(body);
          console.log(post['type']);
          if(post['type'] == 'remove')
          {
            post = sqlecapeapostephi(post['removead']);
            db.serialize(() => {
              db.run(`INSERT INTO ads (node)  VALUES ('${post}');`, (err) => {
                if (err) {
                  console.error(err.message);
                }
              });
            });
          }else if(post['type'] == 'manuelfound'){
            updatekarma(post['nodeid'],post['isad'])
          }
      });
  }
  if (req.method == 'GET')
  {
    adsjson = {approved: null, uncertian: null};
    approved =[];
    uncertian = [];
  //  res.setHeader('Content-type','application/json');
    console.log("get");
    db.all(QUARYDBTOCLIENT, [], (err, rows) => {
      if (err) {
        throw err;
      }
      console.log(rows);
      rows.forEach((row)=>{
        if(row['karma']>=10){
          approved.push(row);
        }else{
          uncertian.push(row);
        }
      });
      adsjson['approved'] = approved;
      adsjson['uncertian'] = uncertian;
      res.write(JSON.stringify(adsjson));
      res.end();
    });
  }
 // console.log(adrows);


});
server.listen(PORT,()=>{
    console.log(`sever starter on port ${PORT} hosted on ${HOST}`)
})
/*
db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Close the database connection.');
});*/
