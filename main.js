const express = require('express');
const nameGenerator = require('./Generators/NameGenerator.js')

const port = 3000;

var app = express();

app.listen(port, () => {
    nameGenerator.InitialiseGenerators()
    console.log(`listening at http://localhost:${port}`);
});

app.use('/static', express.static('static'))

app.route('/')
    .get((req, res) => {
        res.sendFile(__dirname + '/Pages/home.html');
    });


app.route('/sussy')
.get((req, res) => {
    res.sendFile(__dirname + '/Pages/sussy.html');
});

app.route('/rpgthings')
.get((req, res) => {
    res.sendFile(__dirname + '/Pages/rpgthings.html');
});

app.route('/namegen')
.get((req, res) => {
    res.sendFile(__dirname + '/Pages/rpgthings/name_generator.html');
});

app.route('/api')
.get((req, res) => {
    var types = nameGenerator.ConvertToCode(req.query.t, req.query.st, req.query.c)
    var names = nameGenerator.GenerateName(types);
    res.send(names)
});


