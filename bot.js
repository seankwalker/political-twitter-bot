/*
 * bot.js
 *
 * Name:  Sean Walker
 * NetID: skw34
 *
 * CPSC 310, Spring 2019
 * Homework 1
 *
 * Implements a Twitter bot.
 */

// API configuration
const config = require("./config.js");

// npm Twitter API client
const twit = require("twit");
const twitterClient = new twit(config);

// sentiment analysis
const sentiment = require("sentiment");
const sentimentAnalyzer = new sentiment();

// bot parameters
const TARGET_HANDLE = "FreedoniaNews";
const NUM_TWEETS = 200;
const TARGETS = [
    { name: "Sylvania", stance: "support" },
    { name: "Ambassador Trentino", stance: "support" },
    { name: "Freedonia", stance: "oppose" },
    { name: "Rufus T. Firefly", stance: "oppose" }
];
const REPLIES = [
    "stop spreading fake news! 😑👎",
    "fake news. please ban this account!! @jack 🔨",
    "lies! lies! lies! 🤬",
    "there's not an ounce of truth to this!!",
    "try posting something truthful once in a while #hottip #deleteyouraccount"
];

/*
 * Get `numTweets` tweets from `accountName`.
 * On error, returns `null`.
 */
const getTweets = (numTweets, accountName) => {
    return new Promise(resolve => {
        twitterClient.get(
            "statuses/user_timeline",
            {
                screen_name: accountName,
                count: numTweets
            },
            (err, data) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(data);
                }
            }
        );
    });
};

/*
 * Classifies `tweetContent` as either "positive," "negative," or "neutral"
 * sentiment.
 */
const analyzeSentiment = (tweetContent) => {
    if (!tweetContent) {
        return "neutral";
    }

    let sentiment = sentimentAnalyzer.analyze(tweetContent).score;
    if (sentiment > 0) {
        return "positive";
    } else if (sentiment < 0) {
        return "negative";
    } else {
        return "neutral";
    }
};

/*
 * Evaluates our response to a given tweet based on tweet sentiment and our
 * feeling about the subject of the tweet.
 */
const evaluateTweet = (tweetContent, tweetSentiment, subject, support) => {
    if (tweetContent.toLowerCase().includes(subject.toLowerCase())) {
        if (support) {
            return (tweetSentiment === "positive" ? "positive" : "negative");
        } else {
            return (tweetSentiment === "positive" ? "negative" : "positive");
        }
    }

    return "neutral";
};

/*
 * Tweet reply to `targetTweet` authored by `targetTweetUsername`.
 */
const tweetReply = (targetTweetUsername, targetTweetId) => {
    // choose random message from pre-written replies
    let replyMessage = "@" + targetTweetUsername + " ";
    replyMessage += REPLIES[Math.floor(Math.random() * REPLIES.length)];

    twitterClient.post("statuses/update", {
        status: replyMessage,
        in_reply_to_status_id: targetTweetId
    });
};

/*
 * Main function.
 */
const main = async () => {
    // get all recent tweets
    let tweets = await getTweets(NUM_TWEETS, TARGET_HANDLE);
    if (tweets === null) {
        return;
    }

    // analyze sentiment of each retrieved tweet
    tweets.forEach(tweet => {
        let tweetSentiment = analyzeSentiment(tweet.text);

        // check if we support or oppose the figure this tweet is about
        // as per the spec, each tweet will be unambiguously directed at a
        // single figure
        // thus, we can break as soon as we discover a non-neutral take
        let response = "neutral";
        TARGETS.some(target => {
            response = evaluateTweet(tweet.text.toLowerCase(), tweetSentiment,
                target.name, (target.stance === "support"));
            return response !== "neutral";
        });

        // post a reply if we feel negatively about this tweet
        if (response === "negative") {
            tweetReply(tweet.user.screen_name, tweet.id_str);
        }
    });
};

main();