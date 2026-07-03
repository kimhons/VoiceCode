#!/usr/bin/env python3
"""
Comprehensive Testing Script for VoiceFlow Pro
Runs all tests across all components and generates unified reports
"""

import os
import sys
import json
import subprocess
import argparse
import time
from pathlib import Path
from typing import Dict, List, Any
import concurrent.futures
from dataclasses import dataclass


@dataclass
class TestResult:
    """Test result data structure"""
    component: str
    success: bool
    duration: float
    total_tests: int
    passed_tests: int
    failed_tests: int
    skipped_tests: int
    coverage: float
    output: str
    errors: List[str]


class VoiceFlowTestRunner:
    """Main test runner for VoiceFlow Pro components"""
    
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path)
        self.results: Dict[str, TestResult] = {}
        
    def run_all_tests(self, components: List[str] = None, parallel: bool = False) -> Dict[str, TestResult]:
        """Run tests for all components"""
        if components is None:
            components = ['voice-recognition-engine', 'voiceflow-pro-ui', 'ai_text_processor']
        
        if parallel:
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                futures = {
                    executor.submit(self.run_component_tests, component): component
                    for component in components
                }
                
                for future in concurrent.futures.as_completed(futures):
                    component = futures[future]
                    try:
                        result = future.result()
                        self.results[component] = result
                    except Exception as exc:
                        print(f'{component} generated an exception: {exc}')
        else:
            for component in components:
                result = self.run_component_tests(component)
                self.results[component] = result
        
        return self.results
    
    def run_component_tests(self, component: str) -> TestResult:
        """Run tests for a specific component"""
        print(f"\n{'='*60}")
        print(f"Testing {component}")
        print(f"{'='*60}")
        
        start_time = time.time()
        
        if component == 'voice-recognition-engine':
            return self._run_voice_recognition_tests()
        elif component == 'voiceflow-pro-ui':
            return self._run_ui_tests()
        elif component == 'ai_text_processor':
            return self._run_python_tests()
        else:
            raise ValueError(f"Unknown component: {component}")
    
    def _run_voice_recognition_tests(self) -> TestResult:
        """Run voice recognition engine tests"""
        component_path = self.workspace_path / 'voice-recognition-engine'
        
        # Install dependencies if needed
        self._run_command(['npm', 'ci'], component_path)
        
        # Run unit tests
        unit_result = self._run_command([
            'npm', 'test', '--', 
            '--coverage',
            '--coverageReporters=json',
            '--testPathPattern=voice-recognition.test.ts'
        ], component_path, capture_output=True)
        
        # Run performance tests
        perf_result = self._run_command([
            'npm', 'test', '--',
            '--testPathPattern=performance.test.ts',
            '--runInBand'
        ], component_path, capture_output=True)
        
        # Run integration tests
        integration_result = self._run_command([
            'npm', 'test', '--',
            '--testPathPattern=integration.test.ts',
            '--runInBand'
        ], component_path, capture_output=True)
        
        # Parse coverage
        coverage = self._parse_jest_coverage(component_path)
        
        # Combine results
        total_tests = unit_result['total_tests'] + perf_result['total_tests'] + integration_result['total_tests']
        passed_tests = unit_result['passed_tests'] + perf_result['passed_tests'] + integration_result['passed_tests']
        failed_tests = unit_result['failed_tests'] + perf_result['failed_tests'] + integration_result['failed_tests']
        skipped_tests = unit_result['skipped_tests'] + perf_result['skipped_tests'] + integration_result['skipped_tests']
        
        duration = time.time() - unit_result['start_time']
        
        return TestResult(
            component='voice-recognition-engine',
            success=(failed_tests == 0),
            duration=duration,
            total_tests=total_tests,
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            skipped_tests=skipped_tests,
            coverage=coverage,
            output=unit_result['output'] + '\n' + perf_result['output'] + '\n' + integration_result['output'],
            errors=unit_result['errors'] + perf_result['errors'] + integration_result['errors']
        )
    
    def _run_ui_tests(self) -> TestResult:
        """Run UI component tests"""
        component_path = self.workspace_path / 'voiceflow-pro-ui'
        
        # Install dependencies if needed
        self._run_command(['npm', 'ci'], component_path)
        
        # Run tests with vitest
        result = self._run_command([
            'npx', 'vitest', 'run',
            '--coverage',
            '--reporter=verbose'
        ], component_path, capture_output=True)
        
        # Parse vitest results
        parsed = self._parse_vitest_result(result['output'])
        
        duration = time.time() - result['start_time']
        
        return TestResult(
            component='voiceflow-pro-ui',
            success=(parsed['failed'] == 0),
            duration=duration,
            total_tests=parsed['total'],
            passed_tests=parsed['passed'],
            failed_tests=parsed['failed'],
            skipped_tests=parsed['skipped'],
            coverage=parsed['coverage'],
            output=result['output'],
            errors=result['errors']
        )
    
    def _run_python_tests(self) -> TestResult:
        """Run Python AI text processor tests"""
        component_path = self.workspace_path / 'ai_text_processor'
        
        # Install Python dependencies
        self._run_command([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                         component_path, check=False)
        self._run_command([sys.executable, '-m', 'pip', 'install', 'pytest', 'pytest-cov', 'pytest-benchmark'], 
                         component_path)
        
        # Run unit tests with coverage
        unit_result = self._run_command([
            sys.executable, '-m', 'pytest', 
            'tests/test_all.py',
            '--cov=src',
            '--cov-report=json',
            '--cov-report=term',
            '-v'
        ], component_path, capture_output=True)
        
        # Run performance tests
        perf_result = self._run_command([
            sys.executable, '-m', 'pytest',
            'tests/test_performance.py',
            '--benchmark-only',
            '--benchmark-json=benchmark.json',
            '-v'
        ], component_path, capture_output=True)
        
        # Run integration tests
        integration_result = self._run_command([
            sys.executable, '-m', 'pytest',
            'tests/test_integration.py',
            '-v'
        ], component_path, capture_output=True)
        
        # Parse coverage
        coverage = self._parse_pytest_coverage(component_path)
        
        # Combine results
        total_tests = unit_result['total_tests'] + perf_result['total_tests'] + integration_result['total_tests']
        passed_tests = unit_result['passed_tests'] + perf_result['passed_tests'] + integration_result['passed_tests']
        failed_tests = unit_result['failed_tests'] + perf_result['failed_tests'] + integration_result['failed_tests']
        skipped_tests = unit_result['skipped_tests'] + perf_result['skipped_tests'] + integration_result['skipped_tests']
        
        duration = time.time() - unit_result['start_time']
        
        return TestResult(
            component='ai_text_processor',
            success=(failed_tests == 0),
            duration=duration,
            total_tests=total_tests,
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            skipped_tests=skipped_tests,
            coverage=coverage,
            output=unit_result['output'] + '\n' + perf_result['output'] + '\n' + integration_result['output'],
            errors=unit_result['errors'] + perf_result['errors'] + integration_result['errors']
        )
    
    def _run_command(self, cmd: List[str], cwd: Path, capture_output: bool = True, check: bool = True) -> Dict[str, Any]:
        """Run a shell command and return results"""
        start_time = time.time()
        
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd,
                capture_output=capture_output,
                text=True,
                check=check
            )
            
            duration = time.time() - start_time
            
            output = result.stdout if capture_output else ""
            errors = result.stderr if capture_output else ""
            
            return {
                'success': result.returncode == 0,
                'output': output,
                'errors': errors,
                'returncode': result.returncode,
                'start_time': start_time,
                'duration': duration,
                'total_tests': self._extract_test_count(output),
                'passed_tests': self._extract_passed_count(output),
                'failed_tests': self._extract_failed_count(output),
                'skipped_tests': self._extract_skipped_count(output)
            }
            
        except subprocess.CalledProcessError as e:
            duration = time.time() - start_time
            
            return {
                'success': False,
                'output': e.stdout if capture_output else "",
                'errors': e.stderr if capture_output else str(e),
                'returncode': e.returncode,
                'start_time': start_time,
                'duration': duration,
                'total_tests': 0,
                'passed_tests': 0,
                'failed_tests': 1,
                'skipped_tests': 0
            }
    
    def _parse_jest_coverage(self, component_path: Path) -> float:
        """Parse Jest coverage from JSON file"""
        coverage_file = component_path / 'coverage' / 'coverage-final.json'
        if coverage_file.exists():
            try:
                with open(coverage_file) as f:
                    coverage_data = json.load(f)
                    # Calculate overall coverage (simplified)
                    total_statements = sum(file.get('s', {}).get('total', 0) for file in coverage_data.values())
                    covered_statements = sum(file.get('s', {}).get('covered', 0) for file in coverage_data.values())
                    if total_statements > 0:
                        return (covered_statements / total_statements) * 100
            except:
                pass
        return 0.0
    
    def _parse_pytest_coverage(self, component_path: Path) -> float:
        """Parse pytest coverage from JSON file"""
        coverage_file = component_path / 'coverage.json'
        if coverage_file.exists():
            try:
                with open(coverage_file) as f:
                    coverage_data = json.load(f)
                    return coverage_data.get('totals', {}).get('percent_covered', 0)
            except:
                pass
        return 0.0
    
    def _parse_vitest_result(self, output: str) -> Dict[str, int]:
        """Parse vitest output for test counts"""
        # This is a simplified parser - in practice, you'd parse the actual vitest output
        lines = output.split('\n')
        total = passed = failed = skipped = coverage = 0
        
        for line in lines:
            if 'Tests:' in line:
                parts = line.split('Tests:')[1].strip()
                if 'pass' in parts:
                    passed = int(parts.split('pass')[0].strip())
                if 'fail' in parts:
                    failed = int(parts.split('fail')[0].split()[-2])
                total = passed + failed
        
        return {
            'total': total,
            'passed': passed,
            'failed': failed,
            'skipped': skipped,
            'coverage': coverage
        }
    
    def _extract_test_count(self, output: str) -> int:
        """Extract test count from test output"""
        # Try to find test count patterns
        for line in output.split('\n'):
            if 'Tests:' in line and ('Tests:' in line):
                try:
                    return int(line.split('Tests:')[1].split()[0])
                except:
                    pass
        return 0
    
    def _extract_passed_count(self, output: str) -> int:
        """Extract passed test count"""
        for line in output.split('\n'):
            if 'Tests:' in line and 'pass' in line:
                try:
                    parts = line.split('Tests:')[1].strip()
                    if 'pass' in parts:
                        return int(parts.split('pass')[0].strip())
                except:
                    pass
        return 0
    
    def _extract_failed_count(self, output: str) -> int:
        """Extract failed test count"""
        for line in output.split('\n'):
            if 'Tests:' in line and 'fail' in line:
                try:
                    return int(line.split('fail')[0].split()[-2])
                except:
                    pass
        return 0
    
    def _extract_skipped_count(self, output: str) -> int:
        """Extract skipped test count"""
        for line in output.split('\n'):
            if 'skip' in line.lower():
                try:
                    return int(line.split()[-2])
                except:
                    pass
        return 0
    
    def generate_report(self, output_file: str = None) -> str:
        """Generate comprehensive test report"""
        report_lines = []
        report_lines.append("VoiceFlow Pro - Comprehensive Test Report")
        report_lines.append("=" * 60)
        report_lines.append(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("")
        
        total_duration = sum(result.duration for result in self.results.values())
        total_tests = sum(result.total_tests for result in self.results.values())
        total_passed = sum(result.passed_tests for result in self.results.values())
        total_failed = sum(result.failed_tests for result in self.results.values())
        total_skipped = sum(result.skipped_tests for result in self.results.values())
        
        # Summary
        report_lines.append("SUMMARY")
        report_lines.append("-" * 30)
        report_lines.append(f"Total Duration: {total_duration:.2f}s")
        report_lines.append(f"Total Tests: {total_tests}")
        report_lines.append(f"Passed: {total_passed}")
        report_lines.append(f"Failed: {total_failed}")
        report_lines.append(f"Skipped: {total_skipped}")
        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        report_lines.append(f"Success Rate: {success_rate:.1f}%")
        report_lines.append("")
        
        # Component details
        report_lines.append("COMPONENT DETAILS")
        report_lines.append("-" * 30)
        
        for component, result in self.results.items():
            report_lines.append(f"\n{component}:")
            report_lines.append(f"  Status: {'✓ PASS' if result.success else '✗ FAIL'}")
            report_lines.append(f"  Duration: {result.duration:.2f}s")
            report_lines.append(f"  Tests: {result.total_tests} total, {result.passed_tests} passed, {result.failed_tests} failed")
            if result.coverage > 0:
                report_lines.append(f"  Coverage: {result.coverage:.1f}%")
            
            if result.errors:
                report_lines.append(f"  Errors: {len(result.errors)}")
        
        # Performance metrics
        report_lines.append("")
        report_lines.append("PERFORMANCE METRICS")
        report_lines.append("-" * 30)
        
        for component, result in self.results.items():
            tests_per_second = result.total_tests / result.duration if result.duration > 0 else 0
            report_lines.append(f"{component}: {tests_per_second:.2f} tests/second")
        
        # Save report
        report_text = "\n".join(report_lines)
        
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report_text)
            print(f"Report saved to {output_file}")
        
        return report_text
    
    def save_json_report(self, output_file: str):
        """Save detailed results as JSON"""
        data = {
            'timestamp': time.time(),
            'summary': {
                'total_duration': sum(r.duration for r in self.results.values()),
                'total_tests': sum(r.total_tests for r in self.results.values()),
                'total_passed': sum(r.passed_tests for r in self.results.values()),
                'total_failed': sum(r.failed_tests for r in self.results.values()),
                'total_skipped': sum(r.skipped_tests for r in self.results.values())
            },
            'components': {}
        }
        
        for component, result in self.results.items():
            data['components'][component] = {
                'success': result.success,
                'duration': result.duration,
                'total_tests': result.total_tests,
                'passed_tests': result.passed_tests,
                'failed_tests': result.failed_tests,
                'skipped_tests': result.skipped_tests,
                'coverage': result.coverage,
                'errors': result.errors
            }
        
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='VoiceFlow Pro Test Runner')
    parser.add_argument('--workspace', default='.', help='Workspace directory path')
    parser.add_argument('--components', nargs='+', 
                       choices=['voice-recognition-engine', 'voiceflow-pro-ui', 'ai_text_processor'],
                       help='Components to test')
    parser.add_argument('--parallel', action='store_true', help='Run tests in parallel')
    parser.add_argument('--output', help='Output file for test report')
    parser.add_argument('--json-output', help='Output file for JSON report')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Create test runner
    runner = VoiceFlowTestRunner(args.workspace)
    
    # Run tests
    print("Starting VoiceFlow Pro test suite...")
    results = runner.run_all_tests(args.components, args.parallel)
    
    # Generate report
    report = runner.generate_report(args.output)
    
    if args.verbose:
        print("\n" + report)
    
    # Save JSON report if requested
    if args.json_output:
        runner.save_json_report(args.json_output)
    
    # Exit with appropriate code
    all_passed = all(result.success for result in results.values())
    sys.exit(0 if all_passed else 1)


if __name__ == '__main__':
    main()