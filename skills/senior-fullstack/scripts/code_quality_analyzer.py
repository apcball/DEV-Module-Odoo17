#!/usr/bin/env python3
"""
Code Quality Analyzer - Enhanced for Fullstack Projects
Automated tool for checking Frontend-Backend consistency
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple

class CodeQualityAnalyzer:
    """Main class for code quality analyzer functionality"""
    
    def __init__(self, target_path: str, verbose: bool = False):
        self.target_path = Path(target_path)
        self.verbose = verbose
        self.results = {
            'status': 'success',
            'target': str(self.target_path),
            'findings': [],
            'warnings': [],
            'errors': []
        }
    
    def run(self) -> Dict:
        """Execute the main functionality"""
        print(f"🚀 Running {self.__class__.__name__}...")
        print(f"📁 Target: {self.target_path}")
        
        try:
            self.validate_target()
            self.analyze()
            self.generate_report()
            
            return self.results
            
        except Exception as e:
            print(f"❌ Error: {e}")
            self.results['status'] = 'error'
            self.results['errors'].append(str(e))
            return self.results
    
    def validate_target(self):
        """Validate the target path exists and is accessible"""
        if not self.target_path.exists():
            raise ValueError(f"Target path does not exist: {self.target_path}")
        
        if self.verbose:
            print(f"✓ Target validated: {self.target_path}")
    
    def analyze(self):
        """Perform the main analysis"""
        if self.verbose:
            print("📊 Analyzing...")
        
        # Detect project structure
        self.detect_project_structure()
        
        # Check type consistency if both frontend and backend exist
        if self.has_frontend and self.has_backend:
            self.check_type_consistency()
            self.check_api_consistency()
        
        # Check common issues
        self.check_common_issues()
        
        if self.verbose:
            print(f"✓ Analysis complete")
    
    def detect_project_structure(self):
        """Detect if project has frontend/backend structure"""
        self.has_frontend = False
        self.has_backend = False
        self.frontend_path = None
        self.backend_path = None
        
        # Check for common frontend indicators
        frontend_indicators = ['package.json', 'next.config.', 'vite.config.', 'src/App.', 'app/page.']
        backend_indicators = ['package.json', 'server.', 'app.ts', 'index.ts', 'routes/', 'models/']
        
        for item in self.target_path.rglob('*'):
            if item.is_file():
                rel_path = str(item.relative_to(self.target_path))
                
                # Check frontend
                if any(ind in rel_path for ind in ['frontend', 'client', 'web', 'app/']):
                    if any(ind in rel_path for ind in frontend_indicators):
                        self.has_frontend = True
                        self.frontend_path = item.parent
                
                # Check backend
                if any(ind in rel_path for ind in ['backend', 'server', 'api', 'src/']):
                    if any(ind in rel_path for ind in backend_indicators):
                        self.has_backend = True
                        self.backend_path = item.parent
        
        if self.verbose:
            print(f"  Frontend detected: {self.has_frontend}")
            print(f"  Backend detected: {self.has_backend}")
    
    def check_type_consistency(self):
        """Check type consistency between frontend and backend"""
        if self.verbose:
            print("🔍 Checking type consistency...")
        
        # Common types that should match
        type_patterns = {
            'status': {
                'patterns': [
                    r'status\s*[=:]\s*[\'"](\w+)[\'"]',
                    r'type\s+\w*Status\s*=\s*[\'"](\w+)[\'"]',
                    r'enum\s+\w*Status\s*{([^}]+)}',
                    r"'(\w+)'\s*\|\s*'(\w+)'\s*\|\s*'(\w+)'",
                ],
                'common_values': ['up', 'down', 'unknown', 'online', 'offline', 'warning', 'active', 'inactive']
            },
            'role': {
                'patterns': [
                    r'role\s*[=:]\s*[\'"](\w+)[\'"]',
                    r"Role\s*[=:]\s*'?(\w+)'?",
                ],
                'common_values': ['admin', 'user', 'guest', 'moderator']
            }
        }
        
        frontend_types = {}
        backend_types = {}
        
        # Extract types from frontend
        if self.frontend_path:
            for file_path in self.target_path.rglob('*'):
                if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                    content = self.read_file_safe(file_path)
                    for type_name, config in type_patterns.items():
                        for pattern in config['patterns']:
                            matches = re.findall(pattern, content, re.IGNORECASE)
                            if matches:
                                if type_name not in frontend_types:
                                    frontend_types[type_name] = set()
                                for match in matches:
                                    if isinstance(match, tuple):
                                        frontend_types[type_name].update(match)
                                    else:
                                        frontend_types[type_name].add(match.lower())
        
        # Extract types from backend
        if self.backend_path:
            for file_path in self.target_path.rglob('*'):
                if file_path.suffix in ['.ts', '.js', '.py', '.go']:
                    content = self.read_file_safe(file_path)
                    for type_name, config in type_patterns.items():
                        for pattern in config['patterns']:
                            matches = re.findall(pattern, content, re.IGNORECASE)
                            if matches:
                                if type_name not in backend_types:
                                    backend_types[type_name] = set()
                                for match in matches:
                                    if isinstance(match, tuple):
                                        backend_types[type_name].update(match)
                                    else:
                                        backend_types[type_name].add(match.lower())
        
        # Compare types
        for type_name in set(list(frontend_types.keys()) + list(backend_types.keys())):
            fe_vals = frontend_types.get(type_name, set())
            be_vals = backend_types.get(type_name, set())
            
            if fe_vals and be_vals and fe_vals != be_vals:
                finding = {
                    'type': 'type_mismatch',
                    'severity': 'error',
                    'field': type_name,
                    'frontend_values': list(fe_vals),
                    'backend_values': list(be_vals),
                    'message': f"Type mismatch for '{type_name}': Frontend uses {fe_vals}, Backend uses {be_vals}"
                }
                self.results['errors'].append(finding)
                self.results['findings'].append(finding)
                
                if self.verbose:
                    print(f"  ❌ Type mismatch: {type_name}")
                    print(f"     Frontend: {fe_vals}")
                    print(f"     Backend: {be_vals}")
    
    def check_api_consistency(self):
        """Check if frontend API calls match backend endpoints"""
        if self.verbose:
            print("🔍 Checking API consistency...")
        
        backend_endpoints = set()
        frontend_calls = set()
        
        # Extract backend endpoints
        for file_path in self.target_path.rglob('*'):
            if file_path.suffix in ['.ts', '.js']:
                content = self.read_file_safe(file_path)
                # Match patterns like: router.get('/api/users'), app.post('/login')
                patterns = [
                    r"(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]",
                    r"['\"](GET|POST|PUT|DELETE|PATCH)\s+(['\"][^'\"]+['\"])",
                ]
                for pattern in patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        if isinstance(match, tuple):
                            endpoint = match[1].strip("'\"")
                            backend_endpoints.add(endpoint)
        
        # Extract frontend API calls
        for file_path in self.target_path.rglob('*'):
            if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                content = self.read_file_safe(file_path)
                # Match axios/fetch calls
                patterns = [
                    r"axios\.(get|post|put|delete)\s*\(\s*['\"]([^'\"]+)['\"]",
                    r"fetch\s*\(\s*['\"]([^'\"]+)['\"]",
                    r"['\"](/api/[^'\"]+)['\"]",
                ]
                for pattern in patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        if isinstance(match, tuple):
                            endpoint = match[1] if len(match) > 1 else match[0]
                        else:
                            endpoint = match
                        if '/api/' in endpoint:
                            frontend_calls.add(endpoint)
        
        # Check for mismatches
        unmatched_calls = frontend_calls - backend_endpoints
        if unmatched_calls:
            for call in unmatched_calls:
                finding = {
                    'type': 'api_mismatch',
                    'severity': 'warning',
                    'frontend_call': call,
                    'message': f"Frontend calls API '{call}' but no matching backend endpoint found"
                }
                self.results['warnings'].append(finding)
                self.results['findings'].append(finding)
                
                if self.verbose:
                    print(f"  ⚠️  Unmatched API call: {call}")
    
    def check_common_issues(self):
        """Check for common code quality issues"""
        if self.verbose:
            print("🔍 Checking common issues...")
        
        # Check for console.log in production code
        for file_path in self.target_path.rglob('*'):
            if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                content = self.read_file_safe(file_path)
                if 'console.log' in content:
                    finding = {
                        'type': 'console_log',
                        'severity': 'warning',
                        'file': str(file_path.relative_to(self.target_path)),
                        'message': f"Found console.log in {file_path.name} - consider removing for production"
                    }
                    self.results['warnings'].append(finding)
        
        # Check for hardcoded secrets (basic check)
        secret_patterns = [
            r'(password|secret|token|key)\s*=\s*["\'][^"\']{8,}["\']',
            r'API_KEY\s*=\s*["\'][^"\']+["\']',
        ]
        for file_path in self.target_path.rglob('*'):
            if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx', '.py', '.env']:
                content = self.read_file_safe(file_path)
                for pattern in secret_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        finding = {
                            'type': 'hardcoded_secret',
                            'severity': 'error',
                            'file': str(file_path.relative_to(self.target_path)),
                            'message': f"Possible hardcoded secret in {file_path.name} - use environment variables"
                        }
                        self.results['errors'].append(finding)
    
    def read_file_safe(self, file_path: Path) -> str:
        """Safely read file content"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception:
            return ""
    
    def generate_report(self):
        """Generate and display the report"""
        errors = len(self.results['errors'])
        warnings = len(self.results['warnings'])
        
        print("\n" + "="*50)
        print("📊 QUALITY ANALYSIS REPORT")
        print("="*50)
        print(f"🎯 Target: {self.results['target']}")
        print(f"📁 Frontend: {'✅' if self.has_frontend else '❌'}")
        print(f"📁 Backend:  {'✅' if self.has_backend else '❌'}")
        print(f"-" * 50)
        
        if errors > 0:
            print(f"❌ Errors:   {errors}")
            for err in self.results['errors']:
                print(f"   • {err.get('message', err)}")
        
        if warnings > 0:
            print(f"⚠️  Warnings: {warnings}")
            for warn in self.results['warnings']:
                print(f"   • {warn.get('message', warn)}")
        
        if errors == 0 and warnings == 0:
            print("✅ No issues found!")
        
        print("="*50 + "\n")
        
        # Update status
        if errors > 0:
            self.results['status'] = 'failed'
        elif warnings > 0:
            self.results['status'] = 'passed_with_warnings'
        else:
            self.results['status'] = 'passed'

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Code Quality Analyzer for Fullstack Projects"
    )
    parser.add_argument(
        'target',
        help='Target path to analyze (frontend, backend, or fullstack project)'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results as JSON'
    )
    parser.add_argument(
        '--output', '-o',
        help='Output file path'
    )
    
    args = parser.parse_args()
    
    tool = CodeQualityAnalyzer(
        args.target,
        verbose=args.verbose
    )
    
    results = tool.run()
    
    if args.json:
        output = json.dumps(results, indent=2)
        if args.output:
            with open(args.output, 'w') as f:
                f.write(output)
            print(f"💾 Results written to {args.output}")
        else:
            print(output)
    
    # Exit with error code if there are errors
    if results['status'] == 'failed':
        sys.exit(1)

if __name__ == '__main__':
    main()
