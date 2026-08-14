import base64
import json
import os
import subprocess
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OWNER = "ermiasnega"
REPO = "TaskFlow-Pro"
API = f"https://api.github.com/repos/{OWNER}/{REPO}"
token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
if not token:
    raise SystemExit("GH_TOKEN is required")

session = requests.Session()
session.headers.update({"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"})

def api(method, url, **kwargs):
    response = session.request(method, url, timeout=30, **kwargs)
    if response.status_code >= 300:
        raise RuntimeError(f"GitHub API {method} {url} -> {response.status_code}: {response.text[:500]}")
    return response.json() if response.content else {}

def git_files():
    result = subprocess.run(["git", "ls-files", "-s", "-z"], cwd=ROOT, check=True, capture_output=True)
    entries = []
    for raw in result.stdout.split(b"\0"):
        if not raw:
            continue
        metadata, path_bytes = raw.split(b"\t", 1)
        mode, _index, _stage = metadata.decode().split()
        entries.append((mode, path_bytes.decode("utf-8")))
    return entries

ref = api("GET", f"{API}/git/ref/heads/main")
remote_sha = ref["object"]["sha"]
remote_commit = api("GET", f"{API}/git/commits/{remote_sha}")
base_tree = remote_commit["tree"]["sha"]
entries = []
for mode, path in git_files():
    content = (ROOT / path).read_bytes()
    blob = api("POST", f"{API}/git/blobs", json={"content": base64.b64encode(content).decode("ascii"), "encoding": "base64"})
    entries.append({"path": path, "mode": mode, "type": "blob", "sha": blob["sha"]})

tree = api("POST", f"{API}/git/trees", json={"base_tree": base_tree, "tree": entries})
commit = api("POST", f"{API}/git/commits", json={"message": "Sync TaskFlow Iteration 3 dashboard and task management", "tree": tree["sha"], "parents": [remote_sha]})
api("PATCH", f"{API}/git/refs/heads/main", json={"sha": commit["sha"], "force": False})
print(json.dumps({"remote_before": remote_sha, "remote_after": commit["sha"], "files": len(entries), "url": f"https://github.com/{OWNER}/{REPO}/commit/{commit['sha']}"}))
