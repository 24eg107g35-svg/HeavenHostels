import React from 'react';
// import { useEffect, useState } from 'react';
import axios from 'axios';

import api from '../api';

import './PaidList.css';
const PaidList = ({ paidlist }) => {
    
    
     const unpaidtopaaid = async(studentId)=>{
         try {
            const result= confirm(`Are you sure you want to mark this ${paidlist[0].StudentName.toUpperCase()} as unpaid?`);
            if(!result){
                return;
            }
             const response = await axios.post(`${api}/api/students/updatepaymentstatustoUnpaid/${studentId}`);
            if(response.status === 200){
                alert(`${paidlist[0].StudentName.toUpperCase()} has been marked as unpaid.`);
                window.location.reload();
            }
         } catch (error) {
            console.error("error:", error);
        }
    }





    return(
        <div>


          <section className="dashboard-section paid-section container">
                <h2 className="section-header">Paid Students (This Month)</h2>
                <div className="table-container">
                    <table className="data-table paid-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Student Name</th>
                                <th>Room No</th>
                                <th>Amount Due</th>
                                <th>Contact</th>
                                <th>IsUnpaid?</th>
                            </tr>
                        </thead>
                        
                         {paidlist.length > 0 ?
                            paidlist.map((student, index) => (
                                <tbody key={student._id}>
                                    <tr>
                                        <td>{index + 1}</td>
                                        <td>{student.StudentName}</td>
                                        <td>{student.RoomNumber}</td>
                                        <td>₹{student.AmountPerMonth}</td>
                                        <td>{student.Mobilenumber}</td>
                                        <td> <button  className='btn-hero-secondaryP hover:bg-white' onClick={() => unpaidtopaaid(student._id)} >IsUnpaid?</button></td>
                                    </tr>
                                </tbody>
                            )) :
                            <tbody>
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>No paid students for this month.</td>
                                </tr>
                            </tbody>}
                    </table>
                </div>
            </section>
        </div>
    )


}


export default PaidList;