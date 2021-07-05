const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require("node-fetch");
const { exec } = require('child_process')
const { PythonShell } = require('python-shell')

const router = express.Router()

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'home.html'))
})

router.get('/aws/auth', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'auth.html'))
})

router.post('/aws/auth', (req, res) => {
    var authenticate = new Promise((resolve, reject) => {
        data1 = `[default] \naws_access_key_id = ${req.body.access_key} \naws_secret_access_key = ${req.body.secret_access_key}\nregion = ${req.body.region}`
        data2 = `[default] \nregion = ${req.body.region}`
        done = true
        PythonShell.run('../../../../../../../home/harshal1711/app.py', {args : [`${req.body.region}`]}, (err) => {
            if (err) throw err;
        })
        fs.writeFile('/home/harshal1711/.aws/credentials', data1, (err)=>{
            if(err) {
                done = false
            }
        })
        fs.writeFile('/home/harshal1711/.aws/config', data2, (err)=>{
            if(err) {
                done = false
            }
        })
        if (done) {
            resolve();
        }
        else{
            reject('Error in updating authentication file')
        }
    });
    
    authenticate.then(function () {
        res.redirect('/aws/auth_success')
    }).catch((err) => {
        console.log(err)
        res.redirect('/aws/auth_success')
        window.alert("Error updating authentication details")
    });
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
    json_req = `{"service": "ec2", "exp": "stop_instances"`
    if(req.body.instance_ids){
        json_req += `,"id": "${req.body.instance_ids.split(",")}"`
    }    
    if(req.body.az){
        json_req += `,"az": "${req.body.az}"`
    }    
    if(req.body.filters){
        json_req += `,"filters": "${req.body.filters.split(",")}"`
    }    
    if(req.body.force){
        json_req += `,"force": true`
    }    
    json_req += `}`
    
    async function fetch_api(){
        const response = await fetch('http://127.0.0.1:5000/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: json_req,
        })
        .then(res => res.json())
        .then(json => console.log(json))
        // return response
    }
    
    fetch_api().then(response => {
        // console.log(response)
        res.redirect('/aws/result')
    })
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