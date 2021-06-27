const express = require('express');
const path = require('path');

const router = express.Router()

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'home.html'))
})

router.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'auth.html'))
})

router.post('/auth', (req, res) => {
    console.log(req.body.access_key)
    console.log(req.body.secret_access_key)
    console.log(req.body.region)
    res.redirect('/auth_suc')
    // console.log(req.body.service)
    // res.sendFile(path.join(__dirname , 'public', 'auth_suc2.html'))
})

router.get('/auth_suc', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'auth_suc1.html'))
})

router.post('/auth_suc', (req, res) => {
    console.log(req.body.service)
    res.sendFile(path.join(__dirname , 'public', 'auth_suc1.html'))
})


module.exports = router