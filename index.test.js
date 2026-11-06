// Test file for daily_log extension
var fs = require('fs');
var path = require('path');

function describe(name, fn) {
  console.log("\n" + name);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log("  ✓ " + name);
  } catch (e) {
    console.log("  ✗ " + name);
    console.log("    Error: " + e.message);
  }
}

function expect(actual) {
  return {
    toBe: function(expected) {
      if (actual !== expected) {
        throw new Error("Expected " + expected + " but got " + actual);
      }
    },
    toContain: function(expected) {
      if (actual.indexOf(expected) === -1) {
        throw new Error("Expected " + actual + " to contain " + expected);
      }
    },
    toBeDefined: function() {
      if (actual === undefined || actual === null) {
        throw new Error("Expected value to be defined");
      }
    },
    toBeArray: function() {
      if (!Array.isArray(actual)) {
        throw new Error("Expected " + actual + " to be an array");
      }
    }
  };
}

var metadataPath = path.join(__dirname, 'extension.json');
var metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

describe("daily_log extension.json", function() {
  it("should have correct metadata fields", function() {
    expect(metadata.name).toBe("daily_log");
    expect(metadata.version).toBe("1.0.0");
    expect(metadata.category).toBe("Productivity");
    expect(metadata.dataScope).toBe("full");
  });

  it("should declare endpoints and API keys", function() {
    expect(metadata.endpoints).toBeArray();
    expect(metadata.endpoints).toContain("https://api.todoist.com/rest/v2");
    expect(metadata.requiredAPIKeys).toContain("apikey_todoist");
  });

  it("should define all three commands", function() {
    var cmdNames = metadata.commands.map(function(c) { return c.name; });
    expect(cmdNames).toContain("daily_log");
    expect(cmdNames).toContain("quick_log");
    expect(cmdNames).toContain("summarize_day");
  });
});
