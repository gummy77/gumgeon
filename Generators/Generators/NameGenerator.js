let fs = require('fs')

var MarkovChain = {}

function convertData (data){
    var code = ""
    count = 0;
    switch (data[0]) {
        case("char"):
            switch(data[1]){
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
            switch(data[2]){
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
            if(data[3]) count = data[3]
            break
    }

    
    if(_count > 9) code = code + _count
    else code = code + "0" + _count
    return code
}

module.exports.InitialiseGenerator = function(){
    fs.readFile("./Generators/data/names.json", 'utf8' , (err, rawdata) => {
        if (err) return console.error(err);
        var data = JSON.parse(rawdata)

        generateChains(data)
    });
}

function generateChains(data){
    var typeint = 0
    Object.keys(data).forEach(function(type) {
        MarkovChain[typeint.toString()] = {}
        var subtypeint = 0
        Object.keys(data[type]).forEach(function(subtype) {

            var chain = generateChain(data[type][subtype])
            MarkovChain[typeint.toString()][subtypeint.toString()] = chain

            
            subtypeint ++
        })
        typeint ++
    })
    
}

function generateChain(names){

    var list_of_names = [];
    for (var i in names){
        var cname = names[i];
        if (cname != ""){
            list_of_names.push("___" + cname + "___");
        }
    }

    var dict_of_names = {};
    for(i in list_of_names){
        cname = list_of_names[i];
        for(var j = 0; j < cname.length-4; j++){
            var combination = (cname.charAt(j) + cname.charAt(j+1) + cname.charAt(j+2)).toString();
            if(combination in dict_of_names){
                
            }else{
                dict_of_names[combination] = [];
            }
            dict_of_names[combination].push(cname[j+3]) ;
        }
    }
    return dict_of_names;
}

exports.GenerateName = function (data) {
    var type = (parseInt(data.slice(0, 3))).toString()
    var subtype = (parseInt(data.slice(3, 5))).toString()
    var count = (parseInt(data.slice(5,8))).toString()
    var seed = parseInt(data)

    return generateName(type, subtype, count, seed);
}

function generateName (data) {
    
//_type, _subtype, _count, _seed


    var o_subtype = _subtype;
    var dict_of_names = []
    if(_subtype == "0" ){
        Object.keys(MarkovChain[_type]).forEach(function(subtype) {
            dict_of_names = joinChains(dict_of_names, MarkovChain[_type][subtype])
        })
    }else{
        _subtype = (parseInt(_subtype)-1).toString()
        dict_of_names = MarkovChain[_type][_subtype]
    }

    var combination = "___";
    var next_letter = "";
    var result = "";

    while(true){
        var number_of_letters = dict_of_names[combination].length;

        var index = Math.round(Math.random()*(number_of_letters - 1));
        next_letter = dict_of_names[combination][index];
        if(next_letter == "_"){
            break
        } else {
            result = result + next_letter;
            combination = combination[1]+ combination[2] + next_letter;
        }
    }

    if(_count <= 1) return result;

    var names = [];
    names[0] = result;

    for(var i = 0; i < _count-1; i++){
        var newName = generateName(_type, o_subtype, 0, _seed+1);
        while(names.includes(newName)){
            var newName = generateName(_type, o_subtype, 0, _seed+1);
        }
       names.push(newName);
    }

    return names;
}

function joinChains(obj1, obj2){
    for (var key in obj2){
        
        if(obj2.hasOwnProperty(key)){
            if(obj1.hasOwnProperty(key)){
                obj1[key] = obj1[key].concat(obj2[key])
            }else{
                obj1[key] = obj2[key];
            }
        }

    }

    return obj1;
}