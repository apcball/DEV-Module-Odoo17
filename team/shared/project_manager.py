#!/usr/bin/env python3
"""
Project Manager - Auto-create project folders and assign teams
Run: python3 project_manager.py create "Project Name" "Description"
"""

import os
import sys
import json
import shutil
from datetime import datetime
from pathlib import Path

# Project base path
WORKSPACE = Path("/home/admin/.openclaw/workspace")
PROJECTS_DIR = WORKSPACE / "projects"
TEAM_DIR = WORKSPACE / "team"

# Team members with their folders
TEAM_MEMBERS = {
    "oracle": {
        "name": "Oracle",
        "role": "System Analyst",
        "folder": "system-analyst",
        "tasks": ["analysis", "specification", "workflow"]
    },
    "meow": {
        "name": "Meow", 
        "role": "UI/UX Designer",
        "folder": "design",
        "tasks": ["design", "wireframe", "mockup"]
    },
    "suga": {
        "name": "Suga",
        "role": "Backend Developer", 
        "folder": "backend",
        "tasks": ["api", "database", "server"]
    },
    "natjang": {
        "name": "Natjang",
        "role": "Frontend Developer",
        "folder": "frontend", 
        "tasks": ["ui", "dashboard", "webapp"]
    },
    "nova": {
        "name": "Nova",
        "role": "Mobile Developer",
        "folder": "mobile",
        "tasks": ["ios", "android", "mobile-app"]
    },
    "krapuk": {
        "name": "Krapuk",
        "role": "QA Engineer",
        "folder": "qa",
        "tasks": ["testing", "review", "quality-check"]
    }
}

def slugify(text):
    """Convert text to slug format"""
    return text.lower().replace(" ", "-").replace("_", "-").replace("/", "-")

def create_project_structure(project_name, description=""):
    """Create new project folder structure"""
    
    project_slug = slugify(project_name)
    project_path = PROJECTS_DIR / project_slug
    
    # Check if project already exists
    if project_path.exists():
        print(f"❌ Project '{project_name}' already exists!")
        return None
    
    print(f"🚀 Creating project: {project_name}")
    print(f"📁 Path: {project_path}")
    
    # Create main project folder
    project_path.mkdir(parents=True, exist_ok=True)
    
    # Create subdirectories for each team member
    folders = {
        "00-specs": "System Analysis & Specifications",
        "01-design": "UI/UX Design & Wireframes",
        "02-backend": "Backend API & Database",
        "03-frontend": "Frontend Dashboard",
        "04-mobile": "Mobile Applications",
        "05-qa": "Testing & QA Reports",
        "06-deploy": "Deployment & DevOps",
        "docs": "Documentation",
        "assets": "Images, logos, assets",
        "meetings": "Meeting notes"
    }
    
    for folder, desc in folders.items():
        folder_path = project_path / folder
        folder_path.mkdir(exist_ok=True)
        
        # Create README for each folder
        readme_content = f"""# {desc}

**Project**: {project_name}
**Folder**: {folder}

## Contents

This folder contains {desc.lower()} for the project.

---
*Created: {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        (folder_path / "README.md").write_text(readme_content)
    
    # Create main project README
    main_readme = f"""# {project_name}

## 📋 Overview
{description or 'No description provided.'}

## 🎯 Project Status
- **Status**: 🟡 In Progress
- **Created**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- **Last Updated**: {datetime.now().strftime('%Y-%m-%d %H:%M')}

## 👥 Team Assignment

| Member | Role | Folder | Status |
|--------|------|--------|--------|
| 🔮 Oracle | System Analyst | `01-specs/` | ⏳ Pending |
| 🖌️ Meow | UI/UX Designer | `01-design/` | ⏳ Pending |
| 🤖 Suga | Backend Dev | `03-backend/` | ⏳ Pending |
| 🎨 Natjang | Frontend Dev | `04-frontend/` | ⏳ Pending |
| 📱 Nova | Mobile Dev | `05-mobile/` | ⏳ Pending |
| 🔍 Krapuk | QA Engineer | `06-qa/` | ⏳ Pending |

## 📁 Folder Structure

```
{project_slug}/
├── 00-specs/          # System Analysis (Oracle)
├── 01-design/         # UI/UX Design (Meow)
├── 02-backend/        # Backend API (Suga)
├── 03-frontend/       # Frontend (Natjang)
├── 04-mobile/         # Mobile Apps (Nova)
├── 05-qa/             # QA & Testing (Krapuk)
├── 06-deploy/         # Deployment
├── docs/              # Documentation
├── assets/            # Images & Assets
└── meetings/          # Meeting Notes
```

## 🔄 Workflow

