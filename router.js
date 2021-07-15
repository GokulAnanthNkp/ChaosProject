/**
    to run app on PC modify path on lines specified depending on your own desktop
    In app.py :     line 17 to be commented out as AWS_REGION environment variable may not be needed to be set
 *  In router.js :  lines 18, 19 need path to ~/.aws/credentials or ~/.aws/config
                    line 20 calls app.py on specific path and passes argument to set environment variable
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require("node-fetch");
const { exec } = require('child_process')
const { PythonShell } = require('python-shell')
const session = require('express-session')
const router = express.Router()
const AWS = require('aws-sdk')

const cred_file = '/home/harshal1711/.aws/credentials'
const config_file = '/home/harshal1711/.aws/config'
const python_file = '../../../../../../../../home/harshal1711/app.py'

AWS.config.update({region: 'us-east-2'})
var ec2 = new AWS.EC2({apiVersion: '2016-11-15'})

router.get('/', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'home.ejs'))
    sess = req.session
    sess['validation'] = false          // false: validation not yet done(needed) on next form
})

router.get('/aws', (req, res) => {
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'aws.ejs'))
})

router.get('/aws/metrics', (req, res) => {
    var params = {
        Filters: [{
            Name: 'instance-state-name',
            Values: ['running']
        }]
    }
    sess = req.session
    sess['json_resp'] = {}
    sess['req_instance_id'] = false
    console.log('hello')
    var fetch_instances = ec2.describeInstances(params, (err, data) => {
        if (err) {}
    }).promise()
    fetch_instances.then(res => {
        sess['json_resp'] = res
        console.log(sess['json_resp'])
    })
    .then(() => {
        res.render(path.join(__dirname , 'public', 'html', 'aws', 'metrics.ejs'), {
            json_resp : sess['json_resp'],
            req_instance_id : sess['req_instance_id']
        })
    })
    .catch(err => {
        console.log(err)
    })
})

router.post('/aws/metrics', (req, res) => {
    sess = req.session
    var instance_id = req.body.instance
    sess['instance_id'] = instance_id
    sess['req_instance_id'] = true
    res.render(path.join(__dirname , 'public', 'html', 'aws', 'metrics.ejs'), {
        json_resp : sess['json_resp'],
        instance_id : sess['instance_id'],
        req_instance_id : sess['req_instance_id']
    })
})

router.get('/aws/auth', (req, res) => {
    var data = fs.readFileSync(cred_file, {encoding:'utf8', flag:'r'}).split('\n')
    sess = req.session
    sess['user_cred'] = data
    if(!sess['validation']){
        sess['validate'] = [false, false, false]
    }
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
                fs.writeFile(cred_file, data1, (err)=>{
                    if(err) {
                        done = false
                    }
                })
                fs.writeFile(config_file, data2, (err)=>{
                    if(err) {
                        done = false
                    }
                })
                PythonShell.run(python_file, {args : [`${req.body.region}`]}, (err) => {
                    if (err) throw err;
                })
                sess['validation'] = false
            }
            else{
                if(req.body.access_key === ''){
                    sess['validate'][0] = true    // true : user has left field empty
                }else{
                    sess['validate'][0] = false
                }
                if(req.body.secret_access_key === ''){
                    sess['validate'][1] = true    // true : user has left field empty
                }else{
                    sess['validate'][1] = false
                }
                if(req.body.region === ''){
                    sess['validate'][2] = true    // true : user has left field empty
                }else{
                    sess['validate'][2] = false
                }
                sess['validation'] = true   // validation has been done redirection to same page
                res.redirect('/aws/auth')
            }
        }
        else{
            PythonShell.run(python_file, {args : [`${sess['user_cred'][3].split(" ")[2]}`]}, (err) => {
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
    sess = req.session
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
    var params = {
        Filters: [{
            Name: 'instance-state-name',
            Values: ['running', 'pending']
        }]
    }
    sess = req.session
    sess['json_resp'] = {}
    console.log('ec2_stop')
    var fetch_instances = ec2.describeInstances(params, (err, data) => {
        if (err) {}
    }).promise()
    fetch_instances.then(res => {
        sess['json_resp'] = res
    })
    .then(() => {
        res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2_stop.ejs'), {
            json_resp : sess['json_resp'],
            user_history : sess['user_history']
        })
    })
    .catch(err => {
        console.log(err)
    })
})

router.post('/aws/ec2_stop', (req, res) => {
    sess = req.session
    json_req = `{"service": "ec2", "exp": "stop_instances"`
    json_req += `,"id": `

    var selected = ""
    var selected_ids = []
    for(i in sess['json_resp'].Reservations){
        selected = sess['json_resp'].Reservations[i].Instances[0].InstanceId
        if(req.body[selected])
        {
            selected_ids.push(selected)
        }
    }
    json_req += `${JSON.stringify(selected_ids)}`

    json_req += `,"az": "${req.body.az}"`
    json_req += `, "filters": [{`
    if(req.body.az !== '' && req.body.filter_name === undefined){
        json_req += `"Name" : "availability-zone"`
        json_req += `, "Values" : [${JSON.stringify(req.body.az)}]}]`
    }else{
        json_req += `"Name" : "${(req.body.filter_name === undefined) ? "" : req.body.filter_name}"`
        json_req += `, "Values" : ${JSON.stringify(req.body.filter_value.split(","))}}]`
    }
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
        .then(res => res.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                sess['json_type'] = 'stop'
                sess['json_response'] = data
                sess['error_encountered'] = false
                var today = new Date()
                sess['user_history'].unshift(JSON.parse('{ "type" : "Stop Instance", "TimeCompleted" : "' + 
                today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
                +'", "status" : "Completed"}'))
            } catch(err) {
                sess['error_encountered'] = true
                sess['json_type'] = 'stop'
                sess['json_response'] = text
                var today = new Date()
                sess['user_history'].unshift(JSON.parse('{ "type" : "Stop Instance", "TimeCompleted" : "' + 
                today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
                +'", "status" : "Failed"}'))
            }
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})

router.get('/aws/ec2_terminate', (req, res) => {
    var params = {
        Filters: [{
            Name: 'instance-state-name',
            Values: ['running', 'stopped', 'stopping', 'pending']
        }]
    }
    sess = req.session
    sess['json_resp'] = {}
    var fetch_instances = ec2.describeInstances(params, (err, data) => {
        if (err) {}
    }).promise()
    fetch_instances.then(res => {
        sess['json_resp'] = res
    })
    .then(() => {
        res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2_terminate.ejs'), {
            json_resp : sess['json_resp'],
            user_history : sess['user_history']
        })
    })
    .catch(err => {
        console.log(err)
    })
})

router.post('/aws/ec2_terminate', (req, res) => {
    sess = req.session
    json_req = `{"service": "ec2", "exp": "terminate_instances"`
    json_req += `,"id": `

    var selected = ""
    var selected_ids = []
    for(i in sess['json_resp'].Reservations){
        selected = sess['json_resp'].Reservations[i].Instances[0].InstanceId
        if(req.body[selected])
        {
            selected_ids.push(selected)
        }
    }
    json_req += `${JSON.stringify(selected_ids)}`

    json_req += `,"az": "${req.body.az}"`
    json_req += `, "filters": [{`
    if(req.body.az !== '' && req.body.filter_name === undefined){
        json_req += `"Name" : "availability-zone"`
        json_req += `, "Values" : [${JSON.stringify(req.body.az)}]}]`
    }else{
        json_req += `"Name" : "${(req.body.filter_name === undefined) ? "" : req.body.filter_name}"`
        json_req += `, "Values" : ${JSON.stringify(req.body.filter_value.split(","))}}]`
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
        .then(res => res.text())
        .then(text => {
            sess = req.session
            try {
                const data = JSON.parse(text);
                sess['json_type'] = 'terminate'
                sess['json_response'] = data
                sess['error_encountered'] = false
                var today = new Date()
                sess['user_history'].unshift(JSON.parse('{ "type" : "Terminate Instance", "TimeCompleted" : "' + 
                today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
                +'", "status" : "Completed"}'))
            } catch(err) {
                sess['error_encountered'] = true
                sess['json_type'] = 'stop'
                sess['json_response'] = text
                var today = new Date()
                sess['user_history'].unshift(JSON.parse('{ "type" : "Terminate Instance", "TimeCompleted" : "' + 
                today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
                +'", "status" : "Failed"}'))
            }
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})


router.get('/aws/ec2_start', (req, res) => {
    var params = {
        Filters: [{
            Name: 'instance-state-name',
            Values: ['stopped', 'stopping']
        }]
    }
    sess = req.session
    sess['json_resp'] = {}
    var fetch_instances = ec2.describeInstances(params, (err, data) => {
        if (err) {}
    }).promise()
    fetch_instances.then(res => {
        sess['json_resp'] = res
    })
    .then(() => {
        res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2_start.ejs'), {
            json_resp : sess['json_resp'],
            user_history : sess['user_history']
        })
    })
    .catch(err => {
        console.log(err)
    })
})

router.post('/aws/ec2_start', (req, res) => {
    sess = req.session
    json_req = `{"service": "ec2", "exp": "start_instances"`
    json_req += `,"id": `

    var selected = ""
    var selected_ids = []
    for(i in sess['json_resp'].Reservations){
        selected = sess['json_resp'].Reservations[i].Instances[0].InstanceId
        if(req.body[selected])
        {
            selected_ids.push(selected)
        }
    }
    json_req += `${JSON.stringify(selected_ids)}`

    json_req += `,"az": "${req.body.az}"`
    json_req += `, "filters": [{`
    if(req.body.az !== '' && req.body.filter_name === undefined){
        json_req += `"Name" : "availability-zone"`
        json_req += `, "Values" : [${JSON.stringify(req.body.az)}]}]`
    }else{
        json_req += `"Name" : "${(req.body.filter_name === undefined) ? "" : req.body.filter_name}"`
        json_req += `, "Values" : ${JSON.stringify(req.body.filter_value.split(","))}}]`
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
        .then(res => res.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                sess['json_type'] = 'start'
                sess['json_response'] = data
                sess['error_encountered'] = false
                var today = new Date()
                sess['user_history'].unshift(JSON.parse('{ "type" : "Start Instance", "TimeCompleted" : "' + 
                today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
                +'", "status" : "Completed"}'))
            } catch(err) {
                sess['error_encountered'] = true
                sess['json_type'] = 'start'
                sess['json_response'] = text
                var today = new Date()
                sess['user_history'].unshift(JSON.parse('{ "type" : "Start Instance", "TimeCompleted" : "' + 
                today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
                +'", "status" : "Failed"}'))
            }
        })
    }
    
    fetch_api().then(response => {
        res.redirect('/aws/result')
    })
})


router.get('/aws/ec2_restart', (req, res) => {
    var params = {
        Filters: [{
            Name: 'instance-state-name',
            Values: ['running', 'pending']
        }]
    }
    sess = req.session
    sess['json_resp'] = {}
    console.log('ec2_stop')
    var fetch_instances = ec2.describeInstances(params, (err, data) => {
        if (err) {}
    }).promise()
    fetch_instances.then(res => {
        sess['json_resp'] = res
    })
    .then(() => {
        res.render(path.join(__dirname , 'public', 'html', 'aws', 'ec2_restart.ejs'), {
            json_resp : sess['json_resp'],
            user_history : sess['user_history']
        })
    })
    .catch(err => {
        console.log(err)
    })
})

router.post('/aws/ec2_restart', (req, res) => {
    sess = req.session
    json_req = `{"service": "ec2", "exp": "restart_instances"`
    json_req += `,"id":`
    
    var selected = ""
    var selected_ids = []
    for(i in sess['json_resp'].Reservations){
        selected = sess['json_resp'].Reservations[i].Instances[0].InstanceId
        if(req.body[selected])
        {
            selected_ids.push(selected)
        }
    }

    json_req += `${JSON.stringify(selected_ids)}`
    json_req += `,"az": "${req.body.az}"`
    json_req += `, "filters": [{`
    if(req.body.az !== '' && req.body.filter_name === undefined){
        json_req += `"Name" : "availability-zone"`
        json_req += `, "Values" : [${JSON.stringify(req.body.az)}]}]`
    }else{
        json_req += `"Name" : "${(req.body.filter_name === undefined) ? "" : req.body.filter_name}"`
        json_req += `, "Values" : ${JSON.stringify(req.body.filter_value.split(","))}}]`
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
        .then(res => res.text())
        .then(json => {
            console.log(json)
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
        .then(res => res.text())
        .then(text => {
            sess = req.session
            try {
                const data = JSON.parse(text);
                sess['json_type'] = 'describe'
                sess['json_response'] = data
                sess['error_encountered'] = false
                var today = new Date()
                sess['user_history'].unshift(JSON.parse('{ "type" : "Describe Instance", "TimeCompleted" : "' + 
                today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
                +'", "status" : "Completed"}'))
            } catch(err) {
                sess['error_encountered'] = true
                sess['json_type'] = 'describe'
                sess['json_response'] = text
                var today = new Date()
                sess['user_history'].unshift(JSON.parse('{ "type" : "Describe Instance", "TimeCompleted" : "' + 
                today.getHours().toString() + ':' + today.getMinutes().toString() + ':' + today.getSeconds().toString()
                +'", "status" : "Failed"}'))
            }
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
        user_history : sess['user_history'],
        error_encountered : sess['error_encountered']
    })
})

module.exports = router