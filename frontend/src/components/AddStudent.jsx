import React, { useState} from 'react';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';
import './AddStudent.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../api.js'
 const initial = {
  StudentName: '',
  RoomNumber: '',
  Sharing: '',
  CollegeName: '',
  CourseNameandYear: '',
  Mobilenumber: '',
  Email: '',
  Address: '',
  AmountPerMonth: '',
  StartingDate: '',
  PMobilenumber:'',
  paymentstatus:'Unpaid'
};

export default function AddStudent({isstudent}) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  // const [user,setUser]=useState(null);

 
 
  const handleChange = (e) => {
    const { name, value } = e.target;
     setForm((s) => {
      const updated = { ...s, [name]: value };
      
      // Auto-calculate AmountPerMonth based on Sharing type
      if (name === 'Sharing') {
        const amounts = {
          '1': '7000',
          '2': '8000',
          '3': '6700',
          '4': '6500',
          '5': '6000'
        };
        updated.AmountPerMonth = amounts[value] || '6000';
      }
      
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    
    // simple mock delay to simulate submit
    setTimeout(async () => {
      setSubmitting(false);

        const token = localStorage.getItem('Token');
        if (!token) {
                alert("Please login to access your details");
                navigate("/auth/login");
                return;
            }
            // const parsedUser = JSON.parse(storedUser);
            // setUser(parsedUser);

            // if(parsedUser.email !== form.Email){
            //   alert("Please use your logged-in email address to add student");
            //   return;
            // }
            // if(form.Sharing===''){
            //   return alert('select room type')
            // }

      try {
        await axios.post(`${api}/api/students/addnewstudent`, {
          RoomNumber: form.RoomNumber,
          Sharing: form.Sharing,
          StartingDate: form.StartingDate,
          AmountPerMonth: form.AmountPerMonth,
          StudentName: form.StudentName,
          Mobilenumber: form.Mobilenumber,
          PMobilenumber: form.PMobilenumber,
          Email:form.Email,
          Address: form.Address,
          CollegeName: form.CollegeName,
          CourseNameandYear: form.CourseNameandYear,
          paymentstatus:form.paymentstatus
        },{ withCredentials: true });

        setMessage({ type: 'success', text: 'New student added successfully!' });
        // Clear success message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        setForm(initial);
        setTimeout(() => window.location.reload(), 1000);
       } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add student. Please try again.' });
        // Clear error message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        return;
      }
      // Clear success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setForm(initial);
    }, 600);
  };

  return (
    <>
    <br />
    <form onSubmit={handleSubmit} className="add-student-container">
     {isstudent ? <h3 className="add-student-title"> Add Your Details</h3>:   <h3 className="add-student-title">Add New Student</h3>  }

      {message.text && (
        <div className={message.type === 'success' ? 'form-success-message' : 'form-error-message'}>
          {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="form-grid">
        <label className="form-group">
          <span className="form-label">Student Name *</span>
          <input 
            type="text"
            name="StudentName" 
            value={form.StudentName} 
            onChange={handleChange}
            className="form-input"
            placeholder="Full name" 
            required 
          />
        </label>

        <label className="form-group">
          <span className="form-label">Room Number *</span>
          <input 
            type="text"
            name="RoomNumber" 
            value={form.RoomNumber} 
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. B-204" 
            required 
          />
        </label>

        <label className="form-group">
          <span className="form-label">Type of Sharing</span>
          <select 
            name="Sharing" 
            value={form.Sharing} 
            onChange={handleChange}
            className="form-select"
            placeholder="select Room type"
          >
               <option value={''} >Select Room Type</option>
            <option value={'1'} >1-sharing</option>
            <option value={'2'}>2-sharing</option>
            <option value={'3'}>3-sharing</option>
            <option value={'4'}>4-sharing</option>
            <option value={'5'}>5-sharing</option>
          </select>
        </label>

        <label className="form-group">
          <span className="form-label">Joining Date</span>
          <input 
            type="date"
            name="StartingDate" 
            value={form.StartingDate} 
            onChange={handleChange}
            className="form-input"
            placeholder="Joining Date" 
          />
        </label>

        <label className="form-group">
          <span className="form-label">College Name</span>
          <input 
            type="text"
            name="CollegeName" 
            value={form.CollegeName} 
            onChange={handleChange}
            className="form-input"
            placeholder="College / Institute" 
          />
        </label>

        <label className="form-group">
          <span className="form-label">Course & Year</span>
          <input 
            type="text"
            name="CourseNameandYear" 
            value={form.CourseNameandYear} 
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. B.Tech CS - 3rd Year" 
          />
        </label>

        <label className="form-group">
          <span className="form-label">Student Mobile Number *</span>
          <input 
            type="tel"
            name="Mobilenumber" 
            value={form.Mobilenumber} 
            onChange={handleChange}
            className="form-input"
            placeholder="+91 98765 43210" 
            required 
          />
        </label>

         <label className="form-group">
          <span className="form-label">Parents Mobile Number *</span>
          <input 
            type="tel"
            name="PMobilenumber" 
            value={form.PMobilenumber} 
            onChange={handleChange}
            className="form-input"
            placeholder="+91 98765 43210" 
            required 
          />
        </label>
          <label className="form-group">
          <span className="form-label">Email*</span>
          <input 
            type="email"
            name="Email" 
            value={form.Email} 
            onChange={handleChange}
            className="form-input"
            placeholder="student@gmail.com" 
            required 
         
          />
             <small>Please use your logged-in email address</small>
        </label>
     
          <label className="form-group">
          <span className="form-label">Address*</span>
          <input 
            type="textarea"
            name="Address" 
            value={form.Address} 
            onChange={handleChange}
            className="form-input"
            placeholder="ex: 123 Main St, City, State" 
            required 
          />
        </label>
               <label className="form-group">
          <span className="form-label">Amount Per Month*</span>
          <input 
            type="text"
            name="AmountPerMonth" 
            value={form.AmountPerMonth} 
            onChange={handleChange}
            className="form-input"
            placeholder="ex:7000" 
           readOnly
          />
        </label>
         <label className="form-group">
          <span className="form-label">Payment Status</span>
          <select 
            name="paymentstatus" 
            value={form.paymentstatus} 
            onChange={handleChange}
            className="form-select"
          >
            <option value={"Paid"} >Paid</option>
            <option value={"Unpaid"}>Unpaid</option>
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          disabled={submitting}
          className={`btn btn-primary ${submitting ? 'loading' : ''}`}
        >
          {submitting ? 'Adding...' : 'Add Student'} 
          {!submitting && <ArrowRight size={16} />}
        </button>
      </div>
    </form>
    
    </>
  );
}
