const express = require('express');
const path = require('path');

const router = express.Router()

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'home.html'))
})

router.get('/aws/auth', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'auth.html'))
})

router.post('/aws/auth', (req, res) => {
    console.log(req.body.access_key)
    console.log(req.body.secret_access_key)
    console.log(req.body.region)
    res.redirect('/aws/auth_success')
    // console.log(req.body.service)
    // res.sendFile(path.join(__dirname , 'public', 'html', 'auth_suc2.html'))
})

router.get('/aws/auth_success', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'auth_success.html'))
})

router.post('/aws/auth_success', (req, res) => {
    console.log(req.body.service)
    if(req.body.service === 'ec2'){
        res.redirect('/aws/ec2')
    }
    if(req.body.service === 'ecs'){
        res.redirect('/aws/ecs')
    }
})

router.get('/aws/ec2', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'ec2.html'))
})

router.post('/aws/ec2', (req, res) => {
    console.log(req.body.module)
    if(req.body.module === 'stop_instances'){
        res.sendFile(path.join(__dirname , 'public', 'html', 'ec2_stop.html'))
    }
    if(req.body.module === 'terminate_instances'){
        res.sendFile(path.join(__dirname , 'public', 'html', 'ec2_terminate.html'))
    }
    if(req.body.module === 'start_instances'){
        res.sendFile(path.join(__dirname , 'public', 'html', 'ec2_start.html'))
    }
})


module.exports = router