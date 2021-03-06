const puppeteer = require("puppeteer");
const kill = require("tree-kill");
const util = require("util");
const { startLogging, url_to_domain } = require("./helpers.js");
const { DATA_DIRECTORY } = require("./constants.js");

const launchPageLoadTest = async (url, number, policy, keylog_file) => {
  let success = 1;
  let status = "success";
  const domain = url_to_domain(url);
  const pid = await startLogging(
    domain,
    "pageload",
    number,
    policy,
    keylog_file
  );
  let browser;
  try {
    console.log("Launching browser...");
    const args = ["--no-sandbox"];
    if (policy.includes("torbrowser")) {
      args.push("--proxy-server=socks://localhost:9150");
    } else if (policy.includes("tor")) {
      args.push("--proxy-server=socks://localhost:9050");
    }
    browser = await puppeteer.launch({ args });
    const page = await browser.newPage();
    console.log("Navigating to page...");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    console.log("Capturing screenshot...");
    if (url != "https://www.defenceweb.co.za/") {
      await page.screenshot({
        path: `${DATA_DIRECTORY}/${policy}/screenshots/screenshot_${domain}_${number}.png`,
      });
    }
    console.log("Success!");
  } catch (e) {
    console.log("Puppeteer error: ", e.message);
    success = 0;
    status = e.message;
  }

  if (browser) {
    await browser.close();
  }
  // wait a random amount of time (between 2 and 4s) after each trial
  const ms = Math.round(2000 + Math.random() * 2000);
  console.log(`Waiting ${ms}ms...`);
  await new Promise((resolve) => setTimeout(resolve, ms));
  await util.promisify(kill)(pid);
  return { success, status };
};
exports.launchPageLoadTest = launchPageLoadTest;
