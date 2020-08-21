const awoken = Date.now() / 1000;

/* Initialize dependencies: */
// I know I can do comments like this, but
/* this just looks nicer. */

const express = require("express");
const app = express();

/* Send "OK" response: */
app.get("/", async function(request, response) {
  await response.sendStatus(200);
});

/* Send message about an app listening: */
let listener = app.listen(process.env.PORT, async function() {
  await console.log(
    "Your app is listening on port " + listener.address().port + " :')"
  );
});

const { InboxStream } = require("snoostorm");

const request = require("request");

/* Fetch the knowledge base: */
let knowledgeBase;

async function getJSON(url, callback) {
  request(
    {
      url: url,
      json: true
    },
    function(error, response, body) {
      if (!error && response.statusCode === 200) {
        callback(body);
      }
    }
  );
}

getJSON(
  "http://raw.githubusercontent.com/CWKevo/Reddit-DoAnAnalysis/master/daa-knowledge-base.json",
  async function(body) {
    knowledgeBase = body;
  }
);

const Snoowrap = require("snoowrap");
const Snoostorm = require("snoostorm");

/* Create a Reddit user with credentials: */

const r = new Snoowrap({
  userAgent: "do-an-analysis-bot",
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.USERNAME,
  password: process.env.PASSWORD
});

/* This creates a new InboxStream that fetches mentions from the inbox */
const inbox = new InboxStream(r);
inbox.on("item", async inbox => {
  /* Ignore all mentions that were created before the bot "awakened" (this prevents replying to old mentions before "now") */
  if ((await inbox.created_utc) < awoken) {
    return;
  }
  if ((await inbox.body) == "u/DoAnAnalysis") {
    await console.log(
      "[https://reddit.com" + inbox.context + "] I was mentioned."
    );
    /* If the subreddit is located in the bot's knowledge base... */
    if (await knowledgeBase["subreddits"][inbox.subreddit_name_prefixed]) {
      await console.log(
        inbox.subreddit_name_prefixed +
          " is in my database. Sending reply (" +
          knowledgeBase["subreddits"][inbox.subreddit_name_prefixed] +
          ")"
      );
      /* ...reply with the subreddit information from the retrived JSON: */
      await inbox.reply(
        knowledgeBase["subreddits"][inbox.subreddit_name_prefixed] +
          "\n\n^(I am a bot and this action was performed automatically | Check our) [^(GitHub repository)](https://github.com/CWKevo/Reddit-DoAnAnalysis) ^(to add your own descriptions to other subreddits.)"
      );
    } else if (
      await !knowledgeBase["subreddits"][inbox.subreddit_name_prefixed]
    ) {
      await console.log(
        inbox.subreddit_name_prefixed +
          " is not in my database. Consider adding it to support more subreddits."
      );
      await inbox.reply(
        "This subreddit is not in my database yet.\n\n^(Perhaps you can help adding a description for this subreddit? Check our) [^(GitHub repository)](https://github.com/CWKevo/Reddit-DoAnAnalysis) ^(| Love? Hate?) [^(Send feedback)](https://www.reddit.com/r/DoAnAnalysis)^(!)"
      );
    }
  }

  // This one is maybe taken way too far:
  if ((await inbox.body) == "u/DoAnAnalysis author") {
    await console.log(
      "[https://reddit.com" + inbox.context + "] I was mentioned."
    );
    if (await knowledgeBase["users"]["u/" + inbox.author.name]) {
      await console.log(
        inbox.author.name +
          " is in my database. Sending reply (" +
          knowledgeBase["users"]["u/" + inbox.author.name] +
          ")"
      );
      /* ...reply with the user information from the retrived JSON: */
      await inbox.reply(
        knowledgeBase["users"]["u/" + inbox.author.name] +
          "\n\n^(I am a bot and this action was performed automatically | Check our) [^(GitHub repository)](https://github.com/CWKevo/Reddit-DoAnAnalysis) ^(to add your own descriptions to other subreddits.)"
      );
    } else if (await !knowledgeBase["users"]["u/" + inbox.author.name]) {
      await console.log(
        "u/" +
          inbox.author.name +
          " is not in my database. Consider adding it to support more users."
      );
      await inbox.reply(
        "This user is not in my database yet.\n\n^(Perhaps you can help adding a description for this user? Check our) [^(GitHub repository)](https://github.com/CWKevo/Reddit-DoAnAnalysis) ^(| Love? Hate?) [^(Send feedback)](https://www.reddit.com/r/DoAnAnalysis)^(!)"
      );
    }
  }
});
