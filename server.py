#!/usr/bin/env python3
"""
Simple HTTP Server for Gems Academy PWA Development
Run this script to serve the application locally for PWA testing
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Define the port
PORT = 8000

# Get the current directory
DIRECTORY = Path(__file__).parent

class PWAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler that adds PWA headers"""
    
    def end_headers(self):
        # Add PWA-specific headers
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        
        # Cache control for different file types
        file_path = self.translate_path(self.path)
        if file_path.endswith(('.js', '.css')):
            self.send_header('Cache-Control', 'max-age=3600')
        elif file_path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg')):
            self.send_header('Cache-Control', 'max-age=86400')
        elif file_path.endswith('.json'):
            self.send_header('Cache-Control', 'max-age=300')
        else:
            self.send_header('Cache-Control', 'no-cache')
        
        super().end_headers()
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    """Main function to start the server"""
    
    # Change to the correct directory
    try:
        os.chdir(DIRECTORY)
        print(f"🚀 Starting Gems Academy PWA Server")
        print(f"📁 Serving directory: {DIRECTORY}")
        print(f"🌐 Server running at: http://localhost:{PORT}")
        print(f"📱 PWA Features: Service Worker, Manifest, Offline Support")
        print(f"🔧 Development Mode: Hot Reload Enabled")
        print(f"⚠️  Note: PWA install prompts work best in Chrome/Edge")
        print(f"🛑 Press Ctrl+C to stop the server")
        print("-" * 60)
        
        # Create the server
        handler = PWAHTTPRequestHandler
        httpd = socketserver.TCPServer(("", PORT), handler)
        
        # Start the server
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try a different port:")
            print(f"   python3 server.py {PORT + 1}")
            sys.exit(1)
        else:
            print(f"❌ Error starting server: {e}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Check if custom port is provided
    if len(sys.argv) > 1:
        try:
            PORT = int(sys.argv[1])
        except ValueError:
            print("❌ Invalid port number. Using default port 8000")
    
    main()
