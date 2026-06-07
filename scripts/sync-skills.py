#!/usr/bin/env python3
import os
import re
import json
import shutil
import argparse

# Root of the repository is the parent of the scripts directory
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILLS_DIR = os.path.join(REPO_ROOT, "skills")

def process_conditionals(content: str, model_name: str) -> str:
    lines = content.splitlines()
    output_lines = []
    stack = []
    
    if_re = re.compile(r'<!--\s*if\s+model="([^"]+)"\s*-->')
    endif_re = re.compile(r'<!--\s*endif\s*-->')
    
    for line in lines:
        if_match = if_re.search(line)
        if if_match:
            target_models = [m.strip() for m in if_match.group(1).split(',')]
            is_active = (stack[-1] if stack else True) and (model_name in target_models)
            stack.append(is_active)
            continue
            
        if endif_re.search(line):
            if stack:
                stack.pop()
            continue
            
        should_write = stack[-1] if stack else True
        if should_write:
            output_lines.append(line)
            
    return '\n'.join(output_lines)

def format_yaml(data: dict) -> str:
    if not data:
        return ""
    lines = []
    for k, v in data.items():
        if isinstance(v, bool):
            lines.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, list):
            lines.append(f"{k}: {', '.join(str(item) for item in v)}")
        else:
            lines.append(f"{k}: {v}")
    return "---\n" + "\n".join(lines) + "\n---\n"

def copy_other_files(src_dir: str, dest_dir: str, dry_run: bool = False):
    for root, dirs, files in os.walk(src_dir):
        rel_path = os.path.relpath(root, src_dir)
        target_root = dest_dir if rel_path == "." else os.path.join(dest_dir, rel_path)
            
        for d in dirs:
            target_dir = os.path.join(target_root, d)
            if dry_run:
                target_dir_rel = os.path.relpath(target_dir, REPO_ROOT)
                if not os.path.exists(target_dir):
                    print(f"  [Dry Run] Would create directory {target_dir_rel}")
            else:
                os.makedirs(target_dir, exist_ok=True)
            
        for f in files:
            if f in ("config.json", "skill.md", ".DS_Store"):
                continue
            src_file = os.path.join(root, f)
            dest_file = os.path.join(target_root, f)
            dest_file_rel = os.path.relpath(dest_file, REPO_ROOT)
            
            needs_copy = True
            if os.path.exists(dest_file):
                with open(src_file, 'rb') as sf, open(dest_file, 'rb') as df:
                    needs_copy = (sf.read() != df.read())
                    
            if dry_run:
                if not os.path.exists(dest_file):
                    print(f"  [Dry Run] Would copy {os.path.relpath(src_file, REPO_ROOT)} -> {dest_file_rel}")
                elif needs_copy:
                    print(f"  [Dry Run] Would overwrite {dest_file_rel}")
            else:
                if not os.path.exists(dest_file):
                    print(f"  -> Copying {os.path.relpath(src_file, REPO_ROOT)} -> {dest_file_rel}")
                elif needs_copy:
                    print(f"  -> Updating {dest_file_rel}")
                os.makedirs(os.path.dirname(dest_file), exist_ok=True)
                shutil.copy2(src_file, dest_file)

def main():
    parser = argparse.ArgumentParser(description="Synchronize and compile agent skills.")
    parser.add_argument(
        "--dry-run", "-d",
        action="store_true",
        help="Perform a dry run without modifying files on disk."
    )
    args = parser.parse_args()

    if not os.path.exists(SKILLS_DIR):
        print(f"Skills directory not found at {SKILLS_DIR}")
        return

    action_prefix = "[Dry Run] " if args.dry_run else ""
    print(f"{action_prefix}Syncing agent skills...")
    
    # List all skills
    for skill_name in sorted(os.listdir(SKILLS_DIR)):
        skill_path = os.path.join(SKILLS_DIR, skill_name)
        if not os.path.isdir(skill_path):
            continue
            
        config_path = os.path.join(skill_path, "config.json")
        template_path = os.path.join(skill_path, "skill.md")
        
        if not os.path.exists(config_path) or not os.path.exists(template_path):
            print(f"Skipping {skill_name}: missing config.json or skill.md")
            continue
            
        # Parse configuration
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        # Read template
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
            
        targets = config.get("targets", {})
        print(f"{action_prefix}Processing skill '{skill_name}' with targets: {list(targets.keys())}")
        
        for model_name, target_info in targets.items():
            dest_rel = target_info.get("dest")
            if not dest_rel:
                print(f"  Warning: No dest specified for {model_name} in {skill_name}")
                continue
                
            dest_path = os.path.join(REPO_ROOT, dest_rel)
            
            # Generate frontmatter
            frontmatter_data = target_info.get("frontmatter", {})
            frontmatter_str = format_yaml(frontmatter_data)
            
            # Filter conditionals
            compiled_body = process_conditionals(template_content, model_name)
            
            # Write compiled skill file
            final_content = frontmatter_str + compiled_body
            if not final_content.endswith('\n'):
                final_content += '\n'
                
            file_exists = os.path.exists(dest_path)
            content_changed = True
            if file_exists:
                with open(dest_path, 'r', encoding='utf-8') as f:
                    current_content = f.read()
                content_changed = (current_content != final_content)
                
            if args.dry_run:
                if not file_exists:
                    print(f"  [Dry Run] Would create {dest_rel}")
                elif content_changed:
                    print(f"  [Dry Run] Would update {dest_rel}")
                else:
                    print(f"  [Dry Run] No changes for {dest_rel}")
            else:
                if not file_exists:
                    print(f"  -> Creating {dest_rel}")
                elif content_changed:
                    print(f"  -> Updating {dest_rel}")
                else:
                    print(f"  -> No changes for {dest_rel}")
                    
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                with open(dest_path, 'w', encoding='utf-8') as f:
                    f.write(final_content)
            
            dest_dir = os.path.dirname(dest_path)
            copy_other_files(skill_path, dest_dir, dry_run=args.dry_run)
            
    print(f"{action_prefix}Skills synchronization complete.")

if __name__ == "__main__":
    main()

