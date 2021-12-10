const express = require("express");
const app = express();
const axios = require("axios");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_LIVE);
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post("/stripe/charge", cors(), async (req, res) => {
  console.log("stripe-route.js 9 | route reached", req.body);

  res.header("Access-Control-Allow-Origin", "*"); //todo

  try {
    let payment;

    if (req.body.payment_method_id) {
      payment = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "SGD", // todo, do it without hardcode
        payment_method: req.body.payment_method_id,
        payment_method_types: ["card"],
        confirmation_method: "manual",
        confirm: true,
        description: `Xctuality Voting System - ${req.body.charName}`,
        payment_method_options: {
          card: {
            request_three_d_secure: "any",
          },
        },
        metadata: {
          char_id: req.body.char_id,
          points: req.body.points,
          cust_name: req.body.cust_name,
          cust_email: req.body.cust_email,
          paymentIntentId: req.body.stripeTransactionId,
        },
      });
    }
    // This will be triggered, if it needs additional actions and confirmations
    else if (req.body.payment_intent_id) {
      payment = await stripe.paymentIntents.confirm(req.body.payment_intent_id);
      console.log(`---Payment Intents Confirmation---,${payment}`);
    }

    res.send(generateResponse(payment));
    // res.status(200); //todo

    console.log("Generate Response below 👇🏻");
    console.log(`Stripe Transaction ID: ${payment.id}`); //todo, this is the stripeTransactionId
    console.log(generateResponse(payment));
    console.log(generateResponse(payment).success); //true

    if (generateResponse(payment).success === true) {
      console.log("Call the Add Voting API over here 👈🏻"); //todo place the Add Voting API over here
      console.log(process.env.LIVE_MODE); //todo, remove it afterwards
      if (process.env.LIVE_MODE == 0) {
        console.log(payment);
      } else if (process.env.LIVE_MODE == 1) {
        // console.log("Add Voting API is triggered");
        const createVote = async () => {
          // if (req.body.points === 0) {
          //   return;
          // } else {
          const response = await axios.post(
            "https://voteapi.xctuality.com/createvote",
            {
              votedCharId: payment.metadata.char_id,
              points: payment.metadata.points,
              stripeTransactionId: payment.id,
              // stripeTransactionId: payment.payment_method,
              // stripeTransactionId: stripeTransactionId,
              customerEmail: payment.metadata.cust_email,
              customerName: payment.metadata.cust_name,
            }
          );
          console.log(response.data);
          // console.log(payment.payment_method);
          // }
        };
        createVote();
      }
    }
  } catch (error) {
    return res.send({ error: error.message });
  }
});

// Functions to generate response based on different status
const generateResponse = (payment) => {
  if (
    payment.status === "requires_source_action" ||
    payment.status === "requires_action"
  ) {
    // Tell the client to handle the action
    return {
      requires_action: true,
      payment_intent_client_secret: payment.client_secret,
    };
  } else if (payment.status === "succeeded") {
    // The payment didn’t need any additional actions and completed!
    // Handle post-payment fulfillment
    return {
      success: true,
    };
  } else {
    // Invalid Status
    return {
      error: "Invalid PaymentIntent Status",
    };
  }
};

app.listen(7000, () => {
  console.log("Server started...");
});
