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

const { CommentStream } = require("snoostorm");

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

/* Create a stream that fetches the 10 results of the r/all every few seconds: */
const stream = new CommentStream(r, {
  subreddit: "all",
  results: 10,
  pollTime: 10000
});

/* Every time a comment gets added on subreddit: */
stream.on("item", async comment => {
  if ((await comment.created_utc) < awoken) return;
  /* Proceed only if the bot is mentioned: */

  if ((await comment.body) == "u/DoAnAnalysis") {
    await console.log("[" + comment.link_permalink + "] I was mentioned.");
    /* If the subreddit is located in the bot's knowledge base... */
    if (await knowledgeBase["subreddits"][comment.subreddit_name_prefixed]) {
      await console.log(
        comment.subreddit_name_prefixed +
          " is in my database. Sending reply (" +
          knowledgeBase["subreddits"][comment.subreddit_name_prefixed] +
          ")"
      );
      /* ...reply with the subreddit information from the retrived JSON: */
      await comment.reply(
        knowledgeBase["subreddits"][comment.subreddit_name_prefixed] +
          "\n\n^(I am a bot and this action was performed automatically | Check our) [^(GitHub repository)](https://github.com/CWKevo/Reddit-DoAnAnalysis) ^(to add your own descriptions to other subreddits.)"
      );
    } else if (
      await !knowledgeBase["subreddits"][comment.subreddit_name_prefixed]
    ) {
      await console.log(
        comment.subreddit_name_prefixed +
          " is not in my database. Consider adding it to support more subreddits."
      );
      await comment.reply(
        "This subreddit is not in my database yet.\n\n^(Perhaps you can help adding a description for this subreddit? Check our) [^(GitHub repository)](https://github.com/CWKevo/Reddit-DoAnAnalysis) ^(| Love? Hate?) [^(Send feedback)](https://www.reddit.com/r/DoAnAnalysis)^(!)"
      );
    }
  }

  // This one is maybe taken way too far:
  if ((await comment.body) == "u/DoAnAnalysis author") {
    await console.log("[" + comment.link_permalink + "] I was mentioned.");
    if (await knowledgeBase["users"]["u/" + comment.link_author]) {
      await console.log(
        comment.link_author +
          " is in my database. Sending reply (" +
          knowledgeBase["users"]["u/" + comment.link_author] +
          ")"
      );
      /* ...reply with the user information from the retrived JSON: */
      await comment.reply(
        knowledgeBase["users"]["u/" + comment.link_author] +
          "\n\n^(I am a bot and this action was performed automatically | Check our) [^(GitHub repository)](https://github.com/CWKevo/Reddit-DoAnAnalysis) ^(to add your own descriptions to other subreddits.)"
      );
    } else if (await !knowledgeBase["users"]["u/" + comment.link_author]) {
      await console.log(
        "u/" +
          comment.link_author +
          " is not in my database. Consider adding it to support more users."
      );
      await comment.reply(
        "This user is not in my database yet.\n\n^(Perhaps you can help adding a description for this user? Check our) [^(GitHub repository)](https://github.com/CWKevo/Reddit-DoAnAnalysis) ^(| Love? Hate?) [^(Send feedback)](https://www.reddit.com/r/DoAnAnalysis)^(!)"
      );
    }
  }
});
