const functions = require('firebase-functions');
const express = require('express');
const generatorHandler = require('./Generators/GeneratorHandler.js');

var server = express();

server.use('/static', express.static('static'))
    // Home
    .get('/', (req, res) => {res.sendFile(__dirname + '/Pages/home.html')})

    // Minecraft
    .get('/minecraft', (req, res) => {res.sendFile(__dirname + '/Pages/minecraft/minecraft.html')})
    .get('/minecraft/tbh', (req, res) => {res.sendFile(__dirname + '/Pages/minecraft/tbh.html')})

    // RPG Things
    .get('/rpgthings', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings/rpgthings.html')})
    .get('/rpgthings/namegen', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings/name_generator.html')})

    //  amogus
    .get('/art', (req, res) => {res.sendFile(__dirname + '/Pages/art/art.html')})
    

    // About pages
    .get('/about', (req, res) => {res.sendFile(__dirname + '/Pages/About/about.html')})
    .get('/about/pronouns', (req, res) => {res.sendFile(__dirname + '/Pages/About/pronouns.html')})

    // Contact pages
    .get('/contact', (req, res) => {res.sendFile(__dirname + '/Pages/contact.html')})


    .get('/amogus', (req, res) => {res.sendFile(__dirname + '/Pages/amogus.html')})
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


