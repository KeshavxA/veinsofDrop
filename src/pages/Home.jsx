import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase' 
import { collection, addDoc, getDocs } from 'firebase/firestore'

function Home() {
  const { currentUser, signOut, isAuthenticated } = useAuth()
  const navigate = useNavigate() 
  const location = useLocation() 
  
  const [donors, setDonors] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showDonorPopup, setShowDonorPopup] = useState(false)
  const [showRequestPopup, setShowRequestPopup] = useState(false)

  const [donorName, setDonorName] = useState("")
  const [donorEmail, setDonorEmail] = useState(currentUser?.email || "")
  const [donorPhone, setDonorPhone] = useState("")
  const [donorBloodGroup, setDonorBloodGroup] = useState("")
  const [donorLocation, setDonorLocation] = useState("")
  const [donorAvailableQuantity, setAvailableQuantity] = useState(0)

  const [patientName, setPatientName] = useState("") 
  const [bloodGroup, setBloodGroup] = useState("")  
  const [requestEmail, setRequestEmail] = useState(currentUser?.email || "")
  const [requestPhone, setRequestPhone] = useState("")
  const [unitsRequired, setUnitsRequired] = useState("")
  const [emergencyLevel, setEmergencyLevel] = useState("normal")
  const [hospitalLocation, setHospitalLocation] = useState("")


  const fetchDonors = async () => {
    setLoading(true);
    try {
      const donorsRef = collection(db, "donors");
      const querySnapshot = await getDocs(donorsRef);
      const donorsList = querySnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data() 
      }));

      setDonors(donorsList);
    } catch (error) {
      console.error("Error fetching donors:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDonors();
      
      if(currentUser?.email) {
        setDonorEmail(currentUser.email);
        setRequestEmail(currentUser.email);
      }
    }
    console.log("Current path:", location.pathname);

  }, [isAuthenticated, currentUser, location]);

  const visibleDonors = donors.filter(d => d.email !== currentUser?.email);

  const handleBecomeDonorClick = () => {
    const isAlreadyDonorByEmail = donors.some(d => d.email === currentUser?.email);
    
    if (isAlreadyDonorByEmail) {
      alert("You are already registered as a donor with this email.");
    } else {
      setShowDonorPopup(true);
    }
  }
    const handleSendMailToDonor = async (donor) => {
    const subject = `Urgent: Blood Donation Request via veinsofDrop`;
    const body = `Hello ${donor.name},%0D%0A%0D%0AI found your profile on veinsofDrop and I am in need of ${donor.bloodGroup} blood donation.%0D%0A%0D%0ALocation: ${donor.location}%0D%0A%0D%0APlease let me know if you are available to help.%0D%0A%0D%0ARequested by: ${currentUser?.email}`;
    
    window.location.href = `mailto:${donor.email}?subject=${subject}&body=${body}`;
    try {
      await addDoc(collection(db, "contact_requests"), {
        requesterEmail: currentUser?.email,
        requesterUid: currentUser?.uid,
        donorName: donor.name,
        donorEmail: donor.email,
        donorUid: donor.userId || "unknown",
        requestDate: new Date(),
        status: "initiated"
      });
      console.log("Contact request logged in database.");
    } catch (error) {
      console.error("Error logging contact request:", error);
    }
  };

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      navigate('/login')
    }
  }

  const handleDonorSubmit = async (e) => {
    e.preventDefault()

    if (donorPhone.length !== 10 || isNaN(donorPhone)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    const duplicateFound = donors.some(d => 
        d.email === donorEmail || d.phone === donorPhone
    );

    if (duplicateFound) {
        alert("Registration Failed: A donor with this Email or Phone Number already exists.");
        return; 
    }

    try {
      await addDoc(collection(db, "donors"), {
        name: donorName,
        email: donorEmail,
        phone: donorPhone,
        bloodGroup: donorBloodGroup,
        location: donorLocation,
        availablequantity: donorAvailableQuantity, 
        userId: currentUser?.uid || "anonymous", 
        createdAt: new Date() 
      });

      alert("Thank you! You are now registered as a donor.");
      fetchDonors();
      
      setShowDonorPopup(false)
      setDonorName(""); setDonorPhone(""); setDonorBloodGroup(""); setDonorLocation(""); setAvailableQuantity(0);

    } catch (error) {
      console.error("Error adding donor: ", error);
      alert("Failed to submit. See console for details.");
    }
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()

    if (requestPhone.length !== 10 || isNaN(requestPhone)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    try {
      await addDoc(collection(db, "requests"), {
        patientName,
        bloodGroup,
        requestEmail,
        requestPhone,
        unitsRequired,
        emergencyLevel,
        hospitalLocation,
        userId: currentUser?.uid || "anonymous",
        status: "pending",
        createdAt: new Date()
      });

      console.log('Request submitted to database');
      alert("Blood request submitted successfully!");

      setShowRequestPopup(false)
      setPatientName(""); setBloodGroup(""); setRequestPhone(""); setUnitsRequired(""); setHospitalLocation("");

    } catch (error) {
      console.error("Error submitting request: ", error);
      alert("Failed to submit request.");
    }
  }

  return (
    <div className="m-0 p-0 font-sans bg-[#e6fffb] text-[#9ab3b3] leading-relaxed min-h-screen">
      <aside className="fixed top-1/2 left-4 -translate-y-1/2 flex flex-col gap-3 z-50">
      </aside>
      
      <header className="bg-gradient-to-r from-[rgb(191,203,203)] to-[rgb(219,43,43)] text-white">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between py-3 gap-2 sm:gap-0 relative">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="veinsofDrop logo" className="h-11 w-auto block rounded-md" />
            <h1 className="m-0 text-xl font-bold"></h1> 
          </div>
         
          <div className="md:hidden flex gap-2">
            <button 
              onClick={handleBecomeDonorClick} 
              className="text-white hover:text-red-700 font-semibold text-sm px-2 py-1"
              type="button"
            >
              Donor
            </button>
            <button 
              onClick={() => setShowRequestPopup(true)}
              className="text-white hover:text-red-700 font-semibold text-sm px-2 py-1"
              type="button"
            >
              Request
            </button>
          </div>
          
          <nav aria-label="Main navigation" className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            <ul className="flex gap-4">
              <li>
                <Link 
                  to="/" 
                  className={`font-semibold transition-colors ${
                    location.pathname === '/' 
                      ? 'text-white font-bold' 
                      : 'text-gray-100 hover:text-red-700'   
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className={`font-semibold transition-colors ${
                    location.pathname === '/profile' 
                      ? 'text-white font-bold' 
                      : 'text-gray-100 hover:text-red-700'
                  }`}
                >
                  Profile
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleBecomeDonorClick} 
                  className="text-white hover:text-red-700 font-semibold bg-transparent border-none cursor-pointer p-0"
                  type="button"
                >
                  Become a donor
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowRequestPopup(true)}
                  className="text-white hover:text-red-700 font-semibold bg-transparent border-none cursor-pointer p-0"
                  type="button"
                >
                  Request for Blood
                </button>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            {isAuthenticated ? (
              <>
                <span className="text-white text-sm">Welcome, {currentUser?.email}</span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-white text-[#db2b2b] font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="px-4 py-2 rounded-lg bg-white text-[#db2b2b] font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5">
                  Register
                </Link>
                <Link to="/login" className="px-4 py-2 rounded-lg bg-[#db2b2b] text-white font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-10">
       
        {isAuthenticated ? (

            <section className="bg-white p-7 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 className="text-2xl font-bold text-gray-800">Available Donors</h3>
                    <button 
                        onClick={fetchDonors}
                        className="bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    > 
                      Refresh List
                    </button>
                </div>
                <p className="text-gray-500 mb-4 text-sm">Availability of donors nearby</p>

                {loading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 text-lg">Loading donor data...</p>
                  </div>
                ) : visibleDonors.length === 0 ? ( 
                  <div className="text-center py-10">
                    <p className="text-gray-500">No other donors available yet. Be the first to donate!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                              <tr>
                                <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">DONOR NAME</td>
                                <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">EMAIL</td>
                                <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">CONTACT</td>
                                <td className="px-6 py-3 text-left text-xs font-medium text-gray-600  uppercase tracking-wider">BLOOD TYPE</td>
                                <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">LOCATION</td>
                                <td className="px-6 py-3 text-left text-xs font-medium  text-gray-600 uppercase tracking-wider">AVAILABLE QUANTITY</td>
                                <td className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">REQUEST</td>
                              </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {visibleDonors.map((donor, index) => (
                            <tr key={donor.id || index}>
                                      
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{donor.name}</div>                                        
                                    {donor.email && donor.email.includes('example') && (
                                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                            Verified
                                    </span>
                                    )}
                                </div>
                                </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900">{donor.email}</div>
                                        
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{donor.phone}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                              donor.bloodGroup && donor.bloodGroup.includes('+') ? 'bg-red-100 text-red-700':'bg-red-100 text-red-700'
                                          }`}>
                                              {donor.bloodGroup}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {donor.location}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                          {donor.availablequantity}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                          <button
                                              onClick={() => handleSendMailToDonor(donor)}
                                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#db2b2b] hover:bg-[#c02525] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#db2b2b]"
                                          >
                                              Request
                                          </button>
                                        </td>
                                      </tr>
                                  ))}
                            </tbody>
                          </table>
                      </div>
                  )}
                  </section>
             ) : (
             
              <div className="space-y-16">
                
                <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-10 py-10">
                  <div className="flex-1 space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold text-[#db2b2b] leading-tight">
                      Donate Blood <br/>
                      <span className="text-[#db2b2b]">save a life.</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-lg">
                      Every drop counts. Join our community of heroes. Connect directly with those in need and make a difference in minutes.
                    </p>
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={handleBecomeDonorClick} 
                        className="px-8 py-3 bg-white text-[#db2b2b] border-2 border-[#db2b2b] rounded-full font-bold hover:bg-red-50 transition"
                      >
                        Donate Now
                      </button>
                      <button 
                        onClick={() => setShowRequestPopup(true)}
                        className="px-8 py-3 bg-white text-[#db2b2b] border-2 border-[#db2b2b] rounded-full font-bold hover:bg-red-50 transition"
                      >
                        Find Blood
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <img 
                      src="https://img.freepik.com/free-vector/blood-donation-concept-illustration_114360-1044.jpg" 
                      alt="Blood Donation Illustration" 
                      className="w-full max-w-md rounded-xl shadow-2xl"
                    />
                  </div>
                </section>
  
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="bg-white p-6">
                    <h3 className="text-4xl font-bold text-[#db2b2b] mb-2">100+</h3>
                    <p className="text-gray-600 font-medium">Donors Registered</p>
                  </div>
                  <div className="bg-white p-6">
                    <h3 className="text-4xl font-bold text-[#db2b2b] mb-2">70+</h3>
                    <p className="text-gray-600 font-medium">Lives Saved</p>
                  </div>
                  <div className="bg-white p-6">
                    <h3 className="text-4xl font-bold text-[#db2b2b] mb-2">24*7</h3>
                    <p className="text-gray-600 font-medium">Emergency Support</p>
                  </div>
                </section>
              </div>
           )}
      </main>
      
      {showDonorPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowDonorPopup(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowDonorPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            <h2 className="text-xl font-bold">Become a Donor</h2>
            <h3 className="text-xl font-bold">Thankyou For Saving a Life</h3>  
            
            <form onSubmit={handleDonorSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter your full name"
                  value={donorName} 
                  onChange={(e) => setDonorName(e.target.value)} 
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter your email"
                  value={donorEmail} 
                  onChange={(e) => setDonorEmail(e.target.value)} 
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter your phone number (10 digits)"
                  value={donorPhone} 
                  onChange={(e) => setDonorPhone(e.target.value)} 
                  required
                />
              </div>
             
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  value={donorBloodGroup} 
                  onChange={(e) => setDonorBloodGroup(e.target.value)}
                  required
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <div className="mb-6"> 
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter your city"
                  value={donorLocation} 
                  onChange={(e) => setDonorLocation(e.target.value)} 
                  required
                />
              </div>

              <div className="mb-6"> 
                <label className="block text-sm font-medium text-gray-700 mb-1">Availabale Quantity</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter Quantity"
                  value={donorAvailableQuantity} 
                  onChange={(e) => setAvailableQuantity(e.target.value)} 
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDonorPopup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#db2b2b] text-white rounded-lg font-semibold hover:bg-[#c02525] transition-colors"
                >
                  Submit 
                </button>
              </div>
            </form> 
          </div>
        </div>
      )}
      
      {showRequestPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowRequestPopup(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col">
                   <h2 className="text-xl font-bold">Request for Blood</h2>
                   <h3 className="text-xl font-bold">Always Available For You</h3>
                </div>
                <button onClick={() => setShowRequestPopup(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
              </div>

              <form className="space-y-4" onSubmit={handleRequestSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name <span className="text-red-500"></span></label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter patient's name" value={patientName} onChange={(event) => setPatientName(event.target.value)}/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group <span className="text-red-500"></span></label>
                  <select required className="w-full px-3 py-2 border border-gray-300 rounded" onChange={(e) => setBloodGroup(e.target.value)} value={bloodGroup}>
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"> Contact Email <span className="text-red-500"></span></label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Enter email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"> Phone No. <span className="text-red-500"></span></label>
                  <input type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter phone number (10 digits)" value={requestPhone} onChange={(e) => setRequestPhone(e.target.value)}/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How much blood required <span className="text-red-500"></span></label>
                  <input required type="number" className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter number of units" value={unitsRequired} onChange={(e) => setUnitsRequired(e.target.value)}/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How much Emergency <span className="text-red-500"></span></label>
                  <select required className="w-full px-3 py-2 border border-gray-300 rounded" value={emergencyLevel} onChange={(e) => setEmergencyLevel(e.target.value)}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital & Location <span className="text-red-500"></span></label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter hospital name and city" value={hospitalLocation} onChange={(e) => setHospitalLocation(e.target.value)}/>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRequestPopup(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-[#db2b2b] text-white rounded-lg font-semibold hover:bg-[#c02525] transition-colors">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home