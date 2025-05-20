import "./footer.css";
import { ProjectImages } from "../../assets/ProjectImages";
import { Link } from "react-router-dom";
import { ROUTES_CONFIG } from "../../Shared/Constants";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";

function Footer() {
  const destinationColOne = ["Las Vegas", "New York", "Hawaii", "Paris"];
  const destinationColTwo = ["Barcelona", "Milan", "Tokyo", "Sydney"];

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required")
        .matches(
          /^[a-zA-Z0-9.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Invalid email address"
        ),

    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        await addDoc(collection(db, "newsletter"), {
          email: values.email,
        });
        toast.success("Signed up successfully for newsletter");
        resetForm();
      } catch (error) {
        toast.error(`Error: ${error}`);
      }
    },
  });

  return (
    <div className="footer-container">
      <div className="footer-section">
        <div className="left-footer">
          <Link to={ROUTES_CONFIG.HOMEPAGE.path}>
            <img src={ProjectImages.TRISOG_LOGO} alt="trisog-logo" />
          </Link>
          <li className="footer-cursive">Need any help?</li>
          <h6>Call Us: (888)12345678</h6>
          <p>
            Chandigarh, India <br />
            example@trisog.com
          </p>
        </div>

        <div className="mid-footer">
          <div className="company">
            <ul>
              <li className="footer-cursive">Company</li>
              <Link to={ROUTES_CONFIG.ABOUT.path} className="link-class">
                <li>About us</li>
              </Link>
              <Link to={ROUTES_CONFIG.CONTACT.path} className="link-class">
                <li>Contact us</li>
              </Link>
            </ul>
          </div>

          <div className="top-destination">
            <ul>
              <li className="footer-cursive">Top Destination</li>
              {destinationColOne.map((destinationName) => (
                <Link
                  to={`${ROUTES_CONFIG.TOURS.path}?sidebarSearch=${encodeURIComponent(destinationName)}&page=1`}
                  className="link-class"
                  key={`col1-${destinationName}`}
                >
                  <li>{destinationName}</li>
                </Link>
              ))}
            </ul>
          </div>

          <div className="top-destination">
            <ul>
              <li className="footer-cursive">Trending Destination</li>
              {destinationColTwo.map((destinationName) => (
                <Link
                  to={`${ROUTES_CONFIG.TOURS.path}?sidebarSearch=${encodeURIComponent(destinationName)}&page=1`}
                  className="link-class"
                  key={`col2-${destinationName}`}
                >
                  <li>{destinationName}</li>
                </Link>
              ))}
            </ul>
          </div>
        </div>

        <div className="right-footer">
          <li className="footer-cursive">Sign up Newsletter</li>

          <form onSubmit={formik.handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formik.touched.email && formik.errors.email ? "error-input" : ""}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="error-text">{formik.errors.email}</div>
            )}
            <br />
            <button type="submit" className="button-hovering-color">
              Submit
            </button>
          </form>

          <br />
          <p>© 2025 Trisog All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}

export default Footer;