1. **Phase 1**: Oracle analyzes requirements → `00-specs/`
2. **Phase 2**: Meow designs UI → `01-design/`
3. **Phase 3**: Suga builds backend → `02-backend/`
4. **Phase 4**: Natjang develops frontend → `03-frontend/`
5. **Phase 5**: Nova creates mobile app → `04-mobile/` (if needed)
6. **Phase 6**: Krapuk tests → `05-qa/`
7. **Phase 7**: Deploy → `06-deploy/`

## 📝 Notes

*Add project notes here...*

---
**Managed by**: The Squad 🤖
"""
    
    (project_path / "README.md").write_text(main_readme)
    
    # Create project config file
    config = {
        "name": project_name,
        "slug": project_slug,
        "description": description,
        "created_at": datetime.now().isoformat(),
        "status": "in-progress",
        "team": {member: "pending" for member in TEAM_MEMBERS.keys()}
    }
    
    with open(project_path / ".project.json", "w") as f:
        json.dump(config, f, indent=2)
    
    # Create kanban task
    create_kanban_task(project_name)
    
    print(f"✅ Project '{project_name}' created successfully!")
    print(f"📂 Location: {project_path}")
    
    return project_path

def create_kanban_task(project_name):
    """Add project to kanban"""
    kanban_script = TEAM_DIR / "shared" / "manage_kanban.py"
    
    if kanban_script.exists():
        import subprocess
        result = subprocess.run(
            ["python3", str(kanban_script), "add", f"สร้างโปรเจกต์: {project_name}", "Oracle"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"📋 Added to Kanban: {project_name}")

def assign_team_member(project_slug, member_key, status="in-progress"):
    """Assign team member to project"""
    
    project_path = PROJECTS_DIR / project_slug
    config_file = project_path / ".project.json"
    
    if not config_file.exists():
        print(f"❌ Project '{project_slug}' not found!")
        return False
    
    with open(config_file, "r") as f:
        config = json.load(f)
    
    if member_key not in TEAM_MEMBERS:
        print(f"❌ Team member '{member_key}' not found!")
        return False
    
    member = TEAM_MEMBERS[member_key]
    config["team"][member_key] = status
    
    with open(config_file, "w") as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Assigned {member['name']} ({member['role']}) to {project_slug}")
    return True

def list_projects():
    """List all projects"""
    print("📂 Active Projects:\n")
    
    if not PROJECTS_DIR.exists():
        print("No projects found.")
        return
    
    for project_dir in sorted(PROJECTS_DIR.iterdir()):
        if project_dir.is_dir():
            config_file = project_dir / ".project.json"
            if config_file.exists():
                with open(config_file) as f:
                    config = json.load(f)
                status_emoji = "🟢" if config.get("status") == "done" else "🟡"
                print(f"{status_emoji} {config['name']} ({project_dir.name})")
            else:
                print(f"⚪ {project_dir.name}")

def show_project_status(project_slug):
    """Show project status"""
    project_path = PROJECTS_DIR / project_slug
    config_file = project_path / ".project.json"
    
    if not config_file.exists():
        print(f"❌ Project '{project_slug}' not found!")
        return
    
    with open(config_file) as f:
        config = json.load(f)
    
    print(f"\n📊 Project: {config['name']}")
    print(f"Status: {config.get('status', 'unknown')}")
    print(f"\n👥 Team Status:")
    
    for member_key, status in config.get("team", {}).items():
        member = TEAM_MEMBERS.get(member_key, {})
        emoji = "✅" if status == "done" else "🟡" if status == "in-progress" else "⏳"
        print(f"  {emoji} {member.get('name', member_key)}: {status}")

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("""
🤖 Project Manager - Usage:

  python3 project_manager.py create "Project Name" ["Description"]
    → Create new project folder

  python3 project_manager.py list
    → List all projects

  python3 project_manager.py status <project-slug>
    → Show project status

  python3 project_manager.py assign <project-slug> <member>
    → Assign team member (oracle, meow, suga, natjang, nova, krapuk)

Examples:
  python3 project_manager.py create "E-commerce Website" "Online store"
  python3 project_manager.py assign my-project suga
        """)
        return
    
    command = sys.argv[1]
    
    if command == "create":
        if len(sys.argv) < 3:
            print("❌ Please provide project name!")
            return
        
        project_name = sys.argv[2]
        description = sys.argv[3] if len(sys.argv) > 3 else ""
        create_project_structure(project_name, description)
    
    elif command == "list":
        list_projects()
    
    elif command == "status":
        if len(sys.argv) < 3:
            print("❌ Please provide project slug!")
            return
        show_project_status(sys.argv[2])
    
    elif command == "assign":
        if len(sys.argv) < 4:
            print("❌ Please provide project slug and member!")
            return
        assign_team_member(sys.argv[2], sys.argv[3])
    
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    main()
