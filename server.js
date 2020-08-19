const express       = require('express');
const bodyParser    = require('body-parser');
const path          = require('path');
const fs            = require('fs');
const http          = require('http');
const marked        = require('marked');
const app           = express();
const PORT          = 4000;
const publicPath    = path.join(__dirname,'public');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/',express.static(publicPath));
app.get('/',function(request,response){
    response.send(path.join(publicPath,'index.html'));
})
http.createServer(app).listen(PORT);
const instructions = fs.readFileSync(path.join(publicPath,'instructions.md'),'utf-8');
fs.writeFileSync(path.join(publicPath,'instructions.html'),marked(instructions));
console.log(`Server running in http://localhost:${PORT}/`);