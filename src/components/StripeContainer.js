import React from "react";
import PaymentPage from "./PaymentPage";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const PUBLIC_KEY = "pk_live_bYVNIkPB8GD7qb69N3SmysbF";

const stripeTestPromise = loadStripe(PUBLIC_KEY);

function StripeContainer({
  latestPrice,
  modalData,
  paymentCancel,
  paymentReady,
  showPayment,
  setShowPayment,
  initVotePoints,
  charName,
}) {
  return (
    <Elements stripe={stripeTestPromise}>
      <PaymentPage
        latestPrice={latestPrice}
        modalData={modalData}
        paymentCancel={paymentCancel}
        paymentReady={paymentReady}
        showPayment={showPayment}
        setShowPayment={setShowPayment}
        initVotePoints={initVotePoints}
        charName={charName}
      />
    </Elements>
  );
}

export default StripeContainer;
