let fs = require('fs');

var blogs = [];
var blogInfo = []; //TODO fix this stuff

module.exports.InitialiseHandler = function(){
    collectFiles().then((response) => {
        //console.log("RETURN DATA: "+response);
        blogs = response;
        console.log("Blogs Loaded");
    });
}

async function collectFiles(){
    return new Promise(async (resolve, reject) => {
        fs.readdir("./DynamicPages/pages/", async (err, files) => {
            var data = [];

            var counter = files.length;
            files.forEach(file => {
                Readfile("./DynamicPages/pages/"+file).then((filedata) =>{
                    data.push(filedata);
                    counter--;
                    if(counter == 0){
                        resolve(data);
                    }
                });
            })
        });
    });
}

function Readfile(filename){
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8' , (err, rawdata) => {
            if (err) return console.error(err);
            //console.log("RAW DATA: " + rawdata);
            resolve(rawdata);
        });
    });
}

exports.GetBlogs = async function (_data) {
    return new Promise((resolve, reject) => {
        var count = _data.count

        resolve(blogs.join("<br>"));
    });
}