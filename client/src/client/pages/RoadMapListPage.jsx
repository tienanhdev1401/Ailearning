import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";

const RoadmapListPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const res = await api.get("/roadmaps?page=1&limit=10");
        setRoadmaps(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmaps();
  }, []);

  if (loading) return <Spinner animation="border" className="m-5" />;

  return (
    <Container className="mt-5">
      <h1 className="mb-4">Danh sách Roadmap</h1>
      <Row>
        {roadmaps.map((rm) => (
          <Col md={4} key={rm.id} className="mb-4">
            <Card 
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/roadmaps/${rm.id}/days`)} 
            >
              <Card.Body>
                <Card.Title>{rm.levelName}</Card.Title>
                <Card.Text>{rm.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default RoadmapListPage;
