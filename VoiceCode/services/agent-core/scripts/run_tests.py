#!/usr/bin/env python
"""
Test runner script for VoiceCode Agent Core
Provides convenient commands for running different test suites
"""

import subprocess
import sys
import argparse
from pathlib import Path


def run_command(cmd: list[str]) -> int:
    """Run a command and return exit code."""
    print(f"\n🧪 Running: {' '.join(cmd)}\n")
    return subprocess.call(cmd)


def main():
    parser = argparse.ArgumentParser(
        description="VoiceCode Agent Core Test Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/run_tests.py                    # Run all tests
  python scripts/run_tests.py --unit             # Run unit tests only
  python scripts/run_tests.py --integration      # Run integration tests only
  python scripts/run_tests.py --e2e              # Run end-to-end tests only
  python scripts/run_tests.py --coverage         # Run with coverage report
  python scripts/run_tests.py -k "test_search"   # Run tests matching pattern
  python scripts/run_tests.py --fast             # Skip slow tests
        """,
    )
    
    parser.add_argument(
        "--unit", "-u",
        action="store_true",
        help="Run unit tests only",
    )
    parser.add_argument(
        "--integration", "-i",
        action="store_true",
        help="Run integration tests only",
    )
    parser.add_argument(
        "--e2e", "-e",
        action="store_true",
        help="Run end-to-end tests only",
    )
    parser.add_argument(
        "--coverage", "-c",
        action="store_true",
        help="Run with coverage report",
    )
    parser.add_argument(
        "--fast", "-f",
        action="store_true",
        help="Skip slow tests",
    )
    parser.add_argument(
        "-k",
        type=str,
        help="Run tests matching expression",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output",
    )
    parser.add_argument(
        "--failfast", "-x",
        action="store_true",
        help="Stop on first failure",
    )
    
    args = parser.parse_args()
    
    # Build pytest command
    cmd = ["pytest"]
    
    # Add test directory based on type
    if args.unit:
        cmd.append("tests/unit")
    elif args.integration:
        cmd.append("tests/integration")
    elif args.e2e:
        cmd.append("tests/integration/test_end_to_end.py")
    else:
        cmd.append("tests")
    
    # Add options
    if args.coverage:
        cmd.extend(["--cov=src", "--cov-report=html", "--cov-report=term-missing"])
    
    if args.fast:
        cmd.extend(["-m", "not slow"])
    
    if args.k:
        cmd.extend(["-k", args.k])
    
    if args.verbose:
        cmd.append("-vv")
    
    if args.failfast:
        cmd.append("-x")
    
    # Run tests
    exit_code = run_command(cmd)
    
    # Summary
    if exit_code == 0:
        print("\n✅ All tests passed!")
    else:
        print(f"\n❌ Tests failed with exit code {exit_code}")
    
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
