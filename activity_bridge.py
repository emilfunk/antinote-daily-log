#!/usr/bin/env python3
"""
Antinote Activity Bridge
A lightweight local companion server that reads today's browser history and bookmarks
from Google Chrome and Safari to feed into the Antinote `daily_log` extension.

Usage:
    python3 activity_bridge.py
    (Runs on http://127.0.0.1:8765)
"""

import http.server
import json
import os
import shutil
import sqlite3
import tempfile
import urllib.parse
from datetime import datetime, timezone, timedelta

PORT = 8998

def get_chrome_history(target_date_str):
    """Extract Chrome history items for the given date (YYYY-MM-DD)."""
    items = []
    chrome_history_path = os.path.expanduser(
        "~/Library/Application Support/Google/Chrome/Default/History"
    )
    if not os.path.exists(chrome_history_path):
        return items

    # Chrome locks the SQLite DB while running, so copy to a temp file
    temp_dir = tempfile.mkdtemp()
    temp_db = os.path.join(temp_dir, "HistoryCopy")
    try:
        shutil.copy2(chrome_history_path, temp_db)
        conn = sqlite3.connect(temp_db)
        cursor = conn.cursor()

        # Target date window in UTC
        dt_start = datetime.strptime(target_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        dt_end = dt_start + timedelta(days=1)

        # Chrome timestamps are microseconds since Jan 1, 1601 UTC
        epoch_offset = 11644473600
        chrome_start = int((dt_start.timestamp() + epoch_offset) * 1000000)
        chrome_end = int((dt_end.timestamp() + epoch_offset) * 1000000)

        query = """
            SELECT urls.url, urls.title, visits.visit_time
            FROM urls
            JOIN visits ON urls.id = visits.url
            WHERE visits.visit_time >= ? AND visits.visit_time < ?
            ORDER BY visits.visit_time ASC
            LIMIT 100
        """
        cursor.execute(query, (chrome_start, chrome_end))
        rows = cursor.fetchall()
        for url, title, visit_time in rows:
            ts_sec = (visit_time / 1000000) - epoch_offset
            local_dt = datetime.fromtimestamp(ts_sec)
            items.append({
                "time": local_dt.strftime("%H:%M"),
                "title": title or url,
                "url": url
            })
        conn.close()
    except Exception as e:
        print(f"Error reading Chrome history: {e}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    return items

def get_chrome_bookmarks():
    """Extract recently added Chrome bookmarks."""
    bookmarks = []
    bm_path = os.path.expanduser("~/Library/Application Support/Google/Chrome/Default/Bookmarks")
    if not os.path.exists(bm_path):
        return bookmarks

    try:
        with open(bm_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        def walk(node):
            if isinstance(node, dict):
                if node.get("type") == "url":
                    bookmarks.append({
                        "title": node.get("name", ""),
                        "url": node.get("url", "")
                    })
                for child in node.get("children", []):
                    walk(child)

        roots = data.get("roots", {})
        for root_key in roots:
            walk(roots[root_key])
    except Exception as e:
        print(f"Error reading Chrome bookmarks: {e}")

    return bookmarks[-10:]  # return the 10 most recent

class BridgeRequestHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if parsed.path == "/activity":
            target_date = params.get("date", [datetime.now().strftime("%Y-%m-%d")])[0]
            history = get_chrome_history(target_date)
            bookmarks = get_chrome_bookmarks()

            response_data = {
                "date": target_date,
                "history": history,
                "bookmarks": bookmarks
            }

            body = json.dumps(response_data).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        # Silent logger for cleaner output
        pass

if __name__ == "__main__":
    server_address = ("127.0.0.1", PORT)
    httpd = http.server.HTTPServer(server_address, BridgeRequestHandler)
    print(f"Antinote Activity Bridge running at http://127.0.0.1:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down bridge.")
