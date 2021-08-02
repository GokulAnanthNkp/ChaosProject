from flask import Flask, request, json
import random
import json
import chaosaws.ec2.actions
import chaosaws.ssm.actions
import chaosaws.ec2.probes
import sys, os,subprocess,time

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
        if record["service"] == "ssm":
            if record["exp"]== "send_command":
                result = chaosaws.ssm.actions.send_command(record["document_name"],record["targets"],record["document_version"],record["parameters"],record["timeout_seconds"],record["max_concurrency"],record["max_error"])
            print (result)
        if record["service"] == "litmus":
            if record["exp"]== "ec2_terminate":
                result = subprocess.run(['minikube','start'])
                time.sleep(2)
                result += subprocess.run(['minikube','status'])
                result += subprocess.run(['kubectl', 'apply', '-f','https://litmuschaos.github.io/litmus/litmus-operator-v1.13.8.yaml'])
                result += subprocess.run(['kubectl', 'apply', '-f','https://hub.litmuschaos.io/api/chaos/1.13.8?file=charts/kube-aws/ec2-terminate-by-id/experiment.yaml'])
                result += subprocess.run(['kubectl', 'apply', '-f','secrets.yml'])
                result += subprocess.run(['kubectl', 'apply', '-f','rbac.yml'])
                result += subprocess.run(['kubectl', 'apply', '-f','engine.yml'])
                time.sleep(100)
                result += subprocess.run(['minikube','stop'])
            print (result)
    except Exception as e:
        print (e.args)
        result = str(e.args)
    return result

@app.errorhandler(404)
def page_not_found(e):
    return "<h1>404</h1><p>The resource could not be found.</p>", 404

app.run()