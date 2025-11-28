import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const staticDonorData = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91-9876543210",
    bloodGroup: "O+",
    location: "Mumbai, Maharashtra",
    availablequantity: "450 ml",
    id: 1,
  },
  {
    name: "Priya Patel",
    email: "priya.p@example.com",
    phone: "+91-8765432109",
    bloodGroup: "A-",
    location: "Ahmedabad, Gujarat",
    availablequantity: "350 ml",
    id: 2,
  },
  {
    name: "John Doe",
    email: "johndoe88@testmail.com",
    phone: "+1-555-0123",
    bloodGroup: "B+",
    location: "New York, USA",
    availablequantity: "1 Unit",
    id: 3,
  },
  {
    name: "Sneha Gupta",
    email: "sneha.gupta@example.in",
    phone: "+91-7654321098",
    bloodGroup: "AB+",
    location: "Delhi, India",
    availablequantity: "450 ml",
    id: 4,
  },
  {
    name: "David Smith",
    email: "dsmith.donates@email.com",
    phone: "+44-7700-900077",
    bloodGroup: "O-",
    location: "London, UK",
    availablequantity: "500 ml",
    id: 5,
  },
  {
    name: "Fatima Khan",
    email: "fatima.k@example.com",
    phone: "+91-9988776655",
    bloodGroup: "B-",
    location: "Bangalore, Karnataka",
    availablequantity: "350 ml",
    id: 6,
  }
];

function Home() {
  const { currentUser, signOut, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [donors, setDonors] = useState(staticDonorData); 
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
  

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      navigate('/login')
    }
  }

  const handleDonorSubmit = (e) => {
    e.preventDefault()

    const donorData = {
      name: donorName,
      email: donorEmail,
      phone: donorPhone,
      bloodGroup: donorBloodGroup,
      location: donorLocation,
      availablequantity: donorAvailableQuantity, 
      id: Date.now(),
    };

    setDonors(prevDonors => [donorData, ...prevDonors]); 
    console.log('Donor form submitted. Data:', donorData);
    
    setShowDonorPopup(false)
    setDonorName(""); setDonorPhone(""); setDonorBloodGroup(""); setDonorLocation(""); setAvailableQuantity(0);
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()

    const requestData = {
      patientName,
      bloodGroup,
      requestEmail,
      requestPhone,
      unitsRequired,
      emergencyLevel,
      hospitalLocation,
    };

    console.log('Request form submitted. Data:', requestData)

    setShowRequestPopup(false)
   
    setPatientName(""); setBloodGroup(""); setRequestPhone(""); setUnitsRequired(""); setHospitalLocation("");
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
              onClick={() => setShowDonorPopup(true)}
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
              <li><Link to="/" className="text-white hover:text-red-700 font-semibold">Home</Link></li>
              <li><Link to="/profile" className="text-white hover:text-red-700 font-semibold">Profile</Link></li>
              <li>
                <button 
                  onClick={() => setShowDonorPopup(true)}
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
       
        {isAuthenticated && (
            <section className="bg-white p-7 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 className="text-2xl font-bold text-gray-800">Available Donors</h3>
                    <button 
                        className="bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                    </button>
                </div>
                <p className="text-gray-500 mb-4 text-sm">Availability of donors nearby</p>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">DONOR NAME</td>
                              <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">EMAIL</td>
                              <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">CONTACT</td>
                              <td className="px-6 py-3 text-left text-xs font-medium text-gray-600  uppercase tracking-wider">BLOOD TYPE</td>
                              <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">LOCATION</td>
                              <td className="px-6 py-3 text-left text-xs font-medium  text-gray-600 uppercase tracking-wider">AVAILABLE QUANTITY</td>
                              <td className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">REQUEST</td>
                            </tr>
        
                          {donors.map((donor, index) => (
                          <tr key={donor.id || index}>
                                    
                          <td className="px-6 py-4 whitespace-nowrap">
                               <div className="flex items-center">
                              <div className="ml-4">
                                   <div className="text-sm font-medium text-gray-900">{donor.name}</div>                                        
                                   {donor.email.includes('example') && (
                                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                         
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
                                            donor.bloodGroup.includes('+') ? 'bg-red-100 text-red-700':'bg-red-100 text-red-700'
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
                                            onClick={() => console.log(`Request to ${donor.name}`)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#db2b2b] hover:bg-[#c02525] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#db2b2b]"
                                        >
                                            Request
                                        </button>
                                      </td>
                                    </tr>
                                ))}
                           
                        </table>
                     </div>
                  </section>
             )}
      </main>

      <footer className="bg-[#f1f7f7] py-4 mt-8 border-t border-black/5">
        <div className="max-w-[1400px] mx-auto px-4 text-[#053c3c] text-center">
          <p>&copy; <span>{new Date().getFullYear()}</span> Footer</p>
        </div>
      </footer>

{showDonorPopup && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowDonorPopup(false)}>
    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
      
      
      <button
        onClick={() => setShowDonorPopup(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
      >
        &times;
      </button>

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
            placeholder="Enter your phone number"
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
                <button
                  onClick={() => setShowRequestPopup(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                  type="button"
                >
                  &times;
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleRequestSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name <span className="text-red-500"></span></label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Enter patient's name"
                    value={patientName}
                    onChange={(event) => setPatientName(event.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group <span className="text-red-500"></span></label>
                  <select 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded" 
                    onChange={(e) => setBloodGroup(e.target.value)} 
                    value={bloodGroup}
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
                  <input
                    type="tel"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Enter phone number"
                    value={requestPhone}
                    onChange={(e) => setRequestPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How much blood required <span className="text-red-500"></span></label>
                  <input
                    required
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Enter number of units"
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How much Emergency <span className="text-red-500"></span></label>
                  <select 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    value={emergencyLevel}
                    onChange={(e) => setEmergencyLevel(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital & Location <span className="text-red-500"></span></label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Enter hospital name and city"
                    value={hospitalLocation}
                    onChange={(e) => setHospitalLocation(e.target.value)}
                  />
                </div>

                

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestPopup(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#db2b2b] text-white rounded-lg font-semibold hover:bg-[#c02525] transition-colors"
                  >
                    Submit Request
                  </button>
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