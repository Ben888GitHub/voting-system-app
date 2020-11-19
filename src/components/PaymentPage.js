import React, { useState } from "react";
import axios from "axios";
import {
  Button,
  Form,
  Card,
  Col,
  Row,
  Modal,
  Toast,
  Alert,
  Spinner,
} from "react-bootstrap";
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

  // todo, this is for cancelling payment
  const cancelPayment = () => {
    setShowPayment(false);
  };

  // todo, this is for Payment Result (Success / Failure)
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
    setShowPayment(false); //todo
  };
  const closeSuccess = () => setShowSuccess(false);

  const [showFailure, setShowFailure] = useState(false);
  const openFailure = () => {
    setShowFailure(true);
    setShowPayment(false); //todo
  };
  const closeFailure = () => setShowFailure(false);

  const [errorCode, setErrorCode] = useState("");

  const [amountVal, setAmountVal] = useState(0);

  const [finalVotePoints, setFinalVotePoints] = useState(0);

  const [disabledButton, setDisabledButton] = useState(false);

  const [loadPayment, setLoadPayment] = useState("Complete Payment");

  const [showSpinner, setShowSpinner] = useState(false);

  const CARD_OPTIONS = {
    // iconStyle: "solid",
    style: {
      // border: "2px solid red",
      base: {
        // iconColor: "#c4f0ff",
        // borderColor: "black",
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

  // Executing the Stripe Payment Intent API endpoint as well as CreateVote API endpoint
  const setVotingPointAfterConfirmation = async (
    paymentIntentId,
    billDetails
  ) => {
    const result = await axios.post(
      //   "https://voting-payments.xctuality.com/stripe/charge",
      "http://localhost:7000/stripe/charge",
      {
        amount: latestPrice * 100,
        // id: paymentMethodId.id, //todo
        char_id: modalData.id, //todo
        points: initVotePoints,
        charName: charName,
        stripeTransactionId: paymentIntentId,
        cust_name: billDetails.name,
        cust_email: billDetails.email,
      }
    );
    console.log(result.data);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Collect Card Details
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
      billing_details: billingDetails,
    });

    if (!error) {
      setDisabledButton(true);
      setStaticValue("static"); //todo, this makes the Modal backdrop become static
      setLoadPayment("Processing...");
      setShowSpinner(true);

      try {
        const response = await axios.post(
          //   "https://voting-payments.xctuality.com/stripe/charge",
          "http://localhost:7000/stripe/charge",
          {
            amount: latestPrice * 100,
            id: paymentMethod.id,
            char_id: modalData.id, //todo
            points: finalVotePoints,
            charName: charName,
          }
        );

        await stripe
          .confirmCardPayment(response.data.client_secret, {
            payment_method: paymentMethod.id,
          })
          .then((payload) => {
            if (payload.error) {
              setFinalVotePoints(0);
              setErrorCode(payload.error.code);

              openFailure();
              setStaticValue("non-static");
              setLoadPayment("Complete Payment");
              setDisabledButton(false);
              setShowSpinner(false);
              setBillingDetails({
                name: "",
                email: "",
              });
            } else {
              setAmountVal(latestPrice * 100);
              console.log(billingDetails);
              setVotingPointAfterConfirmation(
                payload.paymentIntent.id,
                billingDetails
              );
              setStaticValue("non-static");
              openSuccess();
              setLoadPayment("Complete Payment");
              setDisabledButton(false);
              setShowSpinner(false);
              setBillingDetails({
                name: "",
                email: "",
              });
            }
          });
      } catch (error) {
        toggleAlert();
        setStaticValue("non-static");
        setLoadPayment("Complete Payment");
        setDisabledButton(false);
        setShowSpinner(false);
      }
    } else {
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
          <form onSubmit={handleSubmit}>
            <Form.Group controlId="formBasicEmail">
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
        {/* <Button onClick={hidePayment}>Pay</Button> */}
      </Modal>

      <div>
        <Modal
          show={showSuccess}
          // onHide={closeResult}
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
          <h1>${Math.round(amountVal / 100).toFixed(2)}</h1>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              style={{ fontWeight: "600", width: "65%", marginTop: 30 }}
              variant="success"
              onClick={() => {
                // window.location.reload(false);
                closeSuccess();
              }}
            >
              Done
            </Button>
          </div>
          <br />
          <br />

          {/* <Modal.Header closeButton>
          <h2>Payment Result</h2>
        </Modal.Header> */}
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
            {/* <br /> */}
            Please check your payment details and try again.
          </Modal.Body>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              style={{ fontWeight: "600", width: "65%", marginTop: 30 }}
              variant="danger"
              onClick={() => {
                // window.location.reload(false);
                closeFailure();
              }}
            >
              OK
            </Button>
          </div>
          <br />
          <br />

          {/* <Modal.Header closeButton>
          <h2>Payment Result</h2>
        </Modal.Header> */}
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
