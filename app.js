const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(cookieParser())

const port = 3000;

app.get('/',(req,res)=>{
    if(req.cookies['user']){
        res.sendFile(__dirname + '/index.html');
    }else{
        res.sendFile(__dirname + '/auth.html');
    }
})
/** 
app.post('/auth.html',(req,res)=>{
    const user = {
        ak = req.body.ak,
        sak = req.body.sak,
        rn = req.body.rn
    };
    res.cookie("user",user);
    res.redirect('index.html');
})
*/
app.listen(port,function(err){
    if(err) console.log("error in server setup")
    console.log("Server listening to port",port);
})
