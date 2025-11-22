#!/usr/bin/env python3
"""Analyze git history statistics for the last 7 days"""

import subprocess
import re
from collections import defaultdict
from datetime import datetime

def run_git_command(cmd):
    """Run git command and return output"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout

def parse_git_log():
    """Parse git log with numstat"""
    cmd = 'git log --since="7 days ago" --numstat --pretty=format:"COMMIT:%H|%an|%ae|%ad|%s" --date=iso'
    output = run_git_command(cmd)

    commits = []
    current_commit = None

    for line in output.split('\n'):
        if line.startswith('COMMIT:'):
            if current_commit:
                commits.append(current_commit)

            parts = line.replace('COMMIT:', '').split('|')
            current_commit = {
                'hash': parts[0],
                'author': parts[1],
                'email': parts[2],
                'date': parts[3],
                'message': parts[4] if len(parts) > 4 else '',
                'files': []
            }
        elif line.strip() and current_commit and '\t' in line:
            # Parse numstat line: additions deletions filename
            parts = line.split('\t')
            if len(parts) >= 3:
                added = parts[0] if parts[0] != '-' else '0'
                deleted = parts[1] if parts[1] != '-' else '0'
                filename = parts[2]

                try:
                    current_commit['files'].append({
                        'added': int(added),
                        'deleted': int(deleted),
                        'filename': filename
                    })
                except ValueError:
                    # Binary file or parse error, skip
                    pass

    if current_commit:
        commits.append(current_commit)

    return commits

def analyze_commits(commits):
    """Analyze commits and generate statistics"""
    # Filter out merge commits (no file changes)
    non_merge_commits = [c for c in commits if c['files']]

    # Statistics
    total_commits = len(non_merge_commits)
    total_added = 0
    total_deleted = 0

    # By file type
    by_extension = defaultdict(lambda: {'added': 0, 'deleted': 0, 'files': 0})

    # By author
    by_author = defaultdict(lambda: {'commits': 0, 'added': 0, 'deleted': 0})

    # Major features
    features = []

    for commit in non_merge_commits:
        author = commit['author']
        by_author[author]['commits'] += 1

        for file_info in commit['files']:
            added = file_info['added']
            deleted = file_info['deleted']
            filename = file_info['filename']

            total_added += added
            total_deleted += deleted
            by_author[author]['added'] += added
            by_author[author]['deleted'] += deleted

            # Get file extension
            if '.' in filename:
                ext = filename.split('.')[-1]
            else:
                ext = 'no-extension'

            by_extension[ext]['added'] += added
            by_extension[ext]['deleted'] += deleted
            by_extension[ext]['files'] += 1

        # Track major features (commits with substantial changes)
        if len(commit['files']) > 0:
            total_lines = sum(f['added'] + f['deleted'] for f in commit['files'])
            if total_lines > 50 or any(keyword in commit['message'].lower()
                                      for keyword in ['add', 'implement', 'create', 'fix', 'feature']):
                features.append({
                    'message': commit['message'],
                    'author': author,
                    'date': commit['date'][:10],
                    'lines': total_lines
                })

    return {
        'total_commits': total_commits,
        'total_added': total_added,
        'total_deleted': total_deleted,
        'by_extension': dict(by_extension),
        'by_author': dict(by_author),
        'features': features
    }

def print_report(stats):
    """Print formatted analysis report"""
    print("=" * 80)
    print("GIT HISTORY ANALYSIS - LAST 7 DAYS")
    print("=" * 80)
    print()

    print(f"📊 OVERALL STATISTICS")
    print(f"   Total Commits (non-merge): {stats['total_commits']}")
    print(f"   Total Lines Added: {stats['total_added']:,}")
    print(f"   Total Lines Deleted: {stats['total_deleted']:,}")
    print(f"   Net Lines Changed: {stats['total_added'] - stats['total_deleted']:,}")
    print()

    print(f"👥 BY AUTHOR")
    for author, data in sorted(stats['by_author'].items(), key=lambda x: x[1]['commits'], reverse=True):
        print(f"   {author}:")
        print(f"      Commits: {data['commits']}")
        print(f"      Lines Added: {data['added']:,}")
        print(f"      Lines Deleted: {data['deleted']:,}")
        print(f"      Net: {data['added'] - data['deleted']:,}")
        print()

    print(f"📁 BY FILE TYPE")
    # Sort by total lines changed
    sorted_extensions = sorted(
        stats['by_extension'].items(),
        key=lambda x: x[1]['added'] + x[1]['deleted'],
        reverse=True
    )

    for ext, data in sorted_extensions[:15]:  # Top 15
        total = data['added'] + data['deleted']
        print(f"   .{ext:20s} | Files: {data['files']:3d} | +{data['added']:6,} -{data['deleted']:6,} | Total: {total:7,}")

    print()
    print(f"🚀 MAJOR FEATURES/CHANGES ({len(stats['features'])} significant commits)")
    print()

    # Sort by lines changed
    sorted_features = sorted(stats['features'], key=lambda x: x['lines'], reverse=True)

    for i, feature in enumerate(sorted_features[:20], 1):  # Top 20
        print(f"   {i}. [{feature['date']}] {feature['message'][:90]}")
        print(f"      Author: {feature['author']} | Lines Changed: {feature['lines']:,}")
        print()

def main():
    print("Analyzing git history...")
    commits = parse_git_log()
    stats = analyze_commits(commits)
    print_report(stats)

if __name__ == '__main__':
    main()
