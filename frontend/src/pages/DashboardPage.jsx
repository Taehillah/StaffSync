import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';

const Dashboard = () => {
  return (
    <>
      <Row className="mb-4">
        <Col md={3}>
          <Card className="mustering-card">
            <Card.Body>
              <h6 className="card-title">Active Bases</h6>
              <h2 className="mb-0">13</h2>
              <Badge bg="success" className="mt-2">+2.4%</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mustering-card">
            <Card.Body>
              <h6 className="card-title">Active Personnel</h6>
              <h2 className="mb-0">3.9k</h2>
              <Badge bg="warning" className="mt-2">-1.2%</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mustering-card">
            <Card.Body>
              <h6 className="card-title">Combat Ready</h6>
              <h2 className="mb-0">87%</h2>
              <Badge bg="success" className="mt-2">+5.3%</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mustering-card">
            <Card.Body>
              <h6 className="card-title">Active Missions</h6>
              <h2 className="mb-0">24</h2>
              <Badge bg="danger" className="mt-2">+8</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="mustering-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>Base Overview</Card.Title>
                <div className="filter-controls">
                  <select className="form-select bg-transparent text-white border-secondary">
                    <option>Combat Readiness</option>
                    <option>Personnel</option>
                    <option>Location</option>
                  </select>
                </div>
              </div>
              {/* Base list would go here */}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mustering-card">
            <Card.Body>
              <Card.Title>Recent Activity</Card.Title>
              {/* Activity feed would go here */}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;