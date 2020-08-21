const awoken = Date.now() / 1000;

/* Initialize dependencies: */
// I know I can do comments like this, but
/* this just looks nicer. */

const { CommentStream } = require("snoostorm");

const request = require("request");

/* Fetch the knowledge base: */
let knowledgeBase;

function getJSON(url, callback) {
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
  function(body) {
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
const stream = new CommentStream(r, { subreddit: "DoAnAnalysis", results: 10 });

/* Every time a comment gets added on subreddit: */
stream.on("item", async comment => {
  if (comment.created_utc < awoken) return;
  /* Proceed only if the bot is mentioned: */

  if ((await comment.body) == "u/DoAnAnalysis") {
    console.log("I was mentioned.");
    /* If the subreddit is located in the bot's knowledge base... */
    if (knowledgeBase["subreddits"][comment.subreddit_name_prefixed]) {
      console.log(
        comment.subreddit_name_prefixed +
          " is in my database. Sending reply (" +
          knowledgeBase["subreddits"][comment.subreddit_name_prefixed] +
          ")"
      );
      /* ...reply with the subreddit information from the retrived JSON: */
      comment.reply(
        knowledgeBase["subreddits"][comment.subreddit_name_prefixed]
      );
    } else if (!knowledgeBase["subreddits"][comment.subreddit_name_prefixed]) {
      console.log(
        comment.subreddit_name_prefixed +
          " is not in my database. Consider adding it to support more subreddits."
      );
      comment.reply(
        "This subreddit is not in my database yet.\n\n^(Perhaps you can help adding a description for this subreddit? Check our) [^(GitHub repository)](https://github.com/CW_Kevo/Reddit-DoAnAnalysis) ^(| Love? Hate?) [^(Send feedback)](https://www.reddit.com/r/DoAnAnalysis)^(!)"
      );
    }
  }

  // This one is maybe taken way too far:
  if ((await comment.body) == "u/DoAnAnalysis author") {
    if (knowledgeBase["users"]["u/" + comment.link_author]) {
      console.log(
        comment.link_author +
          " is in my database. Sending reply (" +
          knowledgeBase["users"]["u/" + comment.link_author] +
          ")"
      );
      /* ...reply with the user information from the retrived JSON: */
      comment.reply(knowledgeBase["users"]["u/" + comment.link_author]);
    } else if (!knowledgeBase["users"]["u/" + comment.link_author]) {
      console.log(
        "u/" +
          comment.link_author +
          " is not in my database. Consider adding it to support more users."
      );
      comment.reply(
        "This user is not in my database yet.\n\n^(Perhaps you can help adding a description for this user? Check our) [^(GitHub repository)](https://github.com/CW_Kevo/Reddit-DoAnAnalysis) ^(| Love? Hate?) [^(Send feedback)](https://www.reddit.com/r/DoAnAnalysis)^(!)"
      );
    }
  }
});
