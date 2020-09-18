/**
 * E2E tests
 *
 */

const puppeteer = require("puppeteer");
const keys = require("../config/keys");

describe("insert different values in the birthdate input[type='date'] element", () => {
  //insert invalid date
  test("should create an element in DOM with certain text", async () => {
    const browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();
    await page.goto("http://localhost:3000");
    //login to be go to page with input[type="date"] element
    await page.type("input#email", keys.PUPPETEER_E2E_TEST_EMAIL);
    await page.type("input#password-field", keys.PUPPETEER_E2E_TEST_PASSWORD);
    await page.click("button#login-email-btn");
    await page.waitForSelector("input#birthdate");

    //submit data with invalid date
    //create invalid date (dependant on user's browser locale)
    //es-ES 24/08/2111, en-US 08/24/2111, HTML value "2111-08-24"
    let year = 2111; //invalid
    let month = 7; //august
    let day = 24;
    let dateString = await page.evaluate(
      ({ year, month, day }) => {
        let date = new Date(year, month, day).toLocaleDateString(
          navigator.language,
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }
        );
        date = date.replace(/\//g, ""); //remove / from string containing date
        return date;
      },
      { year, month, day }
    );

    //disable input[type="date"]#birthdate element clientside validation to bypass it
    await page.evaluate(() => {
      let dateInput = document.querySelector("input#birthdate");
      dateInput.removeAttribute("max");
    });

    await page.focus("input#birthdate");
    await page.keyboard.type(dateString);
    await page.click("button#submitProfileData");

    //verify if invalid date error string is in the DOM
    //It will have errors because all the other input fields are passed empty to the server
    //so the ".msg-error" element will always appear
    await page.waitForSelector(".msg-error");
    const errorsText = await page.$eval(".msg-error", el => el.textContent);
    expect(errorsText).toContain("Date is not valid");
  }, 40000); //timeout 40secs

  //insert valid date
  test("should not create an element in DOM with certain text", async () => {
    const browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();
    await page.goto("http://localhost:3000");
    //login to be go to page with input[type="date"] element
    await page.type("input#email", keys.PUPPETEER_E2E_TEST_EMAIL);
    await page.type("input#password-field", keys.PUPPETEER_E2E_TEST_PASSWORD);
    await page.click("button#login-email-btn");
    await page.waitForSelector("input#birthdate");

    //submit data with valid date
    let year = 1990;
    let month = 7;
    let day = 24;
    let dateString = await page.evaluate(
      ({ year, month, day }) => {
        let date = new Date(year, month, day).toLocaleDateString(
          navigator.language,
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }
        );
        date = date.replace(/\//g, ""); //remove / from string containing date
        return date;
      },
      { year, month, day }
    );

    //not need to disable input[type="date"]#birthdate element clientside validation to bypass it
    //because date is valid

    await page.focus("input#birthdate");
    await page.keyboard.type(dateString);
    await page.click("button#submitProfileData");

    //verify if invalid date error string is not in the DOM
    await page.waitForSelector(".msg-error");
    const errorsText = await page.$eval(".msg-error", el => el.textContent);
    expect(errorsText).not.toContain("Date is not valid");
  }, 40000);
});
