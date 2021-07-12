/**
    to run app on PC modify path on lines specified depending on your own desktop
 * line 21,42,47,52,72
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require("node-fetch");
const { exec } = require('child_process')
const { PythonShell } = require('python-shell')
const session = require('express-session')
const router = express.Router()

router.get('/', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'home.ejs'))
    sess = req.session
    sess['validation'] = false          // false: validation not yet done(needed) on next form
})

router.get('/aws', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'aws.ejs'))
})

router.get('/aws/metrics', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'metrics.ejs'))
})

router.get('/aws/auth', (req, res) => {
    var data = fs.readFileSync('/home/harshal1711/.aws/credentials', {encoding:'utf8', flag:'r'}).split('\n')
    sess = req.session
    sess['user_cred'] = data
    if(!sess['validation']){
        sess['validate'] = [false, false, false]
    }
    console.log(sess['validate'])
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'auth.ejs'), {
        cred : sess['user_cred'],
        validate : sess['validate']
    })
})

router.post('/aws/auth', (req, res) => {
    sess = req.session
    var authenticate = new Promise((resolve, reject) => {
        done = true
        if(!req.body.prev_creds){
            if(req.body.access_key !== '' && req.body.secret_access_key !== '' && req.body.region !== ''){
                data1 = `[default]\naws_access_key_id = ${req.body.access_key}\naws_secret_access_key = ${req.body.secret_access_key}\nregion = ${req.body.region}`
                data2 = `[default]\nregion = ${req.body.region}`
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
                PythonShell.run('../../../../../../../../home/harshal1711/app.py', {args : [`${req.body.region}`]}, (err) => {
                    if (err) throw err;
                })
                sess['validation'] = false
            }
            else{
                if(req.body.access_key === ''){
                    sess['validate'][0] = true    // true : user has left field empty
                }
                if(req.body.secret_access_key === ''){
                    sess['validate'][1] = true    // true : user has left field empty
                }
                if(req.body.region === ''){
                    sess['validate'][2] = true    // true : user has left field empty
                }
                sess['validation'] = true   // validation has been done redirection to same page
                res.redirect('/aws/auth')
            }
        }
        else{
            PythonShell.run('../../../../../../../../home/harshal1711/app.py', {args : [`${sess['user_cred'][3].split(" ")[2]}`]}, (err) => {
                if (err) throw err;
            })
            sess['validation'] = false
        }
        if (done) {
            resolve();
        }
    });
    
    authenticate.then(function () {
        sess['user_history'] = []
        if(!sess['validation']){
            res.redirect('/aws/auth_success')
        }
    })
})

router.get('/aws/auth_success', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'auth_success.ejs'))
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
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2.ejs'), {
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
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2_stop.ejs'), {
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
            sess['user_history'].unshift(JSON.parse('{ "type" : "Stop Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})

router.get('/aws/ec2_terminate', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2_terminate.ejs'), {
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
            sess['user_history'].unshift(JSON.parse('{ "type" : "Terminate Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})


router.get('/aws/ec2_start', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2_start.ejs'), {
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
            sess['user_history'].unshift(JSON.parse('{ "type" : "Start Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})


router.get('/aws/ec2_restart', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2_restart.ejs'), {
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
            sess['user_history'].unshift(JSON.parse('{ "type" : "Restart Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})

router.get('/aws/ec2_describe', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2_describe.ejs'), {
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
            sess['user_history'].unshift(JSON.parse('{ "type" : "Describe Instance", "TimeCompleted" : "' + 
            today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
            +'", "status" : "Completed"}'))
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})

router.get('/aws/result', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'result.ejs'), {
        json_type : sess['json_type'],
        json_response: sess['json_response'],
        user_history : sess['user_history']
    })
})

module.exports = router