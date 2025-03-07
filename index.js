const express = require("express");
const axios = require("axios");
const { simpleParser } = require("mailparser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Endpoint to process .eml file from a given URL
app.post("/upload", async (req, res) => {
  const { url } = req.body;
  

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Download the .eml file from the provided URL
    const response = await axios.get(url, { responseType: "arraybuffer" });
    
    // Parse the email content
    simpleParser(response.data, (err, parsed) => {
      if (err) return res.status(500).json({ error: "Error parsing email" });

      // Extract attachments that are explicitly marked as "attachment"
      const attachments = parsed.attachments
        .filter((attachment) => attachment.contentDisposition === "attachment")
        .map((attachment) => ({
          filename: attachment.filename,
          contentType: attachment.contentType,
          content: attachment.content.toString("base64"), // Convert to Base64
        }));

      // Construct email response
      const emailData = {
        to: parsed.to?.text,
        from: parsed.from?.text,
        subject: parsed.subject || "(No Subject)",
        date: parsed.date,
        cc: parsed.cc ? parsed.cc.text : null,
        bcc: parsed.bcc ? parsed.bcc.text : null,
        body: parsed.html,
        attachments: attachments,
      };

      res.json(emailData);
    });
  } catch (error) {
    console.error("Error downloading .eml file:", error.message);
    res.status(500).json({ error: "Failed to download or process .eml file" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
