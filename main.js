const express = require('express');
const generatorHandler = require('./Generators/GeneratorHandler.js')

const port = 3000;

var app = express();

app.listen(port, () => {
    generatorHandler.InitialiseGenerators()
    console.log(`listening at http://localhost:${port}`);
})
app.use('/static', express.static('static'))
    .get('/', (req, res) => {res.sendFile(__dirname + '/Pages/home.html')})
    .get('/sussy', (req, res) => {res.sendFile(__dirname + '/Pages/sussy.html')})
    .get('/rpgthings', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings.html')})
    .get('/namegen', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings/name_generator.html')})

app.route('/api')
.get((req, res) => {
    var type = req.query.t;
    var data = [req.query.st, req.query.q1, req.query.q2];
    console.log(req.query)
    var result = generatorHandler.GenerateFrom(type, data);
    res.send(result);
});

app.use((req, res) => {
    res.status(404);
    res.sendFile(__dirname+'/Pages/404.html');
});



