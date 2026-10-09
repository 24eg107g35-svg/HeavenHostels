import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Api from '../api';

const ForgotPassword = () => {
  // Step management: 1 = Email, 2 = OTP, 3 = New Password
  const [step, setStep] = useState(1);
  
  // Form fields state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading & Message states for better UX
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  
  // Resend OTP states
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Timer effect for resend button
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && resendTimer !== undefined && step === 2) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer, step]);

  // Handle Step 1: Send OTP to user's email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      // Send POST request to backend to generate and send OTP
      const response = await axios.post(`${Api}/api/auth/send-otp`, { email }, { withCredentials: true });
      if(response.status===200){

        // Display success message and move to OTP verification step
       setMessage({ text: 'OTP sent successfully to your email!', isError: false });
       setStep(2); // Move to OTP step
       setResendTimer(30); // Start 30-second timer
       setCanResend(false); // Disable resend button initially
      }
      else{
               setMessage({ text: 'OTP Failed To send', isError: true });

      }
    } catch (error) {
      // Display error message if OTP sending fails
      const errorMsg = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify OTP entered by user
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
       // Send POST request to backend to verify OTP
      const response = await axios.post(`${Api}/api/auth/verify-otp`, { email, otp }, { withCredentials: true });
       if(response.status===200){

         // Display success message and move to password reset step
         setMessage({ text: 'OTP verified successfully!', isError: false });
         setStep(3); // Move to New Password step
       }
       else{
        setMessage({ text: 'Failed To verify !', isError: true });
       }
    } catch (error) {
      // Display error message if OTP verification fails
      const errorMsg = error.response?.data?.message || 'Invalid OTP. Please check and try again.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async (e) => {
    e.preventDefault();
    if (!canResend || !email) return;

    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      // Send POST request to backend to resend OTP
      const response = await axios.post(`${Api}/api/auth/send-otp`, { email }, { withCredentials: true });
       if(response.status===200){

        // Display success message
        setMessage({ text: 'OTP resent successfully to your email!', isError: false });
        setResendTimer(30); // Restart 30-second timer
        setCanResend(false); // Disable resend button again
        setOtp(''); // Clear OTP input field
      }else{
        setMessage({ text: 'Failed To Resend OTP', isError: true });
 
      }
    } catch (error) {
      // Display error message if OTP resending fails
      const errorMsg = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3: Submit new password for account
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setMessage({ text: '', isError: false });
 
    try {
      // Send POST request to backend to reset password with new password
      const response = await axios.post(`${Api}/api/auth/reset-password`, { 
        email,
        password 
      }, { withCredentials: true });
      if(response.status===200){

        setMessage({ text: 'Password reset successfully! You can now log in.', isError: false });
        // Optional: Redirect user to login page here
        setTimeout(() => {
          window.location.href = '/auth/login'; // Redirect to login page
        }, 2000);
        // Display success message and reset form
      }
      else{
                setMessage({ text: 'Failed To Reset Password.', isError: true });

      }
    } catch (error) {
      // Display error message if password reset fails
      const errorMsg = error.response?.data?.message || 'Failed to reset password. Try again.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Forgot Password</h2>
        
        {message.text && (
          <div style={{ ...styles.alert, backgroundColor: message.isError ? '#fee2e2' : '#dcfce7', color: message.isError ? '#dc2626' : '#16a34a' }}>
            {message.text}
          </div>
        )}

        {/* STEP 1: Email Input */}
        <form onSubmit={handleSendOtp} style={styles.formGroup}>
          <label style={styles.label}>Enter Your Registered Email</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={step > 1}
            required
            style={{ ...styles.input, backgroundColor: step > 1 ? '#f3f4f6' : '#fff' }}
          />
          {step === 1 && (
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          )}
        </form>

        {/* STEP 2: OTP Input */}
        <form onSubmit={handleVerifyOtp} style={styles.formGroup}>
          <label style={{ ...styles.label, color: step < 2 ? '#9ca3af' : '#374151' }}>
            Enter OTP
          </label>
          <input
            type="text"
            placeholder="Enter 4-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={step !== 2}
            required
            style={{ ...styles.input, backgroundColor: step !== 2 ? '#f3f4f6' : '#fff' }}
          />
          {step === 2 && (
            <>
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button 
                type="button" 
                onClick={handleResendOtp} 
                disabled={!canResend || loading}
                style={{ 
                  ...styles.button, 
                  backgroundColor: canResend && !loading ? '#10b981' : '#d1d5db',
                  cursor: canResend && !loading ? 'pointer' : 'not-allowed',
                  marginTop: '8px'
                }}
              >
                {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}
              </button>
            </>
          )}
        </form>

        {/* STEP 3: New Password Input */}
        <form onSubmit={handleResetPassword} style={styles.formGroup}>
          <label style={{ ...styles.label, color: step < 3 ? '#9ca3af' : '#374151' }}>
            Enter New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={step !== 3}
            required
            style={{ ...styles.input, backgroundColor: step !== 3 ? '#f3f4f6' : '#fff' }}
          />
          {step === 3 && (
            <button type="submit" disabled={loading} style={{ ...styles.button, backgroundColor: '#2563eb' }}>
              {loading ? 'Submitting...' : 'Submit New Password'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

// Clean, Responsive Inline Styles
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    width: '100%',
    maxWidth: '450px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '24px',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
    transition: 'color 0.2s ease',
  },
  input: {
    padding: '10px 14px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  button: {
    marginTop: '12px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    padding: '10px 16px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  alert: {
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
  },
};

export default ForgotPassword;