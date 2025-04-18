import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">StaffSync</Link>
        <div className="navbar-nav">
          <Link className="nav-link" to="/auth/login">Login</Link>
          <Link className="nav-link" to="/auth/register">Register</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
