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


// app.use('/dist', express.static(path.join(__dirname, 'dist')))
// app.use('/plugins', express.static(path.join(__dirname, 'plugins')))
// app.get('/',(req,res) => {
//     res.sendFile(__dirname + '/index.html');
// })

// app.get('/auth',(req,res) => {
//     res.sendFile(__dirname + '/auth.html');
// })

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


const port = 5008;

app.listen(port,function(err){
    if(err) console.log("error in server setup")
    console.log("Server listening to port",port)
})
