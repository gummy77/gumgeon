const nameGenerator = require('./Generators/NameGenerator.js')

module.exports.InitialiseGenerators = function(){
    nameGenerator.InitialiseGenerator();
}

module.exports.ConvertToCode = function(_type, _subtype, _count){
    var code = ""
    switch(_type){
        case("human"):
        code = code+"000"
        break
        case("elf"):
        code = code+"001";
        break
        case("dwarf"):
        code = code+"002";
        break
        case("gnome"):
        code = code+"003";
        break
    }
    switch(_subtype){
        case("na"):
        code = code+"00"
        break
        case("ma"):
        code = code+"01"
        break
        case("fe"):
        code = code+"02"
        break
        case("su"):
        code = code+"03"
        break
    }
    if(_count > 9) code = code + _count
    else code = code + "0" + _count
    return code
}

exports.GenerateFrom = function (type, data) {
    switch(type){
        case ("name"):
            return nameGenerator.GenerateName(data)
            break;
    }
}