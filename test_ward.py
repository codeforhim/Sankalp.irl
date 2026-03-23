import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'http://127.0.0.1:8003/chat/ward',
    data=json.dumps({"message": "Show me all the complaints assigned to my ward", "user_id": "1", "context": {"ward_id": "23"}}).encode('utf8'),
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
