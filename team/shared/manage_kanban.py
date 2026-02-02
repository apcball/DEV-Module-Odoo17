import sys
import json
import urllib.request
import os

# CONFIG
API_KEY = "ntn_i71942652991zWvG63Md0lZd6xoUDWGGprQ2k1aiGfl5UX"
DATABASE_ID = "2fa1accf-c6d3-80b9-8ddb-ccb6a2e85270"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def request(endpoint, method="GET", data=None):
    url = f"https://api.notion.com/v1/{endpoint}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"Error: {e.read().decode('utf-8')}")
        sys.exit(1)

def list_tasks():
    # Query database
    data = {"sorts": [{"timestamp": "created_time", "direction": "descending"}]}
    res = request(f"databases/{DATABASE_ID}/query", "POST", data)
    
    print(f"{'ID':<38} | {'STATUS':<12} | {'ASSIGNEE':<10} | TITLE")
    print("-" * 80)
    for page in res.get("results", []):
        props = page["properties"]
        
        # Extract Title
        title_list = props.get("ชื่อโครงการ", {}).get("title", [])
        title = title_list[0]["plain_text"] if title_list else "(No Title)"
        
        # Extract Status
        status = props.get("Status", {}).get("status", {}).get("name", "Unknown")
        
        # Extract Assignee (assuming it's a select or text, let's try generic)
        assignee = "None"
        if "Assignee" in props:
            ap = props["Assignee"]
            if ap["type"] == "select" and ap["select"]:
                assignee = ap["select"]["name"]
            elif ap["type"] == "rich_text" and ap["rich_text"]:
                assignee = ap["rich_text"][0]["plain_text"]
            elif ap["type"] == "people" and ap["people"]:
                assignee = ap["people"][0].get("name", "Unknown")

        print(f"{page['id']} | {status:<12} | {assignee:<10} | {title}")

def add_task(title, assignee=""):
    data = {
        "parent": {"database_id": DATABASE_ID},
        "properties": {
            "ชื่อโครงการ": {"title": [{"text": {"content": title}}]},
            "Status": {"status": {"name": "Inbox"}}
        }
    }
    if assignee:
        data["properties"]["Assignee"] = {"select": {"name": assignee}}
    
    res = request("pages", "POST", data)
    print(f"Created Task: {res['id']}")

def update_assignee(page_id, new_assignee):
    data = {
        "properties": {
            "Assignee": {"select": {"name": new_assignee}}
        }
    }
    request(f"pages/{page_id}", "PATCH", data)
    print(f"Assigned Task {page_id} to {new_assignee}")

def update_status(page_id, new_status):
    data = {
        "properties": {
            "Status": {"status": {"name": new_status}}
        }
    }
    request(f"pages/{page_id}", "PATCH", data)
    print(f"Updated Task {page_id} status to {new_status}")

def add_comment(page_id, text):
    data = {
        "parent": {"page_id": page_id},
        "rich_text": [{"text": {"content": text}}]
    }
    request("comments", "POST", data)
    print(f"Added comment to Task {page_id}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python manage_kanban.py [list|add|move|assign|comment] ...")
        sys.exit(1)
        
    cmd = sys.argv[1]
    
    if cmd == "list":
        list_tasks()
    elif cmd == "add":
        if len(sys.argv) < 3:
            print("Usage: python manage_kanban.py add <title> [assignee]")
            sys.exit(1)
        title = sys.argv[2]
        assignee = sys.argv[3] if len(sys.argv) > 3 else ""
        add_task(title, assignee)
    elif cmd == "move":
        if len(sys.argv) < 4:
            print("Usage: python manage_kanban.py move <page_id> <new_status>")
            sys.exit(1)
        update_status(sys.argv[2], sys.argv[3])
    elif cmd == "assign":
        if len(sys.argv) < 4:
            print("Usage: python manage_kanban.py assign <page_id> <new_assignee>")
            sys.exit(1)
        update_assignee(sys.argv[2], sys.argv[3])
    elif cmd == "comment":
        if len(sys.argv) < 4:
            print("Usage: python manage_kanban.py comment <page_id> <text>")
            sys.exit(1)
        add_comment(sys.argv[2], sys.argv[3])
    else:
        print("Unknown command")
