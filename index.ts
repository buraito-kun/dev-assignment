import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";

dotenv.config();
const app: Application = express();
const port = parseInt(`${process.env.PORT}`) || 3000;
const TOKEN = process.env.LINE_ACCESS_TOKEN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

interface Meaning {
  partOfSpeech: string;
  definitions: [
    {
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }
  ];
  synonyms: string[];
  antonyms: string[];
}

app.get("/", (req: Request, res: Response) => {
  res.send("ok.");
});

app.post("/webhook", async (req: Request, res: Response) => {
  res.sendStatus(200)
  if (req.body.events[0]?.type === "message") {
    // get definition from dictionary api
    const result = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${req.body.events[0].message.text}`
    );
    let message = "";
    if (!result.ok) {
      message = "Failed to fetch data";
    } else {
      const meanings = (await result.json())[0]["meanings"];
      meanings.map((data: Meaning) => {
        if (data.partOfSpeech === "noun" || data.partOfSpeech === "verb") {
          // make first character uppercase in part of speech
          message += `■${String(data.partOfSpeech).charAt(0).toUpperCase() + String(data.partOfSpeech).slice(1)}: ${data.definitions[0].definition}\n`;
        }
      });
      // remove \n from last line
      message = message.slice(0, -1);
    }

    // prepare body content for reply message
    const dataString = JSON.stringify({
      replyToken: req.body.events[0].replyToken,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    });

    // prepare header for reply message
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`,
    };

    // send message to endpoint
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: headers,
      body: dataString,
    });
  }
});

app.listen(port, () => {
  console.log(`Line bot listening on port ${port}`);
});
