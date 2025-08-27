import { Navbar as RBNavbar, Container, Nav, Badge, Button } from "react-bootstrap";
import { FaBell, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../stores/authStore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [newNotifs, setNewNotifs] = useState(2);

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <RBNavbar bg="dark" data-bs-theme="dark" expand="md">
      <Container>
        <RBNavbar.Brand role="button" onClick={() => navigate("/dashboard")}>
          STAFFSYNC
        </RBNavbar.Brand>

        <RBNavbar.Toggle aria-controls="top-nav" />
        <RBNavbar.Collapse id="top-nav">
          <Nav className="ms-auto align-items-center gap-3">
            <Nav.Link onClick={() => setNewNotifs(0)} title="Notifications">
              <FaBell /> {newNotifs > 0 && <Badge bg="danger">{newNotifs}</Badge>}
            </Nav.Link>
            {user && (
              <>
                <span className="text-secondary small d-none d-md-inline">
                  <FaUserCircle className="me-1" />
                  {user.rank} · {user.surname}
                </span>
                <Button size="sm" variant="outline-danger" onClick={handleLogout}>
                  <FaSignOutAlt className="me-1" />
                  Sign Out
                </Button>
              </>
            )}
          </Nav>
        </RBNavbar.Collapse>
      </Container>
    </RBNavbar>
  );
}
