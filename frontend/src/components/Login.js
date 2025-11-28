// import React, { useState } from 'react';
// import axios from 'axios';

// const Login = ({ onLogin }) => {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: ''
//   });
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
    
//     try {
//       const response = await axios.post('http://localhost:5000/api/auth/login', formData);
//       onLogin(response.data);
//     } catch (error) {
//       alert('Login failed. Please check your credentials.');
//       console.error('Login error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-panel fade-in-up">
//       <h2>Admin Portal</h2>
//       <p className="login-subtitle">Access the Fencing Pro Delhi management system</p>
      
//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label className="form-label">Email Address</label>
//           <input
//             type="email"
//             name="email"
//             className="form-input"
//             value={formData.email}
//             onChange={handleChange}
//             required
//             placeholder="Enter your email address"
//           />
//         </div>
//         <div className="form-group">
//           <label className="form-label">Password</label>
//           <input
//             type="password"
//             name="password"
//             className="form-input"
//             value={formData.password}
//             onChange={handleChange}
//             required
//             placeholder="Enter your password"
//           />
//         </div>
//         <button 
//           type="submit" 
//           className="btn btn-primary"
//           style={{width: '100%'}}
//           disabled={loading}
//         >
//           {loading ? (
//             <>
//               <div className="loading"></div>
//               Signing In...
//             </>
//           ) : (
//             <>
//               <i className="fas fa-lock"></i>
//               Sign In
//             </>
//           )}
//         </button>
//       </form>
      
//       <div className="demo-accounts">
//         <h4>Demo Access Credentials:</h4>
//         <p><strong>Super Admin:</strong> superadmin@daf.com / superadmin123</p>
//         <p><strong>North East District:</strong> northeast@daf.com / admin123</p>
//         <p><strong>North West District:</strong> northwest@daf.com / admin123</p>
//       </div>
//     </div>
//   );
// };

// export default Login;