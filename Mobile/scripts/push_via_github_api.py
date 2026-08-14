import base64
import json
import os
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen

owner = 'ermiasnega'
repo = 'TaskFlow-Pro'
api = f'https://api.github.com/repos/{owner}/{repo}'
token = os.environ.get('GH_TOKEN') or subprocess.check_output(['gh', 'auth', 'token'], text=True).strip()
headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28'}
root = Path('/home/ubuntu/taskflow')

def call(method, url, payload=None):
    body = None if payload is None else json.dumps(payload).encode()
    req = Request(url, data=body, headers=headers, method=method)
    with urlopen(req) as response:
        return json.load(response)

ref = call('GET', f'{api}/git/ref/heads/main')
parent = ref['object']['sha']
commit = call('GET', f'{api}/git/commits/{parent}')
base_tree = commit['tree']['sha']
entries = []
for path in subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0'):
    if not path:
        continue
    content = (root / path).read_bytes()
    blob = call('POST', f'{api}/git/blobs', {'content': base64.b64encode(content).decode(), 'encoding': 'base64'})
    entries.append({'path': path, 'mode': '100644', 'type': 'blob', 'sha': blob['sha']})

tree = call('POST', f'{api}/git/trees', {'base_tree': base_tree, 'tree': entries})
new_commit = call('POST', f'{api}/git/commits', {'message': 'Implement TaskFlow Iteration 2 authentication and three-folder structure', 'tree': tree['sha'], 'parents': [parent]})
updated = call('PATCH', f'{api}/git/refs/heads/main', {'sha': new_commit['sha'], 'force': False})
print(json.dumps({'commit': new_commit['sha'], 'ref': updated['ref'], 'files': len(entries), 'url': f'https://github.com/{owner}/{repo}/commit/{new_commit["sha"]}'}, indent=2))
