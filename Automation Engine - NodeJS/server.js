const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors());

app.post("/send-data", async (req, res) => {
  const steps = req.body;

  console.log("Received automation steps:", steps);

  if (!Array.isArray(steps)) {
    return res.status(400).json({ error: "Invalid payload format" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ["--start-maximized"],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);
    for (const step of steps) {
      switch (step.action) {
        case "navigate":
          console.log("Navigating to:", step.url);
          await page.goto(step.url, { waitUntil: "networkidle2" });
          break;

        case "click":
          console.log("Clicking:", step.selector);
          console.log("page:", page);
          await page.click('button[type="submit"]');
          break;

        case "type":
        case "input":
          console.log(`Typing into ${step.selector}:`, step.value);
          await page.waitForSelector(step.selector, { visible: true });
          await page.focus(step.selector);
          await page.keyboard.type(step.value, { delay: 100 });
          break;

        default:
          console.warn("Unknown action:", step.action);
      }
    }
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .map((a) => ({
          text: a.innerText,
          href: a.href,
        }))
        .filter((a) => a.href);
    });

    res.json({
      message: "Automation completed successfully",
      receivedData: links,
      success: true,
    });
  } catch (err) {
    console.error("Automation error:", err);
    res.status(500).json({
      error: "Automation failed",
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Puppeteer server running at http://localhost:${PORT}`);
});
