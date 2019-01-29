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
const NUM_TWEETS = 3;
const TARGETS = [
    { name: "Sylvania", stance: "support" },
    { name: "Ambassador Trentino", stance: "support" },
    { name: "Freedonia", stance: "oppose" },
    { name: "Rufus T. Firefly", stance: "oppose" }
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

const evaluateTweet = (tweetContent, tweetSentiment, thing, shouldSupport) => {
    if (tweetContent.toLowerCase().includes(thing.toLowerCase())) {
        if (shouldSupport) {
            return (tweetSentiment === "positive" ? "positive" : "negative");
        } else {
            return (tweetSentiment === "positive" ? "negative" : "positive");
        }
    }

    return "neutral";
};

const main = async () => {
    // get all recent tweets
    let tweets = await getTweets(NUM_TWEETS, TARGET_HANDLE);

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

        // post a reply with the matching sentiment; if neutral, do not reply
        if (response === "positive") {
            console.log("we are happy with this tweet 👍");
        } else if (response === "negative") {
            console.log("we are not happy about this tweet 😡");
        } else {
            console.log("we are neutral about this tweet 🤷‍");
        }
    });
};

main();