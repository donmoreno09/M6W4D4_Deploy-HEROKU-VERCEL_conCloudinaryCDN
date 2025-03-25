import { Navbar, Nav, Container, NavDropdown, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Genera un avatar di default solo se l'utente non ha un'immagine caricata
  const getProfileImage = () => {
    if (user?.avatar) {
      // Usa l'immagine caricata dall'utente
      return user.avatar;
    } else {
      // Usa un avatar generato come fallback
      return `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${user?.firstName}+${user?.lastName}`;
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Blog App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {user && <Nav.Link as={Link} to="/my-blogs">I Miei Blog</Nav.Link>}
            {user && <Nav.Link as={Link} to="/create-blog">Crea Blog</Nav.Link>}
          </Nav>
          <Nav>
            {user ? (
              <div className="d-flex align-items-center">
                <Image 
                  src={getProfileImage()}
                  alt={`${user.firstName} ${user.lastName}`}
                  roundedCircle 
                  width={40} 
                  height={40} 
                  className="me-2"
                  style={{ objectFit: 'cover' }} // Mantiene le proporzioni dell'immagine
                />
                <NavDropdown title={`Ciao, ${user.firstName}`} id="user-dropdown" align="end">
                  <NavDropdown.Item as={Link} to="/profile">Profilo</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </div>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Registrati</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;