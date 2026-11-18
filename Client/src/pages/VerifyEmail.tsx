import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { api } from "../config/api";
import { ACCOUNT_CSS, Notice } from "../components/home-v2/accountShared";

/**
 * Verify email, light redesign (Nov 2026): one centred message per state, in the new
 * navigation and footer. The verification call is unchanged: GET /users/verify-email/:token.
 */

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error" | "already-verified">("verifying");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(api(`/users/verify-email/${token}`), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();

        if (response.ok) {
          if (data.data?.alreadyVerified) {
            setStatus("already-verified");
            setMessage(data.message || "Email already verified");
          } else {
            setStatus("success");
            setMessage(data.message || "Email verified successfully!");
            setEmail(data.data?.email || "");
          }
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Failed to verify email. Please try again.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="ac">
      <style>{ACCOUNT_CSS}</style>
      <NavigationV2 solid />

      {status === "verifying" && (
        <Notice eyebrow="Your account" title="Verifying your email" body="Please wait while we verify your email address."><span className="ac-spinner" style={{ margin: 0 }} /></Notice>
      )}
      {status === "success" && (
        <Notice eyebrow="Your account" title="Email verified." body={email ? `${message} ${email}` : message}>
          <Link to="/account" className="ac-btn">Go to my account</Link>
          <Link to="/products" className="ac-link">Explore the collection</Link>
        </Notice>
      )}
      {status === "already-verified" && (
        <Notice eyebrow="Your account" title="Already verified." body={message}>
          <Link to="/account" className="ac-btn">Go to my account</Link>
          <Link to="/" className="ac-link">Go to home</Link>
        </Notice>
      )}
      {status === "error" && (
        <Notice eyebrow="Your account" title="We couldn’t verify that email." body={message}>
          <Link to="/account" className="ac-btn">Request a new verification email</Link>
          <Link to="/" className="ac-link">Go to home</Link>
        </Notice>
      )}

      <FooterV2 />
    </div>
  );
};

export default VerifyEmail;
