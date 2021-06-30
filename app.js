const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const router = require('./router');

const app = express();
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(cookieParser())

app.use('/', router)

app.use('/public', express.static(path.join(__dirname, 'public')))

const port = 5008;

app.listen(port,function(err){
    if(err) console.log("error in server setup")
    console.log("Server listening to port",port)
})
