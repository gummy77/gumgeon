let fs = require('fs');

var MarkovChain = {};

module.exports.InitialiseGenerator = function(){
    fs.readFile("./Generators/data/names.json", 'utf8' , (err, rawdata) => {
        if (err) return console.error(err);
        var data = JSON.parse(rawdata);

        generateChains(data);
    });
}

function generateChains(data){
    Object.keys(data).forEach((type) => {
        MarkovChain[type] = {};

        Object.keys(data[type]).forEach(function(subtype) {

            var chain = generateChain(data[type][subtype]);
            MarkovChain[type][subtype] = chain;

        })
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

exports.GenerateName = function (_data) {
    if(_data.gentype != "name") {
        console.error("non-name data passed to name generator");
        return "error";
    }

    return generateName(_data);
}

function generateName (_data) {
    var type = _data.type;
    var subtype = _data.subtype;
    var count = _data.count;
    //var seed = _data.seed

    var dict_of_names = MarkovChain[type][subtype]

    var names = [];
    var halfname = "";
    while(names.length < count){
        var combination = "___";
        var next_letter = "";
        var result = "";
        
        while(true){
            var number_of_letters = dict_of_names[combination].length;

            var index = Math.round(Math.random()*(number_of_letters - 1));
            next_letter = dict_of_names[combination][index];
            if(next_letter == "_"){
                break;
            } else {
                result = result + next_letter;
                combination = combination[1]+ combination[2] + next_letter;
            }
        }
            
        if(!names.includes(result)){
            if(Math.random() <= 0.05 && subtype == "surname"){
                halfname = result;
            }else {
                if(halfname != ''){
                    names.push(result+"-"+halfname);
                    halfname = "";
                }else{
                    names.push(result);
                }
            }
        }
    }
    return names;
}


function joinChains(obj){ //needs to be fixed for mixed names?
    newobj = []
    obj.forEach((subobj) => {
         newobj = newobj.concat(subobj)
    })
    console.log(obj)
    console.log(newobj)
    return newobj;
}