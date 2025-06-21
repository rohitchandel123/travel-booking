import "./Signup.css";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import ToggleBtn from "../button/ToggleBtn/ToggleBtn";
import SocialBtn from "../button/SocialButtons/SocialBtn";
import { ROUTES_CONFIG } from "../../../Shared/Constants";
import { auth, db, googleProvider } from "../../../firebaseConfig";
import { useDispatch } from "react-redux";
import { updateAuthTokenRedux } from "../../../Store/Common/index";
import PageBanner from "../../../Shared/PageBanner";
import { ProjectImages } from "../../../assets/ProjectImages";

interface SignUpFormValues {
  email: string;
  phoneNumber: string;
  password: string;
  "confirm-password": string;
}

function Signup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (showVerificationPopup) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [showVerificationPopup]);

  const handleSignup = async (values: SignUpFormValues) => {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const { user } = userCredential;

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        email: values.email,
        phoneNumber: values.phoneNumber,
      });

      await signOut(auth);

      setVerificationEmail(values.email);
      setShowVerificationPopup(true);
    } catch (error: any) {
      const errorMessage =
        error.code === "auth/email-already-in-use"
          ? "Email already in use."
          : error.message || "Signup failed. Please try again.";
      toast.error(errorMessage);
    }
    setIsSubmitting(false);
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleSignUp(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName,
          createdAt: new Date(),
        });
      }

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        await signOut(auth);
        
        setVerificationEmail(user.email || "");
        setShowVerificationPopup(true);
      } else {
        const token = await user.getIdToken();
        dispatch(updateAuthTokenRedux({ token }));

        toast.success("Google signup successful!");
        navigate(ROUTES_CONFIG.HOMEPAGE.path);
      }
    } catch (error: any) {
      console.log(error.code);
      let errorMessage;
      if (error.code == "auth/popup-closed-by-user")
        errorMessage = "User rejected the request";
      toast.error(errorMessage || "Google signup failed.");
    } finally {
      setIsGoogleSignUp(false);
    }
  };

  const closeVerificationPopup = () => {
    setShowVerificationPopup(false);
    navigate(ROUTES_CONFIG.LOGIN.path);
  };

  return (
    <>
      <PageBanner
        headingText="Authentication"
        normalText="Home /"
        coloredText="sign-up"
        bannerImage={ProjectImages.AUTH_BANNER}
      />

      {showVerificationPopup && (
        <div className="verification-popup-overlay">
          <div className="verification-popup">
            <h3>Verify Your Email</h3>
            <p>A verification email has been sent to:</p>
            <p className="email-address">{verificationEmail}</p>
            <p>Please check your inbox and verify your email to complete signup.</p>
            <button onClick={closeVerificationPopup} className="button-hovering-color">
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="signup-div">
        <div className="form-container">
          <div className="auth-buttons">
            <ToggleBtn
              name="Sign Up"
              handleClick={() => navigate(`${ROUTES_CONFIG.REGISTER.path}`)}
            />
            <ToggleBtn
              name="Log In"
              handleClick={() => navigate(`${ROUTES_CONFIG.LOGIN.path}`)}
            />
          </div>

          <div className="signup-form">
            <Formik
              initialValues={{
                email: "",
                phoneNumber: "",
                password: "",
                "confirm-password": "",
              }}
              validationSchema={Yup.object({
                email: Yup.string()
                  .required("Required")
                  .matches(
                    /^[a-zA-Z0-9.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    "Invalid email address"
                  ),

                phoneNumber: Yup.string()
                  .required("Required")
                  .matches(
                    /^\d{10}$/,
                    "Phone number must be exactly 10 digits"
                  ),
                password: Yup.string()
                  .required("Required")
                  .min(8, "Password must be at least 8 characters")
                  .matches(/[A-Z]/, "Must contain at least one uppercase")
                  .matches(/[a-z]/, "Must contain at least one lowercase")
                  .matches(
                    /[!@#$%^&*()<>?:"{}]/,
                    "Must contain at least one special character"
                  )
                  .matches(/\d/, "Must contain at least one number"),

                "confirm-password": Yup.string()
                  .required("Required")
                  .oneOf([Yup.ref("password")], "Passwords must match"),
              })}
              onSubmit={handleSignup}
            >
              <Form className="form-values">
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <Field
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="txt-box"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="error"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <Field
                    name="phoneNumber"
                    type="text"
                    placeholder="Enter your phone number"
                    className="txt-box"
                    maxLength={10}
                    onKeyPress={(
                      event: React.KeyboardEvent<HTMLInputElement>
                    ) => {
                      if (!/[0-9]/.test(event.key)) {
                        event.preventDefault();
                      }
                    }}
                  />
                  <ErrorMessage
                    name="phoneNumber"
                    component="div"
                    className="error"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <Field
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="txt-box"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="error"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <Field
                    name="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    className="txt-box"
                  />
                  <ErrorMessage
                    name="confirm-password"
                    component="div"
                    className="error"
                  />
                </div>

                <button
                  type="submit"
                  className={
                    isSubmitting
                      ? "submit-btn signUp-btn-disable"
                      : "submit-btn button-hovering-color"
                  }
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Signing Up...</span>
                  ) : (
                    <span> Sign Up</span>
                  )}
                </button>
              </Form>
            </Formik>
          </div>

          <div className="social-auth">
            <button
              className="sign-up-btn social-btn"
              onClick={handleGoogleSignUp}
              disabled={isGoogleSignUp}
            >
              Google
            </button>
            <SocialBtn
              name="Facebook"
              handleClick={() => console.log("Facebook")}
            />
            <SocialBtn
              name="Twitter"
              handleClick={() => console.log("Twitter")}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;