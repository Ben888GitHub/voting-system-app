import React, { useState } from "react";
import axios from "axios";
import { Button, Form, Modal, Toast, Alert, Spinner } from "react-bootstrap";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import CancelRoundedIcon from "@material-ui/icons/CancelRounded";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

function PaymentPage({
  latestPrice,
  modalData,
  paymentReady,
  paymentCancel,
  showPayment,
  setShowPayment,
  initVotePoints,
  charName,
}) {
  const [showResult, setShowResult] = useState(false);

  const openResult = () => setShowResult(true);
  const closeResult = () => setShowResult(false);

  const [staticValue, setStaticValue] = useState("non-static");

  const cancelPayment = () => {
    setShowPayment(false);
  };

  const hidePayment = () => {
    setShowPayment(false);
    openResult();
  };

  const stripe = useStripe();
  const elements = useElements();

  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
  });

  const [showAlert, setShowAlert] = useState(false);
  const toggleAlert = () => setShowAlert(true);
  const closeAlert = () => setShowAlert(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const openSuccess = () => {
    setShowSuccess(true);
    setShowPayment(false);
  };
  const closeSuccess = () => setShowSuccess(false);

  const [showFailure, setShowFailure] = useState(false);
  const openFailure = () => {
    setShowFailure(true);
    setShowPayment(false);
  };
  const closeFailure = () => setShowFailure(false);

  const [errorCode, setErrorCode] = useState("");

  const [amountVal, setAmountVal] = useState(0);

  const [finalVotePoints, setFinalVotePoints] = useState(0);

  const [disabledButton, setDisabledButton] = useState(false);

  const [loadPayment, setLoadPayment] = useState("Complete Payment");

  const [showSpinner, setShowSpinner] = useState(false);

  const [paymentIntentId, setPaymentIntentId] = useState("");

  const CARD_OPTIONS = {
    style: {
      base: {
        color: "#000",
        backgroundColor: "white",
        fontWeight: 500,
        fontFamily: "Roboto, Open Sans, Segoe UI, sans-serif",
        fontSize: "18px",
        fontSmoothing: "antialiased",
        ":-webkit-autofill": {
          color: "#fce883",
        },

        ":focus::placeholder": {
          color: "#fff",
        },
        invalid: {
          color: "#fa755a",
          iconColor: "#fa755a",
        },
      },
    },
  };

  // The Spinner Component
  const SpinnerComponent = () => {
    return (
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
      />
    );
  };

  const theHandleSubmit = async (event) => {
    event.preventDefault();

    // todo, console.log() the result to check what does it output
    const result = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
      billing_details: billingDetails,
    });

    if (!result.error) {
      console.log("Stripe 23 | Token Generated", result.paymentMethod);
      console.log(result.paymentMethod.id);
      setDisabledButton(true);
      setStaticValue("static");
      setLoadPayment("Processing...");
      setShowSpinner(true);

      try {
        const response = await axios.post(
          "https://voting-payments.xctuality.com/stripe/charge",
          {
            amount: latestPrice * 100,
            payment_method_id: result.paymentMethod.id,
            points: initVotePoints,
            char_id: modalData.id,
            charName: charName,
            // stripeTransactionId: paymentIntentId, //todo
            cust_name: billingDetails.name,
            cust_email: billingDetails.email,
          }
        );
        console.log(response.data);
        if (response.data.error) {
          console.log(response.data.error);
          setErrorCode(response.data.error);
          openFailure();
          setDisabledButton(false);
          setStaticValue("non-static");
          setLoadPayment("Complete Payment");
          setShowSpinner(false);
          setBillingDetails({
            name: "",
            email: "",
          });
        }

        if (response.data.requires_action) {
          console.log(response.data);
          console.log(response.data.requires_action);
          console.log(response.data.payment_intent_client_secret);
          stripe
            .handleCardAction(response.data.payment_intent_client_secret)
            .then((data) => {
              if (data.error) {
                console.log(data.error);
                console.log(
                  "Your card was not authenticated, please try again"
                );
                setErrorCode(
                  "Your card was not authenticated, please try again"
                );
                openFailure();
                setDisabledButton(false);
                setStaticValue("non-static");
                setLoadPayment("Complete Payment");
                setShowSpinner(false);
                setBillingDetails({
                  name: "",
                  email: "",
                });
              } else if (
                data.paymentIntent.status === "requires_confirmation"
              ) {
                console.log(data.paymentIntent.id);
                // setPaymentIntentId(data.paymentIntent.id); //todo

                const responsePayment = async () => {
                  await axios
                    .post(
                      "https://voting-payments.xctuality.com/stripe/charge",
                      {
                        payment_intent_id: data.paymentIntent.id,
                      }
                    )
                    .then((output) => {
                      if (!output) {
                        console.log("Payment error");
                      } else {
                        console.log(output);
                        console.log(output.data); // {success: true}
                        console.log(output.config.data); //this represents the paymentIntent id
                        // console.log(response.data.payment_intent_client_secret);

                        if (!output.data.error) {
                          console.log("3D Secure Payment Successful");
                          // setPaymentIntentId(data.paymentIntent.id); //todo
                          openSuccess();
                          setDisabledButton(false);
                          setStaticValue("non-static");
                          setLoadPayment("Complete Payment");
                          setShowSpinner(false);
                          setBillingDetails({
                            name: "",
                            email: "",
                          });
                        }
                        if (output.data.error) {
                          // setPaymentIntentId(data.paymentIntent.id); //todo
                          console.log("3D Secure Payment Failure");
                          setErrorCode(output.data.error);
                          openFailure();
                          setDisabledButton(false);
                          setStaticValue("non-static");
                          setLoadPayment("Complete Payment");
                          setShowSpinner(false);
                          setBillingDetails({
                            name: "",
                            email: "",
                          });
                        }
                      }
                    });
                };
                responsePayment();
              }
            });
        }

        if (response.data.success) {
          console.log("CheckoutForm.js 25 | payment successful!");
          openSuccess();
          setDisabledButton(false);
          setStaticValue("non-static");
          setLoadPayment("Complete Payment");
          setShowSpinner(false);
          setBillingDetails({
            name: "",
            email: "",
          });
        }
        if (!response.data.success) {
          console.log("Payment Intent Process...");
        }
      } catch (error) {
        console.log(error.message);
        toggleAlert();
        setStaticValue("non-static");
        setLoadPayment("Complete Payment");
        setDisabledButton(false);
        setShowSpinner(false);
      }
    } else {
      console.log(result.error.message);
      toggleAlert();
      setStaticValue("non-static");
      setLoadPayment("Complete Payment");
      setDisabledButton(false);
      setShowSpinner(false);
    }
  };

  return (
    <div>
      <Modal
        show={showPayment}
        onHide={cancelPayment}
        keyboard={true}
        backdrop={staticValue}
      >
        <Modal.Header closeButton>
          <Modal.Title>Process Payment</Modal.Title>
        </Modal.Header>
        <div
          style={{
            padding: 40,
          }}
        >
          {/* <form onSubmit={handleSubmit}> */}
          <form onSubmit={theHandleSubmit}>
            <Form.Group>
              <Form.Label style={{ fontWeight: 500 }}>
                Cardholder Name
              </Form.Label>
              <Form.Control
                value={billingDetails.name}
                onChange={(e) => {
                  setBillingDetails({
                    ...billingDetails,
                    name: e.target.value,
                  });
                }}
                type="text"
                placeholder="Cardholder Name"
                required
                autocomplete="name"
              />
            </Form.Group>

            <Form.Group controlId="formBasicEmail">
              <Form.Label style={{ fontWeight: 500 }}>Email</Form.Label>
              <Form.Control
                value={billingDetails.email}
                onChange={(e) => {
                  setBillingDetails({
                    ...billingDetails,
                    email: e.target.value,
                  });
                }}
                type="email"
                placeholder="Email"
                required
              />
            </Form.Group>

            <h5 style={{ marginTop: 20 }}>Card Details</h5>
            <div
              style={{
                borderStyle: "solid",
                borderColor: "#CED4D9",
                borderWidth: 1.8,
                borderRadius: 2,
                padding: 5,
              }}
            >
              <CardElement
                onReady={(el) => el.focus()}
                options={CARD_OPTIONS}
              />
            </div>
            <br />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                disabled={disabledButton}
                variant="dark"
                type="submit"
                style={{ width: "50%", fontWeight: 600 }}
              >
                {loadPayment}
                {showSpinner ? <SpinnerComponent /> : null}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <div>
        <Modal
          show={showSuccess}
          onHide={closeSuccess}
          keyboard={true}
          backdrop={staticValue}
          style={{
            textAlign: "center",
          }}
        >
          <br />
          <br />
          <CheckCircleRoundedIcon
            style={{
              width: 80,
              height: 80,
              color: "#27A844",
              alignSelf: "center",
            }}
          />
          <h3 style={{ color: "#27A844", marginTop: 15 }}>
            Payment Successful
          </h3>
          <Modal.Body style={{ fontWeight: "600" }}>
            You have successfully given {initVotePoints} vote(s) to {charName}{" "}
          </Modal.Body>
          <h1>${Math.round(latestPrice).toFixed(2)}</h1>
          {/* <h1>${latestPrice}</h1> */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              style={{ fontWeight: "600", width: "65%", marginTop: 30 }}
              variant="success"
              onClick={() => {
                closeSuccess();
              }}
            >
              Done
            </Button>
          </div>
          <br />
          <br />
        </Modal>
      </div>

      <div
        style={{ display: "flex", justifyContent: "center", height: "900%" }}
      >
        <Modal
          show={showFailure}
          // onHide={closeResult}
          onHide={closeFailure}
          keyboard={true}
          backdrop={staticValue}
          style={{
            textAlign: "center",
          }}
        >
          <br />
          <br />
          <CancelRoundedIcon
            style={{
              width: 80,
              height: 80,
              color: "#DC3544",
              alignSelf: "center",
            }}
          />
          <h3 style={{ color: "#DC3544", marginTop: 15 }}>Payment Failure</h3>
          <h4>
            Sorry, we are unable to process <br /> your payment
          </h4>

          <Modal.Body style={{ fontWeight: "500", fontSize: 18 }}>
            Your bank replied with this error:{" "}
            <p style={{ color: "#DC3544" }}>{errorCode}</p>
            Please check your payment details and try again.
          </Modal.Body>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              style={{ fontWeight: "600", width: "65%", marginTop: 30 }}
              variant="danger"
              onClick={() => {
                closeFailure();
              }}
            >
              OK
            </Button>
          </div>
          <br />
          <br />
        </Modal>
      </div>

      <Modal show={showAlert} onHide={closeAlert} keyboard={false}>
        <Alert
          show={showAlert}
          variant="danger"
          onClose={() => setShowAlert(false)}
          dismissible
        >
          <Alert.Heading>Please verify your input details</Alert.Heading>
        </Alert>
      </Modal>
    </div>
  );
}

export default PaymentPage;
