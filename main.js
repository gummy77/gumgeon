const express = require('express');
const generatorHandler = require('./Generators/GeneratorHandler.js');

const port = 3000;

var app = express();

app.listen(port, () => {
    generatorHandler.InitialiseGenerators();
    console.log(`listening at http://localhost:${port}`);
})
app.use('/static', express.static('static'))
    .get('/', (req, res) => {res.sendFile(__dirname + '/Pages/home.html')})
    .get('/amogus', (req, res) => {res.sendFile(__dirname + '/Pages/amogus.html')})
    .get('/rpgthings', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings.html')})
    .get('/namegen', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings/name_generator.html')})
    .get('/about', (req, res) => {res.sendFile(__dirname + '/Pages/about.html')})
    .get('/contact', (req, res) => {res.sendFile(__dirname + '/Pages/contact.html')});

app.route('/api')
.get((req, res) => {
    var data = req.query;
    var result = generatorHandler.GenerateFrom(data);
    if(result == "error") return res.sendStatus(500);
    res.send(result);
});

// app.use((req, res) => {
//     console.log("someone tried to access: ");
//     res.status(404);
//     res.sendFile(__dirname+'/Pages/404.html');
// });



