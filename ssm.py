from flask import Flask, request,json
import chaosaws.ssm.actions

app = Flask(_name_)

@app.route('/', methods=['POST'])
def home1():
    result = "No option Found!!!"
    try:
        record = json.loads(request.data)
        if record["service"] == "ssm":
            if record["exp"]== "send_command":
                result = chaosaws.ssm.actions.send_command(record["document_name"],record["targets"],record["document_version"],record["parameters"],record["timeout_seconds"],record["max_concurrency"],record["max_error"])
        print (result)
    except Exception as e:
        print (e.args)
        result = str(e.args)
    return result

@app.errorhandler(404)
def page_not_found(e):
    return "<h1>404</h1><p>The resource could not be found.</p>", 404

app.run()