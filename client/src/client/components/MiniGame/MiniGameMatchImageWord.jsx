import React, { useState } from "react";
import { Button, Row, Col, Card, Alert } from "react-bootstrap";

const MiniGameMatchImageWord = ({ data, onNext }) => {
  // Lưu state cho ảnh đã chọn và từ đã chọn
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedWord, setSelectedWord] = useState("");
  const [completedPairs, setCompletedPairs] = useState([]); // lưu id ảnh đã match
  const [feedback, setFeedback] = useState(null); // null | true | false

  const handleSelectImage = (img) => {
    if (completedPairs.includes(img.id)) return; // đã hoàn thành
    setSelectedImage(img);
    setFeedback(null);
  };

  const handleSelectWord = (word) => {
    if (!selectedImage || completedPairs.includes(selectedImage.id)) return;
    setSelectedWord(word);

    if (word === selectedImage.correctWord) {
      setCompletedPairs([...completedPairs, selectedImage.id]);
      setFeedback(true);
    } else {
      setFeedback(false);
    }

    setSelectedImage(null);
    setSelectedWord("");
  };

  const allCompleted = completedPairs.length === data.resources.images.length;

  return (
    <div className="container mt-4">
      <h3 className="text-center fw-bold mb-3">{data.prompt}</h3>

      {feedback === true && <Alert variant="success">🎉 Chính xác!</Alert>}
      {feedback === false && <Alert variant="danger">❌ Sai rồi, thử lại!</Alert>}

      <Row className="g-3 justify-content-center mt-3">
        {data.resources.images.map((img) => (
          <Col xs={12} md={6} lg={4} key={img.id}>
            <Card
              className={`h-100 shadow-sm ${
                completedPairs.includes(img.id) ? "border-success" : ""
              } ${selectedImage?.id === img.id ? "border-primary" : ""}`}
              onClick={() => handleSelectImage(img)}
              style={{ cursor: "pointer", transition: "transform 0.2s" }}
            >
              <Card.Img
                variant="top"
                src={img.imageUrl}
                style={{ height: "200px", objectFit: "cover" }}
              />
              <Card.Body className="d-flex justify-content-center">
                {completedPairs.includes(img.id) ? (
                  <small className="text-success">✔ Đã hoàn thành</small>
                ) : (
                  <small className="text-muted">Nhấn để chọn ảnh</small>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex justify-content-center flex-wrap gap-2 mt-4">
        {data.resources.images.map((img) => (
          <Button
            key={img.correctWord}
            variant={
              completedPairs.includes(img.id)
                ? "success"
                : selectedWord === img.correctWord
                ? "primary"
                : "outline-primary"
            }
            size="lg"
            onClick={() => handleSelectWord(img.correctWord)}
            disabled={completedPairs.includes(img.id)}
          >
            {img.correctWord}
          </Button>
        ))}
      </div>

      {allCompleted && (
        <div className="text-center mt-4">
          <Button onClick={onNext} variant="success" size="lg">
            Tiếp theo 🎯
          </Button>
        </div>
      )}
    </div>
  );
};

export default MiniGameMatchImageWord;
