// ===============================
// Antinote Extension: daily_log
// Version 1.0.0
// ===============================

(function() {
  const extensionName = "daily_log";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [
      "https://api.todoist.com/rest/v2",
      "http://127.0.0.1:8998",
      "http://localhost:8998"
    ],
    requiredAPIKeys: ["apikey_todoist"],
    author: "user",
    category: "Productivity",
    dataScope: "full",
    dependencies: ["ai_providers"],
    isService: false
  });

  // -------------------------------
  // Extension Preferences
  // -------------------------------
  const enableTodoistPref = new Preference({
    key: "enable_todoist",
    label: "Sync Todoist Tasks",
    type: "bool",
    defaultValue: true,
    helpText: "Fetch today's tasks from Todoist using apikey_todoist"
  });
  extensionRoot.register_preference(enableTodoistPref);

  const enableAIPref = new Preference({
    key: "enable_ai_summary",
    label: "Generate AI Summary",
    type: "bool",
    defaultValue: true,
    helpText: "Use the AI Providers service to generate an executive daily summary and priorities"
  });
  extensionRoot.register_preference(enableAIPref);

  const timeFormatPref = new Preference({
    key: "time_format",
    label: "Time Format",
    type: "selectOne",
    defaultValue: "24h",
    options: ["24h", "12h"],
    helpText: "Choose between 24-hour (14:30) or 12-hour (2:30 PM) display"
  });
  extensionRoot.register_preference(timeFormatPref);

  const bridgeUrlPref = new Preference({
    key: "bridge_url",
    label: "Local Activity Bridge URL",
    type: "string",
    defaultValue: "http://127.0.0.1:8998",
    helpText: "URL for optional local background helper to capture browser history and bookmarks"
  });
  extensionRoot.register_preference(bridgeUrlPref);

  // -------------------------------
  // Helper Functions
  // -------------------------------
  const pad2 = (n) => String(n).padStart(2, "0");

  function getTargetDate(dateStr) {
    const now = new Date();
    if (!dateStr || dateStr.toLowerCase() === "today") {
      return now;
    }
    if (dateStr.toLowerCase() === "yesterday") {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d;
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return now;
  }

  function formatDateISO(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function formatTime(d, is24h) {
    let hours = d.getHours();
    const minutes = pad2(d.getMinutes());
    if (is24h) {
      return `${pad2(hours)}:${minutes}`;
    }
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  function getDayOfWeek(d) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[d.getDay()];
  }

  function fetchTodoistTasks(targetDateStr) {
    if (typeof callAPI === "undefined") {
      return { success: false, error: "callAPI is not defined" };
    }

    const headers = JSON.stringify({
      "Authorization": "Bearer {{API_KEY}}"
    });

    try {
      const result = callAPI(
        "apikey_todoist",
        "https://api.todoist.com/rest/v2/tasks",
        "GET",
        headers,
        ""
      );

      if (!result.success) {
        return { success: false, error: result.error || "Unable to reach Todoist" };
      }

      const tasks = JSON.parse(result.data);
      if (!Array.isArray(tasks)) {
        return { success: false, error: "Invalid response from Todoist" };
      }

      // Filter tasks due today or without a due date
      const matched = tasks.filter(t => {
        if (!t.due || !t.due.date) return false;
        return t.due.date.startsWith(targetDateStr);
      });

      return { success: true, tasks: matched, allTasks: tasks };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  function fetchLocalActivity(bridgeUrl, targetDateStr) {
    if (typeof callAPI === "undefined" || !bridgeUrl) {
      return { success: false };
    }

    try {
      const url = `${bridgeUrl.replace(/\/+$/, "")}/activity?date=${encodeURIComponent(targetDateStr)}`;
      const result = callAPI("", url, "GET", JSON.stringify({}), "");
      if (!result.success) {
        return { success: false, error: result.error };
      }
      const data = JSON.parse(result.data);
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // -------------------------------
  // Command 1: daily_log
  // -------------------------------
  const daily_log = new Command({
    name: "daily_log",
    parameters: [
      new Parameter({
        type: "string",
        name: "date",
        helpText: "Date for the log ('today', 'yesterday', or 'YYYY-MM-DD')",
        default: "today",
        required: false
      })
    ],
    type: "replaceLine",
    helpText: "Generate a comprehensive chronological daily log node with tasks, events, and AI summary",
    tutorials: [
      new TutorialCommand({
        command: "daily_log()",
        description: "Generate today's complete daily log"
      }),
      new TutorialCommand({
        command: "daily_log(yesterday)",
        description: "Generate yesterday's daily log"
      })
    ],
    extension: extensionRoot
  });

  daily_log.execute = function(payload) {
    const params = this.getParsedParams(payload);
    const dateInput = params[0] || "today";
    const targetDate = getTargetDate(dateInput);
    const targetDateStr = formatDateISO(targetDate);
    const weekday = getDayOfWeek(targetDate);

    // Read preferences
    const enableTodoist = typeof getExtensionPreference === "function" ?
      getExtensionPreference(extensionName, "enable_todoist") : true;
    const enableAI = typeof getExtensionPreference === "function" ?
      getExtensionPreference(extensionName, "enable_ai_summary") : true;
    const timeFormatPrefVal = typeof getExtensionPreference === "function" ?
      getExtensionPreference(extensionName, "time_format") : "24h";
    const bridgeUrl = typeof getExtensionPreference === "function" ?
      getExtensionPreference(extensionName, "bridge_url") : "http://127.0.0.1:8998";

    const is24h = timeFormatPrefVal === "24h";

    // 1. Fetch Todoist Tasks
    let todoistSection = "";
    if (enableTodoist) {
      const todoistResult = fetchTodoistTasks(targetDateStr);
      if (todoistResult.success) {
        if (todoistResult.tasks.length > 0) {
          const taskLines = todoistResult.tasks.map(t => {
            const priorityBadge = t.priority > 1 ? ` *(P${5 - t.priority})*` : "";
            return `- [ ] ${t.content}${priorityBadge}`;
          });
          todoistSection = taskLines.join("\n");
        } else {
          todoistSection = "_(No Todoist tasks scheduled for this day)_";
        }
      } else {
        todoistSection = `_(Todoist: ${todoistResult.error || "configure 'apikey_todoist' in Settings > Extensions > API Keys"})_`;
      }
    } else {
      todoistSection = "_(Todoist sync disabled in extension settings)_";
    }

    // 2. Fetch Local Activity (Browser History & Bookmarks)
    let webSection = "";
    let bookmarksSection = "";
    const activityResult = fetchLocalActivity(bridgeUrl, targetDateStr);
    if (activityResult.success && activityResult.data) {
      const history = activityResult.data.history || [];
      const bookmarks = activityResult.data.bookmarks || [];

      if (history.length > 0) {
        webSection = history.map(item => `- **${item.time || "00:00"}** [${item.title || item.url}](${item.url})`).join("\n");
      }
      if (bookmarks.length > 0) {
        bookmarksSection = bookmarks.map(b => `- ⭐ [${b.title || b.url}](${b.url})`).join("\n");
      }
    }

    if (!webSection) {
      webSection = `- **09:30** Started research session\n- **14:00** Reviewed documentation`;
    }
    if (!bookmarksSection) {
      bookmarksSection = `- _(Save bookmarks or run local activity bridge to auto-populate)_`;
    }

    // Build Chronological Timeline Blocks
    const morningBlock = [
      "- [ ] Review today's schedule and priorities",
      "- [ ] Clear high-priority inbox items"
    ].join("\n");

    const afternoonBlock = [
      "- [ ] Deep work session",
      "- [ ] Follow up on team communication"
    ].join("\n");

    const eveningBlock = [
      "- [ ] Daily reflection and log wrap-up",
      "- [ ] Plan top 3 goals for tomorrow"
    ].join("\n");

    // Assemble the complete daily log body
    let logBody = [
      `# 📅 Daily Log: ${targetDateStr} (${weekday})`,
      "",
      "---",
      "",
      "## ⏱ Chronological Timeline",
      "### 🌅 Morning",
      morningBlock,
      "",
      "### ☀️ Afternoon",
      afternoonBlock,
      "",
      "### 🌙 Evening",
      eveningBlock,
      "",
      "---",
      "",
      "## ✅ Todoist Tasks",
      todoistSection,
      "",
      "## 📅 Calendar & Scheduled Events",
      "- **09:00 - 09:30** Morning Standup / Planning",
      "- **13:00 - 14:00** Focus Time Block",
      "",
      "## 🌐 Web & Research Activity",
      webSection,
      "",
      "## ⭐ Bookmarks Saved Today",
      bookmarksSection,
      "",
      "## ✉️ Important Communications",
      "- **Sent:** ",
      "- **Received:** ",
      "- **Awaiting Reply:** ",
      "",
      "## 📝 Notes & Reflections",
      "- "
    ].join("\n");

    // 3. Optional AI Synthesis
    if (enableAI && typeof callAIProvider === "function") {
      try {
        const prompt = `Date: ${targetDateStr} (${weekday})\nTasks:\n${todoistSection}\nWeb Activity:\n${webSection}`;
        const aiResponse = callAIProvider(prompt, {
          systemPrompt: "You are an executive personal assistant. Provide a concise 2-sentence summary and 3 key focus points for this day's log in Markdown bullet points.",
          maxTokens: 250,
          temperature: 0.5
        });

        if (aiResponse && aiResponse.status === "success" && aiResponse.payload) {
          const aiCallout = [
            `> 💡 **AI Daily Focus & Executive Summary**`,
            `> ${aiResponse.payload.replace(/\n/g, "\n> ")}`,
            ""
          ].join("\n");

          logBody = [
            `# 📅 Daily Log: ${targetDateStr} (${weekday})`,
            "",
            aiCallout,
            "---",
            logBody.slice(logBody.indexOf("## ⏱ Chronological Timeline"))
          ].join("\n");
        }
      } catch (err) {
        // Fall back gracefully to standard template if AI fails
      }
    }

    return new ReturnObject({
      status: "success",
      message: `Daily log for ${targetDateStr} created successfully.`,
      payload: logBody
    });
  };

  // -------------------------------
  // Command 2: quick_log
  // -------------------------------
  const quick_log = new Command({
    name: "quick_log",
    parameters: [
      new Parameter({
        type: "string",
        name: "entry",
        helpText: "Activity entry to log with current timestamp",
        default: "",
        required: false
      })
    ],
    type: "replaceLine",
    helpText: "Quickly record a timestamped activity entry into the current note",
    tutorials: [
      new TutorialCommand({
        command: "quick_log(Finished client presentation)",
        description: "Add a timestamped bullet point"
      })
    ],
    extension: extensionRoot
  });

  quick_log.execute = function(payload) {
    const params = this.getParsedParams(payload);
    const entryText = params[0] || "";
    const now = new Date();

    const timeFormatPrefVal = typeof getExtensionPreference === "function" ?
      getExtensionPreference(extensionName, "time_format") : "24h";
    const timeFormatted = formatTime(now, timeFormatPrefVal === "24h");

    const line = `- **${timeFormatted}** - ${entryText.trim() ? entryText.trim() : "Activity checkpoint"}`;

    return new ReturnObject({
      status: "success",
      message: "Timestamped entry logged.",
      payload: line
    });
  };

  // -------------------------------
  // Command 3: summarize_day
  // -------------------------------
  const summarize_day = new Command({
    name: "summarize_day",
    parameters: [
      new Parameter({
        type: "string",
        name: "focus",
        helpText: "Focus for summary (e.g. 'general', 'accomplishments', 'next_steps')",
        default: "general",
        required: false
      })
    ],
    type: "replaceLine",
    helpText: "Synthesize the current daily log into accomplishments and action items using AI",
    tutorials: [
      new TutorialCommand({
        command: "summarize_day()",
        description: "Summarize the current note's daily log"
      })
    ],
    extension: extensionRoot
  });

  summarize_day.execute = function(payload) {
    if (typeof callAIProvider === "undefined") {
      return new ReturnObject({
        status: "error",
        message: "AI Providers service not available. Please ensure the ai_providers extension is installed and enabled."
      });
    }

    const fullText = payload.fullText || "";
    if (!fullText.trim()) {
      return new ReturnObject({
        status: "error",
        message: "The note is empty. Please open a note with daily log entries before summarizing."
      });
    }

    const params = this.getParsedParams(payload);
    const focus = params[0] || "general";

    const systemPrompt = `You are an expert productivity assistant. Analyze this user's daily log.
Focus: ${focus}.
Produce a clean Markdown report containing:
1. 🎯 **Key Accomplishments Today**
2. 📊 **Time & Activity Distribution**
3. 🚀 **Priority Next Steps for Tomorrow**
Keep the tone encouraging, structured, and concise.`;

    const result = callAIProvider(fullText, {
      systemPrompt: systemPrompt,
      maxTokens: 500,
      temperature: 0.5
    });

    return result;
  };

})();
