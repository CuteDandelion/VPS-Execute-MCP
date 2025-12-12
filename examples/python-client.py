#!/usr/bin/env python3
"""
Example Python client for VPS-Execute-MCP REST API

This demonstrates how to interact with the API server from Python.
"""

import requests
import json
from typing import Dict, Any

class VPSExecuteClient:
    def __init__(self, base_url: str, api_key: str):
        """Initialize the client with API credentials."""
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }

    def execute_command(self, command: str, timeout: int = None) -> Dict[str, Any]:
        """Execute a command on the remote host."""
        data = {'command': command}
        if timeout:
            data['timeout'] = timeout

        response = requests.post(
            f'{self.base_url}/execute',
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

    def upload_file(self, local_path: str, remote_path: str) -> Dict[str, Any]:
        """Upload a file to the remote host."""
        response = requests.post(
            f'{self.base_url}/upload',
            headers=self.headers,
            json={'localPath': local_path, 'remotePath': remote_path}
        )
        response.raise_for_status()
        return response.json()

    def download_file(self, remote_path: str, local_path: str) -> Dict[str, Any]:
        """Download a file from the remote host."""
        response = requests.post(
            f'{self.base_url}/download',
            headers=self.headers,
            json={'remotePath': remote_path, 'localPath': local_path}
        )
        response.raise_for_status()
        return response.json()

    def list_directory(self, remote_path: str) -> Dict[str, Any]:
        """List contents of a remote directory."""
        response = requests.post(
            f'{self.base_url}/list',
            headers=self.headers,
            json={'remotePath': remote_path}
        )
        response.raise_for_status()
        return response.json()

    def get_system_info(self) -> Dict[str, Any]:
        """Get system information from the remote host."""
        response = requests.get(
            f'{self.base_url}/system-info',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def list_processes(self) -> Dict[str, Any]:
        """List running processes on the remote host."""
        response = requests.get(
            f'{self.base_url}/processes',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()


def main():
    # Configuration
    API_URL = 'http://localhost:3000'
    API_KEY = 'your-api-key-here'

    # Initialize client
    client = VPSExecuteClient(API_URL, API_KEY)

    # Example 1: Execute a command
    print("=" * 50)
    print("Executing command: df -h")
    print("=" * 50)
    result = client.execute_command('df -h')
    if result['success']:
        print(result['result']['stdout'])

    # Example 2: Get system information
    print("\n" + "=" * 50)
    print("Getting system information")
    print("=" * 50)
    sys_info = client.get_system_info()
    if sys_info['success']:
        info = sys_info['info']
        print(f"Hostname: {info['hostname']}")
        print(f"Uptime: {info['uptime']}")
        print(f"Load Average: {info['loadAverage']}")

    # Example 3: List directory
    print("\n" + "=" * 50)
    print("Listing /tmp directory")
    print("=" * 50)
    files = client.list_directory('/tmp')
    if files['success']:
        for file in files['files'][:5]:  # Show first 5 files
            print(f"{file['type']} {file['name']} ({file['size']} bytes)")

    # Example 4: List processes
    print("\n" + "=" * 50)
    print("Top processes by CPU usage")
    print("=" * 50)
    processes = client.list_processes()
    if processes['success']:
        lines = processes['processes'].split('\n')[:6]  # Show header + top 5
        for line in lines:
            print(line)


if __name__ == '__main__':
    main()
