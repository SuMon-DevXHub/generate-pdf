const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");

let puppeteer;
let executablePath;

app.use(cors()); // Allow all origins
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Handle preflight requests for CORS
app.options("*", cors()); // Handle CORS for all routes

const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `${process.env.DATABASE_URL}`;
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const dataBase = client.db("generate-pdf");
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Initialize Puppeteer function
async function initializePuppeteer() {
  puppeteer = await import("puppeteer");
  executablePath = puppeteer.executablePath();
}

// PDF generation route
app.post("/generate-pdf", async (req, res) => {
  await initializePuppeteer();

  const { html } = req.body;

  if (!html) {
    console.error("HTML content is missing");
    return res.status(400).send("HTML content is required");
  }

  const htmlContent = decodeURIComponent(html);
  let browser;

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Adjust args based on environment
      defaultViewport: null,
      executablePath, // Will use the correct path based on the environment
      ignoreHTTPSErrors: true,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(
      `
      <html>
        <head>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `,
      { waitUntil: "networkidle0" }
    );

    // await page.addStyleTag({
    //   content: `
    //   body {
    //       -webkit-print-color-adjust: exact;
    //       print-color-adjust: exact;
    //     }
    //   `,
    // });

    // // await page.emulateMediaType("screen");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="activity.pdf"');
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end(pdf, "binary");
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
