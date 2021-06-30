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
        res.redirect('/aws/ec2_stop')
    }
    if(req.body.module === 'terminate_instances'){
        res.redirect('/aws/ec2_terminate')
    }
    if(req.body.module === 'start_instances'){
        res.redirect('/aws/ec2_start')
    }
})

router.get('/aws/ec2_stop', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'ec2_stop.html'))
})

router.post('/aws/ec2_stop', (req, res) => {
    console.log(req.body.instance_ids)
    console.log(req.body.az)
    console.log(req.body.filters)
    if (req.body.force) {
        console.log("true");
    } else {
            console.log("false");
    }
    res.redirect('/aws/result')
})

router.get('/aws/ec2_terminate', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'ec2_terminate.html'))
})

router.post('/aws/ec2_terminate', (req, res) => {
    console.log(req.body.instance_ids)
    console.log(req.body.az)
    console.log(req.body.filters)
    res.redirect('/aws/result')
})


router.get('/aws/ec2_start', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'ec2_start.html'))
})

router.post('/aws/ec2_start', (req, res) => {
    console.log(req.body.instance_ids)
    console.log(req.body.az)
    console.log(req.body.filters)
    res.redirect('/aws/result')
})


router.get('/aws/result', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'result.html'))
})

module.exports = router