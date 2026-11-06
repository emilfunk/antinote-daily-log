<p align="center">
  <img src="assets/banner.png" alt="Daily Log for Antinote" width="760">
</p>

<p align="center">
  <b>A chronological daily activity logger for <a href="https://antinote.io">Antinote</a> on macOS.</b><br>
  Capture your schedule, Todoist tasks, browser activity, and AI summaries in a single daily node.
</p>

---

## ⚡ Commands

| Command | Type | Description |
| :--- | :--- | :--- |
| `::daily_log` | `replaceLine` | Generates a complete chronological daily log for today (or `::daily_log(yesterday)`). |
| `::quick_log(text)` | `replaceLine` | Inserts a timestamped activity checkpoint (e.g. `- **16:20** - Shipped feature`). |
| `::summarize_day` | `replaceLine` | Uses AI (`ai_providers`) to analyze accomplishments and prioritize tomorrow. |

---

## 🚀 Quick Install

1. Clone or download this repo.
2. Copy this folder into your Antinote Extensions directory:
   ```bash
   cp -r . ~/Library/Containers/com.chabomakers.Antinote/Data/Library/Application\ Support/Antinote/Extensions/daily_log/
   ```
3. In **Antinote > Preferences > Extensions**, click **Reload Extensions**.

---

## ⚙️ Configuration

### 1. Todoist (Optional)
- Open **Antinote > Preferences > Extensions > API Keys**.
- Add a new key:
  - **Name:** `Todoist`
  - **Keychain Key:** `apikey_todoist`
  - **API Key Value:** Your Todoist API token (*Settings > Integrations > Developer*).

### 2. Browser History & Bookmarks (Optional)
Antinote runs sandboxed on macOS. To automatically feed today's Chrome history and bookmarks into your log, start the lightweight companion bridge:
```bash
python3 activity_bridge.py
```
*(Runs locally on `http://127.0.0.1:8998`. If not running, template blocks are provided instead).*

### 3. AI Summaries
Ensure the official **`ai_providers`** extension is enabled in Antinote for executive summaries and reflections.

---

## 📄 License
MIT
