import { NavLink, useNavigate, Link } from "react-router-dom";
import "./header.css";
import { ProjectImages } from "../../assets/ProjectImages";
import { ROUTES_CONFIG } from "../Constants";
import { useEffect, useState, useRef } from "react";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { updateAuthTokenRedux } from "../../Store/Common";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.mobile-menu-btn')
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showLogoutPopup) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [showLogoutPopup]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate(ROUTES_CONFIG.HOMEPAGE.path);
      dispatch(updateAuthTokenRedux({ token: null }));
      toast.success("Logged out successfully!");
      setMobileMenuOpen(false);
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const getUserInitial = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  const openLogoutPopup = () => {
    setShowLogoutPopup(true);
    setMobileMenuOpen(false);
  };

  const closeLogoutPopup = () => {
    setShowLogoutPopup(false);
  };

  const handleMenuLinkClick = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="header-section">
      <div className="left-header">
        <div className="header-logo">
          <Link to={ROUTES_CONFIG.HOMEPAGE.path}>
            <img src={ProjectImages.TRISOG_HEADER_LOGO} alt="project-logo" />
          </Link>
        </div>

        <div className={`header-items ${mobileMenuOpen ? 'active' : ''}`} ref={mobileMenuRef}>
          <NavLink
            to={ROUTES_CONFIG.HOMEPAGE.path}
            className={({ isActive }) =>
              `link-class ${isActive ? "active-link" : ""}`
            }
            onClick={handleMenuLinkClick}
          >
            <li>{ROUTES_CONFIG.HOMEPAGE.title}</li>
          </NavLink>
          <NavLink
            to={ROUTES_CONFIG.ABOUT.path}
            className={({ isActive }) =>
              `link-class ${isActive ? "active-link" : ""}`
            }
            onClick={handleMenuLinkClick}
          >
            <li>{ROUTES_CONFIG.ABOUT.title}</li>
          </NavLink>

          <NavLink
            to={ROUTES_CONFIG.TOURS.path}
            className={({ isActive }) =>
              `link-class ${isActive ? "active-link" : ""}`
            }
            onClick={handleMenuLinkClick}
          >
            <li>Tours</li>
          </NavLink>
          <NavLink
            to={ROUTES_CONFIG.DESTINATION.path}
            className={({ isActive }) =>
              `link-class ${isActive ? "active-link" : ""}`
            }
            onClick={handleMenuLinkClick}
          >
            <li>Destination</li>
          </NavLink>
          <NavLink
            to={ROUTES_CONFIG.BLOG.path}
            className={({ isActive }) =>
              `link-class ${isActive ? "active-link" : ""}`
            }
            onClick={handleMenuLinkClick}
          >
            <li>Blog</li>
          </NavLink>
          <NavLink
            to={ROUTES_CONFIG.CONTACT.path}
            className={({ isActive }) =>
              `link-class ${isActive ? "active-link" : ""}`
            }
            onClick={handleMenuLinkClick}
          >
            <li>{ROUTES_CONFIG.CONTACT.title}</li>
          </NavLink>
        </div>
      </div>

      <div className="right-header">
        {user ? (
          <div className="user-info" ref={dropdownRef}>
            <button
              className="user-initial"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-controls="user-dropdown-menu"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {getUserInitial()}
            </button>

            {menuOpen && (
              <div
                id="user-dropdown-menu"
                className="user-dropdown"
                role="menu"
              >
                <Link
                  to={ROUTES_CONFIG.BOOKED_TOURS.path}
                  className="dropdown-item"
                  onClick={handleMenuLinkClick}
                  role="menuitem"
                >
                  <i className="fa-solid fa-calendar-check" aria-hidden="true" />
                  Booked Tours
                </Link>
                <Link
                  to={ROUTES_CONFIG.FAVORITES_TOURS.path}
                  className="dropdown-item"
                  onClick={handleMenuLinkClick}
                  role="menuitem"
                >
                  <i className="fa-solid fa-heart" aria-hidden="true" />
                  Favourite Tours
                </Link>
                <button 
                  className="dropdown-item" 
                  onClick={openLogoutPopup}
                  role="menuitem"
                >
                  <i className="fa-solid fa-sign-out-alt" aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`auth-links ${mobileMenuOpen ? 'active' : ''}`}>
            <NavLink
              to={ROUTES_CONFIG.LOGIN.path}
              className={({ isActive }) =>
                `auth-link ${isActive ? "active-link" : ""}`
              }
              onClick={handleMenuLinkClick}
            >
              <i className="fa-regular fa-user" aria-hidden="true" />{" "}
              <span>{ROUTES_CONFIG.LOGIN.title}</span>
            </NavLink>
            <span className="divider" aria-hidden="true">
              /
            </span>
            <NavLink
              to={ROUTES_CONFIG.REGISTER.path}
              className={({ isActive }) =>
                `auth-link ${isActive ? "active-link" : ""}`
              }
              onClick={handleMenuLinkClick}
            >
              {ROUTES_CONFIG.REGISTER.title}
            </NavLink>
          </div>
        )}
        <button 
          className="mobile-menu-btn" 
          onClick={toggleMobileMenu} 
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
        </button>
      </div>

      {showLogoutPopup && (
        <div className="logout-popup-wrapper" onClick={closeLogoutPopup}>
          <div className="logout-popup" onClick={(e) => e.stopPropagation()}>
            <h3>Are you sure you want to log out?</h3>
            <div className="popup-actions">
              <button className="confirm-btn" onClick={handleLogout}>
                Logout
              </button>
              <button className="cancel-btn" onClick={closeLogoutPopup}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
