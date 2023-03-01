const nameGenerator = require('./Generators/NameGenerator.js');

module.exports.InitialiseGenerators = function(){
    nameGenerator.InitialiseGenerator();
}

exports.GenerateFrom = function (_data) {
    var type = _data.gentype
    switch(type){
        case ("name"):
            return nameGenerator.GenerateName(_data);
            break;
    }
}