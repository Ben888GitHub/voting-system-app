import React, { useState, useEffect } from "react";
import "./CharacterList.css";
import { Navbar, Image, Button, Modal, Card } from "react-bootstrap";
import IconButton from "@material-ui/core/IconButton";
import AddCircleRoundedIcon from "@material-ui/icons/AddCircleRounded";
import RemoveCircleRoundedIcon from "@material-ui/icons/RemoveCircleRounded";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import MrWorldLogo from "../images/MrWorlLogo.png";
import axios from "axios";
import StripeContainer from "./StripeContainer";
import PaymentPage from "./PaymentPage";

function CharacterList() {
  const [show, setShow] = useState(false);

  const [charData, setCharData] = useState([]);

  const [modalData, setModalData] = useState({});
  const [initVotePoints, setInitVotePoints] = useState(1);
  const [totalVotePoints, setTotalVotePoints] = useState(0);
  const [initialPrice, setInitialPrice] = useState(11); // 1 vote = $11.00
  const [newPrice, setNewPrice] = useState(0);
  const latestPrice = newPrice + initialPrice;

  const [showPayment, setShowPayment] = useState(false);

  const [showReset, setShowReset] = useState(false);

  const [justifyCenter, setJustifyCenter] = useState("");

  useEffect(() => {
    const fetchAllCharacters = async () => {
      const response = await axios.get(
        "https://voteapi.xctuality.com/characters"
      );
      setCharData(response.data.data);
    };
    fetchAllCharacters();
  }, []);

  const handleClose = () => setShow(false);
  const handleShow = async (value) => {
    setShow(true);
    setModalData(value);
    const queryId = await axios.get(
      `https://voteapi.xctuality.com/votes/${value.id}`
    );
    setTotalVotePoints(queryId.data.data);
  };

  // Once the Process Payment Modal Start, then Voting Modal will close
  const paymentReady = () => {
    setShowPayment(true);
    handleClose();
  };
  const paymentCancel = () => setShowPayment(false);

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
      slidesToSlide: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
      slidesToSlide: 2, // optional, default to 1.
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      slidesToSlide: 1, // optional, default to 1.
    },
  };

  const ResetButton = () => {
    return (
      <Button
        onClick={() => {
          setInitVotePoints(1);
          setNewPrice(0);
          setShowReset(false);
        }}
        style={{
          fontSize: 16,
          fontWeight: "600",
          height: 30,
          marginTop: 12.5,
          borderRadius: 15,
          paddingTop: 2,
        }}
        variant="dark"
      >
        Reset
      </Button>
    );
  };

  return (
    <div>
      <Navbar bg="dark" className="navbar-height"></Navbar>
      <h1 className="top-voting-header">
        VOTE TODAY
        <Image className="mr-world-logo" src={MrWorldLogo} />1 DECEMBER
      </h1>
      <Carousel
        swipeable={true}
        draggable={false}
        showDots={true}
        responsive={responsive}
        ssr={true}
        infinite={false} //todo
        arrows={true}
        autoPlaySpeed={1000}
        keyBoardControl={true}
        customTransition="all .5"
        transitionDuration={500}
        containerClass={`carousel-container`}
        dotListClass="custom-dot-list-style"
        itemClass="carousel-item-padding-40-px"
      >
        {charData.map((value) => {
          return (
            <div key={value}>
              <Image className="character-image" src={value.charImg} />
              <br />
              <div
                style={{ marginTop: -130 }}
                className="col d-flex justify-content-center"
              >
                <Card className="card-style-main">
                  <Card.Body>
                    <h5 className="character-name-card">{value.charName}</h5>
                    <Button
                      variant="secondary"
                      onClick={() => handleShow(value)}
                    >
                      See Profile
                    </Button>
                  </Card.Body>
                </Card>
              </div>
              <br />
              <br />
            </div>
          );
        })}
      </Carousel>
      <Modal show={show} onHide={handleClose} keyboard={true}>
        <Modal.Header closeButton>
          <h3 className="character-name-card modal-title w-100 text-center">
            {modalData.charName}
          </h3>
        </Modal.Header>

        <h5
          style={{ fontWeight: "bold", marginTop: 5 }}
          className="modal-title w-100 text-center"
        >
          Current Votes: {totalVotePoints}
        </h5>
        <Modal.Body className="modal-title w-100 text-center">
          {modalData.charBio}
        </Modal.Body>
        <Image className="modal-character-image" src={modalData.charImg} />
        <div className="button-style-main">
          <IconButton
            aria-label="remove"
            onClick={() => {
              if (initVotePoints > 1) {
                setInitVotePoints(initVotePoints - 1);
                setNewPrice(newPrice - 11);
                // setShowReset(false);
              }
            }}
          >
            <RemoveCircleRoundedIcon className="button-decrement" />
          </IconButton>

          <h5 style={{ marginTop: 14 }}>Your Vote: {initVotePoints}</h5>

          <IconButton
            aria-label="add"
            onClick={() => {
              if (initVotePoints < 50) {
                setInitVotePoints(initVotePoints + 1);
                setNewPrice(initialPrice * initVotePoints);
                if (initVotePoints > 0) {
                  setShowReset(true);
                }
              }
            }}
          >
            <AddCircleRoundedIcon style={{ fontSize: 30, color: "#333B3F" }} />
          </IconButton>
          {showReset ? <ResetButton /> : null}
        </div>

        <div className="button-vote-position">
          <Button onClick={paymentReady} variant="dark" className="button-vote">
            VOTE ${Math.round(initialPrice).toFixed(2) * initVotePoints}
          </Button>
        </div>
      </Modal>
      {/* <Modal>

      </Modal> */}
      <StripeContainer
        latestPrice={latestPrice}
        modalData={modalData}
        paymentCancel={paymentCancel}
        paymentReady={paymentReady}
        showPayment={showPayment}
        setShowPayment={setShowPayment}
        initVotePoints={initVotePoints}
        charName={modalData.charName}
      />
    </div>
  );
}

export default CharacterList;