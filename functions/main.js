const functions = require('firebase-functions');
const express = require('express');
const favicon = require('serve-favicon');
const generatorHandler = require('./Generators/GeneratorHandler.js');

var server = express();

server.use(favicon(__dirname + '/favicon.ico')); 

server.use('/static', express.static('static'))
    .get('/', (req, res) => {res.sendFile(__dirname + '/Pages/home.html')})
    .get('/amogus', (req, res) => {res.sendFile(__dirname + '/Pages/amogus.html')})
    .get('/rpgthings', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings.html')})
    .get('/namegen', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings/name_generator.html')})
    .get('/about', (req, res) => {res.sendFile(__dirname + '/Pages/about.html')})
    .get('/contact', (req, res) => {res.sendFile(__dirname + '/Pages/contact.html')})
    .get('/template', (req,res) => {res.sendFile(__dirname + "/Pages/template.html")});

server.route('/api')
.get((req, res) => {
    var data = req.query;
    var result = generatorHandler.GenerateFrom(data);
    if(result == "error") return res.sendStatus(500);
    res.send(result);
});

generatorHandler.InitialiseGenerators();
exports.app = functions.https.onRequest(server);


