import urllib.request
import json

req = urllib.request.Request(
    'http://127.0.0.1:8003/chat/ward',
    data=json.dumps({"message": "Show me all the complaints assigned to my ward", "user_id": "1"}).encode('utf8'),
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    with open("err.txt", "w") as f:
        f.write(response.read().decode())
except urllib.error.HTTPError as e:
    with open("err.txt", "w") as f:
        f.write(e.read().decode())
except Exception as e:
    with open("err.txt", "w") as f:
        f.write(str(e))
