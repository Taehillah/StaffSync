import { Container } from 'react-bootstrap';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <Container className="mt-4">
        {children}
      </Container>
    </>
  );
};

export default MainLayout;
