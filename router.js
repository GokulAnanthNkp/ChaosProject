/**
 * line 29,32,37
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require("node-fetch");
const { exec } = require('child_process')
const { PythonShell } = require('python-shell')
const session = require('express-session')
const linereader = require('line-reader')

const router = express.Router()

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname , 'public', 'html', 'home.html'))
})

router.get('/aws/auth', (req, res) => {
    // lineReader.eachLine('/home/harshal1711/.aws/credentials', (line) => {
    //     console.log(line)
    //     if (!line.includes('[default]') {
    //         return false
    //     }
    // })
    res.render(path.join(__dirname , 'public', 'html', 'auth.ejs'))
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
        sess = req.session
        sess['user_history'] = []
        res.redirect('/aws/auth_success')
    }).catch((err) => {
        console.log(err)
        res.redirect('/aws/auth_success')
        window.alert("Error updating authentication details")
    });
})

router.get('/aws/auth_success', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'auth_success.ejs'))
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
    res.render(path.join(__dirname , 'public', 'html', 'ec2.ejs'), {
        user_history : sess['user_history']
    })
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
    if(req.body.module === 'restart_instances'){
        res.redirect('/aws/ec2_restart')
    }
    if(req.body.module === 'describe_instances'){
        res.redirect('/aws/ec2_describe')
    }
})

router.get('/aws/ec2_stop', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'ec2_stop.ejs'), {
        user_history : sess['user_history']
    })
})

router.post('/aws/ec2_stop', (req, res) => {
    json_req = `{"service": "ec2", "exp": "stop_instances"`
    json_req += `,"id": ${JSON.stringify(req.body.instance_ids.split(","))}`
    json_req += `,"az": "${req.body.az}"`
    json_req += `, "filters": [{`
    json_req += `"Name" : "${req.body.filter_name}"`
    json_req += `, "Values" : ${JSON.stringify(req.body.filter_value.split(","))}}]`
    if(req.body.force){
        json_req += `,"force": true`
    }
    else{
        json_req += `,"force": false`
    }
    json_req += `}`
    console.log(json_req)
    
    async function fetch_api(){
        const response = await fetch('http://127.0.0.1:5000/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: json_req,
        })
        .then(res => res.json())
        .then(json => {
            sess = req.session
            sess['json_type'] = 'stop'
            sess['json_response'] = json
            var today = new Date()
            sess['user_history'].push(JSON.parse('{ "type" : "Stop Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})

router.get('/aws/ec2_terminate', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'ec2_terminate.ejs'), {
        user_history : sess['user_history']
    })
})

router.post('/aws/ec2_terminate', (req, res) => {
    json_req = `{"service": "ec2", "exp": "terminate_instances"`
    json_req += `,"id": ${JSON.stringify(req.body.instance_ids.split(","))}`
    json_req += `,"az": "${req.body.az}"`
    json_req += `, "filters": [{`
    json_req += `"Name" : "${req.body.filter_name}"`
    json_req += `, "Values" : ${JSON.stringify(req.body.filter_value.split(","))}}]`
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
        .then(json => {
            console.log(json)
            sess = req.session
            sess['json_type'] = 'terminate'
            sess['json_response'] = json
            var today = new Date()
            sess['user_history'].push(JSON.parse('{ "type" : "Terminate Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})


router.get('/aws/ec2_start', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'ec2_start.ejs'), {
        user_history : sess['user_history']
    })
})

router.post('/aws/ec2_start', (req, res) => {
    json_req = `{"service": "ec2", "exp": "start_instances"`
    json_req += `,"id": ${JSON.stringify(req.body.instance_ids.split(","))}`
    json_req += `,"az": "${req.body.az}"`
    json_req += `, "filters": [{`
    json_req += `"Name" : "${req.body.filter_name}"`
    json_req += `, "Values" : ${JSON.stringify(req.body.filter_value.split(","))}}]`
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
        .then(json => {
            console.log(json)
            sess = req.session
            sess['json_type'] = 'start'
            sess['json_response'] = json
            var today = new Date()
            sess['user_history'].push(JSON.parse('{ "type" : "Start Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})


router.get('/aws/ec2_restart', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'ec2_restart.ejs'), {
        user_history : sess['user_history']
    })
})

router.post('/aws/ec2_restart', (req, res) => {
    json_req = `{"service": "ec2", "exp": "restart_instances"`
    json_req += `,"id": ${JSON.stringify(req.body.instance_ids.split(","))}`
    json_req += `,"az": "${req.body.az}"`
    json_req += `, "filters": [{`
    json_req += `"Name" : "${req.body.filter_name}"`
    json_req += `, "Values" : ${JSON.stringify(req.body.filter_value.split(","))}}]`
    json_req += `}`
    
    async function fetch_api(){
        const response = await fetch('http://127.0.0.1:5000/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: json_req,
        })
        .then(res => res.text())
        .then(json => {
            console.log(json)
            sess = req.session
            sess['json_type'] = 'restart'
            sess['json_response'] = json
            var today = new Date()
            sess['user_history'].push(JSON.parse('{ "type" : "Restart Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})

router.get('/aws/ec2_describe', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'ec2_describe.ejs'), {
        user_history : sess['user_history']
    })
})

router.post('/aws/ec2_describe', (req, res) => {
    json_req = `{"service": "ec2", "exp": "describe_instances"`
    json_req += `, "filters": [{`
    json_req += `"Name" : "${req.body.filter_name}"`
    json_req += `, "Values" : ${JSON.stringify(req.body.filter_value.split(","))}}]`
    json_req += `}`
    
    console.log(json_req)
    async function fetch_api(){
        const response = await fetch('http://127.0.0.1:5000/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: json_req,
        })
        .then(res => res.json())
        .then(json => {
            console.log(json)
            sess = req.session
            sess['json_type'] = 'describe'
            sess['json_response'] = json
            var today = new Date()
            sess['user_history'].push(JSON.parse('{ "type" : "Describe Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})

router.get('/aws/result', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'result.ejs'), {
        json_type : sess['json_type'],
        json_response: sess['json_response'],
        user_history : sess['user_history']
    })
})

module.exports = router