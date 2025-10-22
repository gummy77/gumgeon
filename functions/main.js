const functions = require('firebase-functions');
const express = require('express');
const generatorHandler = require('./Generators/GeneratorHandler.js');
const pageHandler = require('./DynamicPages/DynamicPageHandler.js');

var server = express();

server.use('/static', express.static('static'))
    // Home
    .get('/', (req, res) => {res.sendFile(__dirname + '/Pages/home.html')})

    // Minecraft
    .get('/minecraft', (req, res) => {res.sendFile(__dirname + '/Pages/minecraft/minecraft.html')})
    .get('/minecraft/tbh', (req, res) => {res.sendFile(__dirname + '/Pages/minecraft/tbh.html')})
    .get('/minecraft/corkboard', (req, res) => {res.sendFile(__dirname + '/Pages/minecraft/corkboard.html')})
    .get('/minecraft/basic', (req, res) => {res.sendFile(__dirname + '/Pages/minecraft/basic.html')})

    .get('/projects', (req, res) => {res.sendFile(__dirname + '/Pages/projects.html')})

    .get('/blogs', (req, res) => {res.sendFile(__dirname + '/Pages/blogs.html')})

    // RPG Things
    .get('/rpgthings', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings/rpgthings.html')})
    .get('/rpgthings/namegen', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings/name_generator.html')})
    .get('/rpgthings/planetgen', (req, res) => {res.sendFile(__dirname + '/Pages/rpgthings/planet_generator.html')})

    //  amogus
    .get('/art', (req, res) => {res.sendFile(__dirname + '/Pages/art/art.html')})
    

    // About pages
    .get('/about', (req, res) => {res.sendFile(__dirname + '/Pages/About/about.html')})
    .get('/about/pronouns', (req, res) => {res.sendFile(__dirname + '/Pages/About/pronouns.html')})
    .get('/about/family', (req, res) => {res.sendFile(__dirname + '/Pages/About/friends.html')})

    // Contact pages
    .get('/contact', (req, res) => {res.sendFile(__dirname + '/Pages/contact.html')})


    .get('/amogus', (req, res) => {res.sendFile(__dirname + '/Pages/amogus.html')})
    .get('/template', (req,res) => {res.sendFile(__dirname + "/Pages/template.html")})

server.route('/api')
.get((req, res) => {
    var data = req.query;
    var result = generatorHandler.GenerateFrom(data);
    if(result == "error") return res.sendStatus(500);
    res.send(result);
});

server.route('/api/blogs')
.get((req, res) => {
    var data = req.query;
    if(data.isShort){
        pageHandler.GetBlogPosts(data).then((result) => {
            if(result == "err") return res.sendStatus(500);
            res.send(result);
        });
    } else {
        pageHandler.GetBlogs(data).then((result) => {
            if(result == "err") return res.sendStatus(500);
            res.send(result);
        });
    }
});


generatorHandler.InitialiseGenerators();
pageHandler.InitialiseHandler();
exports.app = functions.https.onRequest(server);


