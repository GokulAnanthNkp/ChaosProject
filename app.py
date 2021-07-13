from flask import Flask, request, json
import random
import json
import chaosaws.ec2.actions
import chaosaws.ec2.probes
import sys, os
 
app = Flask(__name__)
 
@app.route('/', methods=['GET'])
def hello():
    stri = "<h1>he" + str(random.random()) + "</h1>"
    return stri

@app.route('/', methods=['POST'])
def home1():
    os.environ["AWS_REGION"] = str(sys.argv[1])
    result = ""
    try:
        record = json.loads(request.data)
        if record["service"] == "ec2":
            if record["exp"]== "stop_instances":
                result = (chaosaws.ec2.actions.stop_instances(record["id"],record["az"],record["filters"],record["force"]))[0]
            elif record["exp"]== "start_instances":
                result = json.dumps((chaosaws.ec2.actions.start_instances(record["id"],record["az"],record["filters"])))
            elif record["exp"]== "restart_instances":
                l = (chaosaws.ec2.actions.restart_instances(record["id"],record["az"],record["filters"]))
                result = "Instance(s) restarted successfully"
            elif record["exp"]== "terminate_instances":
                result = (chaosaws.ec2.actions.terminate_instances(record["id"],record["az"],record["filters"]))[0]
            elif record["exp"]== "describe_instances":
                result = (chaosaws.ec2.probes.describe_instances(record["filters"]))
            print (result)
    except Exception as e:
        print (e.args)
        result = str(e.args)
    return result
 
@app.errorhandler(404)
def page_not_found(e):
    return "<h1>404</h1><p>The resource could not be found.</p>", 404
 
app.run()