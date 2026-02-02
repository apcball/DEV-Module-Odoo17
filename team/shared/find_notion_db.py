import os
import json
import urllib.request
import sys

API_KEY = sys.argv[1]
QUERY = "Project Dev"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

data = {
    "query": QUERY,
    "filter": {
        "value": "database",
        "property": "object"
    }
}

req = urllib.request.Request(
    "https://api.notion.com/v1/search",
    data=json.dumps(data).encode("utf-8"),
    headers=headers,
    method="POST"
)

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode("utf-8"))
        results = result.get("results", [])
        
        if not results:
            print("No database found.")
            sys.exit(1)
            
        for db in results:
            print(f"FOUND: {db['id']} ({db['title'][0]['plain_text'] if db['title'] else 'Untitled'})")
            # Create a shell script to export the ID for ease of use
            with open("notion_env.sh", "w") as f:
                f.write(f"export NOTION_DB_ID={db['id']}\n")
                f.write(f"export NOTION_API_KEY={API_KEY}\n")
            break
            
except urllib.error.HTTPError as e:
    print(f"Error: {e.code} - {e.read().decode('utf-8')}")
    sys.exit(1)
