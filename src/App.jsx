import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  updateDoc,
  setLogLevel
} from "firebase/firestore";
import { 
  Home, 
  User, 
  CheckSquare, 
  Search, 
  BarChart, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  X,
  Building,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Users,
  Key,
  Info,
  List,
  Grid
} from 'lucide-react';

// --- Global App Config ---
const APP_TITLE = "University Guest House";
const UNIVERSITY_NAME = "Himachal Pradesh University";

// --- Firebase Configuration ---
// This is the correct method for Vite.
// We assign import.meta.env to a variable to help linters/compilers.
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// --- Firebase App Initialization ---
let app;
let auth;
let db;
let bookingsCollectionRef;

// App ID setup for Firestore paths
const appId = typeof __app_id !== 'undefined' ? __app_id : 'guesthouse-portal';

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setLogLevel('debug'); // Optional: for detailed Firestore logs in console
  // Path for all bookings (publicly readable for status check, writable)
  bookingsCollectionRef = collection(db, `artifacts/${appId}/public/data/bookings`);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // You could show a full-page error component here
}

// --- Custom Hooks ---

/**
 * Custom hook to manage theme (light/dark mode)
 */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}

/**
 * Custom hook to listen to Firebase auth state
 */
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

// --- Main App Component ---

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { user: adminUser, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simple navigation handler
  const navigate = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false); // Close menu on navigation
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  // Show a loading screen while auth state is being determined
  if (authLoading) {
    return <FullScreenLoader />;
  }

  // Admin routing: If user is logged in, show Admin panel
  if (adminUser) {
    return (
      <AdminDashboard 
        user={adminUser} 
        onLogout={() => signOut(auth)} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Public routing
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-inter">
      <Header 
        navigate={navigate} 
        theme={theme} 
        toggleTheme={toggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <main className="pt-20">
        {currentPage === 'home' && <HomePage navigate={navigate} />}
        {currentPage === 'apply' && <BookingForm navigate={navigate} />}
        {currentPage === 'status' && <BookingStatus />}
        {currentPage === 'cancel' && <CancelBooking />}
        {currentPage === 'adminLogin' && <AdminLogin onLoginSuccess={() => navigate('home')} />}
        {/* Add placeholders for other pages from screenshot */}
        {currentPage === 'amenities' && <ComingSoonPage title="Amenities" />}
        {currentPage === 'gallery' && <ComingSoonPage title="Gallery" />}
        {currentPage === 'food' && <ComingSoonPage title="Food Items Rate" />}
        {currentPage === 'feedback' && <ComingSoonPage title="Feedback" />}
      </main>
      
      <Footer navigate={navigate} />
    </div>
  );
}

// --- Layout Components ---

function Header({ navigate, theme, toggleTheme, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const navItems = [
    { name: 'Home', page: 'home', icon: Home },
    { name: 'Apply for Booking', page: 'apply', icon: CheckSquare },
    { name: 'Check Booking Status', page: 'status', icon: Search },
    { name: 'Cancel Booking', page: 'cancel', icon: X },
    { name: 'Amenities', page: 'amenities', icon: Grid },
    { name: 'Gallery', page: 'gallery', icon: Info },
    { name: 'Food Items Rate', page: 'food', icon: List },
    { name: 'Feedback', page: 'feedback', icon: Info },
  ];

  return (
    <header className="fixed w-full bg-white dark:bg-gray-800 shadow-md z-50">
      {/* Top bar with contact info */}
      <div className="bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Phone size={14} className="mr-1 text-blue-600 dark:text-blue-400" />
              0177-2830915
            </span>
            <span className="flex items-center">
              <Building size={14} className="mr-1 text-blue-600 dark:text-blue-400" />
              Find Guest House Location
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Guide for Guest Users</span>
            {/* Social Icons Placeholder */}
            <div className="flex space-x-2">
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main header with Logo and University Name */}
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img 
            src="https://placehold.co/80x80/EBF8FF/3182CE?text=LOGO" 
            alt="University Logo" 
            className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover"
          />
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800 dark:text-blue-300">{UNIVERSITY_NAME}</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">(A State Government University Accredited with 'A' grade by NAAC)</p>
            <h2 className="text-md sm:text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-200">{APP_TITLE}</h2>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md md:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="hidden md:block bg-blue-800 dark:bg-blue-900">
        <div className="container mx-auto px-4">
          <ul className="flex justify-center space-x-1">
            {navItems.map(item => (
              <li key={item.page}>
                <button
                  onClick={() => navigate(item.page)}
                  className="flex items-center px-4 py-3 text-white font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                >
                  <item.icon size={16} className="mr-2" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-white dark:bg-gray-800 shadow-lg">
          <ul className="flex flex-col py-2">
            {navItems.map(item => (
              <li key={item.page}>
                <button
                  onClick={() => navigate(item.page)}
                  className="w-full flex items-center px-6 py-3 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <item.icon size={18} className="mr-3" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-gray-300 dark:text-gray-400 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Contact Table Section */}
        <div className="mb-12 max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white p-6 border-b border-gray-200 dark:border-gray-700">Contact Us</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">S. No.</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Designation</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">1</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Dr. Vinay Kumar Sharma</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">In charge Faculty House</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">2</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Mr. Ankush Verma</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Caretaker Faculty House</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Footer Section */}
        <div className="text-center">
          <p className="font-semibold text-lg mb-2">Address:-</p>
          <p className="mb-4">Himachal Pradesh University Summer Hill, Shimla - 171005</p>
          <div className="flex justify-center items-center space-x-6 mb-4">
            <span className="flex items-center">
              <Phone size={16} className="mr-2" />
              Faculty Guest House 0177-2830915
            </span>
            <span className="flex items-center">
              <Mail size={16} className="mr-2" />
              vc@hpuniv.ac.in
            </span>
          </div>
          <p className="mb-6">www.hpuniv.ac.in</p>
          
          {/* Quick Links */}
          <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-8 text-blue-300 dark:text-blue-400">
            <button onClick={() => navigate('home')} className="hover:underline">Home</button>
            <button onClick={() => navigate('apply')} className="hover:underline">Apply</button>
            <button onClick={() => navigate('status')} className="hover:underline">Check Status</button>
            <button onClick={() => navigate('adminLogin')} className="hover:underline">Admin Login</button>
            <button onClick={() => navigate('feedback')} className="hover:underline">Feedback</button>
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} {UNIVERSITY_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
            Portal designed & developed as a project.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col justify-center items-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">Loading Portal...</p>
    </div>
  );
}

function ComingSoonPage({ title }) {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">{title}</h2>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">This page is under construction.</p>
      <Building size={64} className="text-blue-600 dark:text-blue-400" />
    </div>
  );
}

// --- Page Components ---

function HomePage({ navigate }) {
  return (
    <div className="flex flex-col">
      {/* Hero Section with Image */}
      <div className="w-full h-[50vh] md:h-[70vh] bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
        {/* Placeholder for the main guesthouse image */}
        <img 
          src="https://placehold.co/1600x900/CCCCCC/777777?text=Faculty+Guest+House"
          alt="Faculty Guest House"
          className="w-full h-full object-cover"
        />
        {/* You can overlay text if needed */}
        {/* <h1 className="text-5xl text-white font-bold drop-shadow-lg">Welcome to the Guest House</h1> */}
      </div>

      {/* Action Cards Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ActionCard
              title="Book Now"
              description="Apply for Guest House Booking"
              icon={<User size={40} className="text-white" />}
              color="blue"
              onClick={() => navigate('apply')}
            />
            <ActionCard
              title="Booking Status"
              description="Check your Booking Status"
              icon={<ShieldCheck size={40} className="text-white" />}
              color="green"
              onClick={() => navigate('status')}
            />
            <ActionCard
              title="Cancel Booking"
              description="Cancel/Withdraw your Booking"
              icon={<X size={40} className="text-white" />}
              color="red"
              onClick={() => navigate('cancel')}
            />
            <ActionCard
              title="Location"
              description="View Location"
              icon={<Building size={40} className="text-white" />}
              color="gray"
              onClick={() => window.open('https://maps.google.com', '_blank')} // Placeholder link
            />
          </div>
        </div>
      </div>
      
      {/* How it works Section */}
      <div className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="relative flex flex-col md:flex-row justify-center items-center md:space-x-8">
            {/* Connecting Arrows (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-blue-300 dark:bg-blue-700" style={{ transform: 'translateY(-50%)', zIndex: 0 }}></div>
            
            <StepCard
              step="Step 1"
              description="Applicants will apply online and receive Application No via Email."
              icon={<Mail size={48} className="text-blue-600 dark:text-blue-400" />}
            />
            <StepCard
              step="Step 2"
              description="Authority will Approve or Reject the online Applications."
              icon={<Users size={48} className="text-blue-600 dark:text-blue-400" />}
            />
            <StepCard
              step="Step 3"
              description="Check In"
              icon={<Calendar size={48} className="text-blue-600 dark:text-blue-400" />}
            />
            <StepCard
              step="Step 4"
              description="Check Out"
              icon={<Key size={48} className="text-blue-600 dark:text-blue-400" />}
            />
          </div>
        </div>
      </div>

      {/* About Us & Amenities Section */}
      <div className="bg-white dark:bg-gray-800 py-20">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* About Us */}
          <div>
            <h2 className="text-3xl font-bold mb-6 relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-20 after:h-1 after:bg-blue-600">About Us</h2>
            <img 
              src="https://placehold.co/600x400/CCCCCC/777777?text=University+Building" 
              alt="University" 
              className="w-full h-auto rounded-lg shadow-lg mb-6"
            />
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Himachal Pradesh University was established by an Act of the Legislative Assembly of Himachal Pradesh on 22nd July, 1970. The headquarters of the University is located at Summer Hill, the picturesque suburb of Shimla.
              <br/><br/>
              The prime objective of the University is to disseminate knowledge, advance learning and understanding through research, training and extension programmes. It instils in its students and teachers a conscious awareness regarding the social and economic needs, cultural ethos, and future requirements of the state and the country.
            </p>
          </div>
          
          {/* Amenities */}
          <div>
            <h2 className="text-3xl font-bold mb-6 relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-20 after:h-1 after:bg-blue-600">Amenities</h2>
            <ul className="space-y-4 text-gray-600 dark:text-gray-300">
              <AmenityItem text="Comfortable guest rooms with a range of options." />
              <AmenityItem text="Heating: Climate control in rooms to ensure guest comfort." />
              <AmenityItem text="Bathroom facilities: Private or shared bathrooms with hot and cold water." />
              <AmenityItem text="Housekeeping: Regular room cleaning and fresh linens." />
              <AmenityItem text="Dining facilities: On-site dining options, including a Mess Service." />
              <AmenityItem text="Parking: Ample parking space for guests' vehicles." />
              <AmenityItem text="Reception desk: A front desk for check-in, check-out, and guest inquiries." />
            </ul>
             <img 
              src="https://placehold.co/600x400/EEEEEE/999999?text=Guest+Room+Interior" 
              alt="Guest Room" 
              className="w-full h-auto rounded-lg shadow-lg mt-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, description, icon, color, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-8 rounded-lg text-white text-left transition-all duration-300 transform hover:-translate-y-2 shadow-lg ${colorClasses[color]}`}
    >
      <div className="absolute top-4 right-4 p-4 bg-black bg-opacity-10 rounded-full">
        {icon}
      </div>
      <h3 className="text-3xl font-bold mb-2">{title}</h3>
      <p className="text-gray-200 mb-6">{description}</p>
      <div className="flex items-center text-sm font-medium">
        Apply Now <ArrowRight size={16} className="ml-2" />
      </div>
    </button>
  );
}

function StepCard({ step, description, icon }) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg w-60 m-4 md:m-0">
      <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">{step}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function AmenityItem({ text }) {
  return (
    <li className="flex items-start">
      <CheckSquare size={20} className="text-green-500 mr-3 flex-shrink-0 mt-1" />
      <span>{text}</span>
    </li>
  );
}


function BookingForm({ navigate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    checkIn: '',
    checkOut: '',
    guestType: '',
    numGuests: '1',
    purpose: '',
  });
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });

    // Simple Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.checkIn || !formData.checkOut || !formData.guestType) {
      setStatus({ loading: false, error: "Please fill in all required fields.", success: null });
      return;
    }
    
    try {
      // 1. Generate Application ID
      const applicationId = `HPU-${Date.now().toString().slice(-6)}`;
      
      // 2. Prepare data for Firestore
      const bookingData = {
        ...formData,
        applicationId,
        status: 'Pending', // Initial status
        submittedAt: new Date().toISOString(),
      };
      
      // 3. Save to Firestore
      if (!bookingsCollectionRef) throw new Error("Database not initialized.");
      await addDoc(bookingsCollectionRef, bookingData);

      // 4. Send Email Notification
      // This will call your serverless function
      await sendEmailNotification({
        to: formData.email,
        template: 'booking_submitted',
        data: {
          name: formData.name,
          applicationId: applicationId,
          checkIn: formData.checkIn,
        }
      });
      
      // 5. Show success
      setStatus({ loading: false, error: null, success: `Booking submitted successfully! Your Application ID is: ${applicationId}. Please check your email.` });
      setFormData({
        name: '', email: '', phone: '', address: '', checkIn: '', checkOut: '', guestType: '', numGuests: '1', purpose: '',
      });
      
      // Optional: redirect to status page
      // setTimeout(() => navigate('status'), 5000);

    } catch (error) {
      console.error("Booking submission error:", error);
      setStatus({ loading: false, error: `An error occurred: ${error.message}`, success: null });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">Guest House Booking Form</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <FormSection title="Personal Information">
              <FormInput label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
              <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
              <FormInput label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
              <FormTextarea label="Full Address" name="address" value={formData.address} onChange={handleChange} />
            </FormSection>

            <FormSection title="Booking Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Check-in Date" name="checkIn" type="date" value={formData.checkIn} onChange={handleChange} required />
                <FormInput label="Check-out Date" name="checkOut" type="date" value={formData.checkOut} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect 
                  label="Guest Type"
                  name="guestType"
                  value={formData.guestType}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Select Type', disabled: true },
                    { value: 'student', label: 'Student' },
                    { value: 'faculty', label: 'Faculty' },
                    { value: 'staff', label: 'Staff' },
                    { value: 'guest', label: 'Official Guest' },
                    { value: 'other', label: 'Other' },
                  ]}
                  required
                />
                <FormInput label="Number of Guests" name="numGuests" type="number" min="1" value={formData.numGuests} onChange={handleChange} required />
              </div>
              <FormTextarea label="Purpose of Visit" name="purpose" value={formData.purpose} onChange={handleChange} />
            </FormSection>

            <div className="pt-6">
              {status.error && <Message type="error" message={status.error} />}
              {status.success && <Message type="success" message={status.success} />}

              <button 
                type="submit" 
                disabled={status.loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {status.loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- Form Helper Components ---

function FormSection({ title, children }) {
  return (
    <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
      <legend className="px-2 text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</legend>
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  );
}

function FormInput({ label, name, type = 'text', value, onChange, required = false, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
    </div>
  );
}

function FormTextarea({ label, name, value, onChange, required = false }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        rows="3"
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options, required = false }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Message({ type, message }) {
  const baseClasses = "p-4 rounded-lg mb-6 text-sm";
  const typeClasses = {
    error: "bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200",
    success: "bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200",
  };
  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      {message}
    </div>
  );
}

// --- Status & Cancel Pages ---

function BookingStatus() {
  const [appId, setAppId] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: null });

  const handleSearch = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null });
    setBooking(null);

    if (!appId || !email) {
      setStatus({ loading: false, error: "Please enter both Application ID and Email." });
      return;
    }

    try {
      if (!bookingsCollectionRef) throw new Error("Database not initialized.");
      // Create a query to find the booking
      const q = query(
        bookingsCollectionRef, 
        where("applicationId", "==", appId.trim()),
        where("email", "==", email.trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setStatus({ loading: false, error: "No booking found with that Application ID and Email. Please check your details." });
      } else {
        // Should only be one doc, get the first
        const docData = querySnapshot.docs[0].data();
        setBooking(docData);
        setStatus({ loading: false, error: null });
      }
    } catch (error) {
      console.error("Booking status search error:", error);
      setStatus({ loading: false, error: `An error occurred: ${error.message}` });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 min-h-[70vh]">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">Check Booking Status</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <FormInput 
              label="Application ID" 
              name="appId" 
              value={appId} 
              onChange={(e) => setAppId(e.target.value)} 
              placeholder="e.g., HPU-123456" 
              required 
            />
            <FormInput 
              label="Email Address" 
              name="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="The email you used to book" 
              required 
            />
            <button 
              type="submit" 
              disabled={status.loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {status.loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                'Search Status'
              )}
            </button>
          </form>
        </div>

        {status.error && <Message type="error" message={status.error} />}
        
        {booking && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Booking Details</h3>
            <div className="space-y-3">
              <StatusDetail label="Applicant Name" value={booking.name} />
              <StatusDetail label="Application ID" value={booking.applicationId} />
              <StatusDetail label="Check-in" value={booking.checkIn} />
              <StatusDetail label="Check-out" value={booking.checkOut} />
              <StatusDetail label="Booking Status" value={booking.status} status={booking.status} />
              {booking.status === 'Rejected' && booking.rejectionReason && (
                <StatusDetail label="Reason for Rejection" value={booking.rejectionReason} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDetail({ label, value, status = null }) {
  let statusClass = '';
  if (status) {
    switch (status) {
      case 'Approved':
        statusClass = 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
        break;
      case 'Rejected':
        statusClass = 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
        break;
      case 'Pending':
        statusClass = 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
        break;
      default:
        statusClass = 'text-gray-700 dark:text-gray-300';
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-200 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${status ? `px-3 py-1 rounded-full ${statusClass}` : 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function CancelBooking() {
  // This would be very similar to BookingStatus
  // 1. Find the booking using ID and Email
  // 2. If status is "Pending", show a "Cancel Booking" button
  // 3. On click, update the document status to "Cancelled"
  // 4. Show success message
  return (
    <div className="container mx-auto px-4 py-16 min-h-[70vh]">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">Cancel Booking</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">Enter your details to find and cancel your booking. Only bookings that are still "Pending" can be cancelled here.</p>
          {/* Form similar to BookingStatus */}
          <form className="space-y-4">
            <FormInput label="Application ID" name="appId" placeholder="e.g., HPU-123456" required />
            <FormInput label="Email Address" name="email" type="email" placeholder="The email you used to book" required />
            <button 
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:bg-gray-400"
            >
              Find Booking to Cancel
            </button>
          </form>
        </div>
        {/* Logic to show booking details and cancel button would go here */}
      </div>
    </div>
  );
}


// --- Admin Panel Components ---

function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null });

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null });

    if (!auth) {
      setStatus({ loading: false, error: "Authentication service not available." });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus({ loading: false, error: null });
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      console.error("Admin login error:", error);
      setStatus({ loading: false, error: "Invalid email or password." });
    }
  };

  return (
    <div className="flex items-center justify-center py-16 bg-gray-50 dark:bg-gray-900 min-h-[70vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">Admin Portal Login</h2>
        <form className="space-y-6" onSubmit={handleLogin}>
          <FormInput 
            label="Admin Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormInput 
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {status.error && <Message type="error" message={status.error} />}

          <button 
            type="submit" 
            disabled={status.loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {status.loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Log In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ user, onLogout, theme, toggleTheme }) {
  const [page, setPage] = useState('dashboard'); // dashboard, settings
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener for bookings
  useEffect(() => {
    if (!bookingsCollectionRef) {
      setError("Database not initialized.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    // Query to get all bookings, you might want to order by date
    const q = query(bookingsCollectionRef); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData = [];
      querySnapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() });
      });
      // Sort by submission date, newest first
      bookingsData.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setBookings(bookingsData);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to bookings:", err);
      setError("Failed to load bookings.");
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const handleUpdateStatus = async (id, newStatus, emailData, rejectionReason = '') => {
    try {
      const docRef = doc(db, `artifacts/${appId}/public/data/bookings`, id);
      
      const updateData = { status: newStatus };
      if (newStatus === 'Rejected') {
        updateData.rejectionReason = rejectionReason;
      }
      
      await updateDoc(docRef, updateData);
      
      // Send email notification on status change
      await sendEmailNotification({
        to: emailData.email,
        template: newStatus === 'Approved' ? 'booking_approved' : 'booking_rejected',
        data: {
          name: emailData.name,
          applicationId: emailData.applicationId,
          checkIn: emailData.checkIn,
        }
      });
      
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. " + error.message); // Simple alert for admin
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <nav className="w-64 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{APP_TITLE}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Admin Panel</p>
        </div>
        <ul className="flex-grow">
          <AdminNavLink icon={BarChart} label="Dashboard" onClick={() => setPage('dashboard')} active={page === 'dashboard'} />
          <AdminNavLink icon={Settings} label="Settings" onClick={() => setPage('settings')} active={page === 'settings'} />
        </ul>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={toggleTheme} className="w-full flex items-center p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mb-2">
            {theme === 'light' ? <Moon size={18} className="mr-3" /> : <Sun size={18} className="mr-3" />}
            Toggle Theme
          </button>
          <button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900">
            <LogOut size={18} className="mr-3" />
            Logout
          </button>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-x-auto">
        {page === 'dashboard' && (
          <BookingDashboard 
            bookings={bookings} 
            loading={loading}
            error={error}
            onUpdateStatus={handleUpdateStatus} 
          />
        )}
        {page === 'settings' && <AdminSettings user={user} />}
      </main>
    </div>
  );
}

function AdminNavLink({ icon: Icon, label, onClick, active }) {
  return (
    <li>
      <button 
        onClick={onClick}
        className={`w-full flex items-center p-4 text-left ${
          active 
            ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Icon size={20} className="mr-4" />
        <span className="font-medium">{label}</span>
      </button>
    </li>
  );
}

function BookingDashboard({ bookings, loading, error, onUpdateStatus }) {
  const [filter, setFilter] = useState('Pending'); // All, Pending, Approved, Rejected
  
  const filteredBookings = bookings.filter(b => {
    if (filter === 'All') return true;
    return b.status === filter;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Booking Dashboard</h1>
      
      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        <FilterButton label="Pending" onClick={() => setFilter('Pending')} active={filter === 'Pending'} />
        <FilterButton label="Approved" onClick={() => setFilter('Approved')} active={filter === 'Approved'} />
        <FilterButton label="Rejected" onClick={() => setFilter('Rejected')} active={filter === 'Rejected'} />
        <FilterButton label="All" onClick={() => setFilter('All')} active={filter === 'All'} />
      </div>

      {/* Content */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
        </div>
      )}
      {error && <Message type="error" message={error} />}
      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <Th>Applicant</Th>
                  <Th>Contact</Th>
                  <Th>Dates</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-500 dark:text-gray-400">
                      No {filter} bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(booking => (
                    <BookingRow 
                      key={booking.id} 
                      booking={booking} 
                      onUpdateStatus={onUpdateStatus} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{children}</th>;
}

function Td({ children, className = '' }) {
  return <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>{children}</td>;
}

function BookingRow({ booking, onUpdateStatus }) {
  const [showModal, setShowModal] = useState(false);
  
  const emailData = {
    email: booking.email,
    name: booking.name,
    applicationId: booking.applicationId,
    checkIn: booking.checkIn,
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <Td>
        <div className="font-medium text-gray-900 dark:text-white">{booking.name}</div>
        <div className="text-gray-500 dark:text-gray-400">{booking.applicationId}</div>
      </Td>
      <Td>
        <div className="text-gray-900 dark:text-white">{booking.email}</div>
        <div className="text-gray-500 dark:text-gray-400">{booking.phone}</div>
      </Td>
      <Td>
        <div className="text-gray-900 dark:text-white">In: {booking.checkIn}</div>
        <div className="text-gray-500 dark:text-gray-400">Out: {booking.checkOut}</div>
      </Td>
      <Td>
        <StatusDetail value={booking.status} status={booking.status} />
      </Td>
      <Td>
        {booking.status === 'Pending' ? (
          <div className="flex space-x-2">
            <button 
              onClick={() => onUpdateStatus(booking.id, 'Approved', emailData)}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200"
            >
              Approve
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200"
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">Actioned</span>
        )}
      </Td>
      
      {showModal && (
        <RejectModal
          onClose={() => setShowModal(false)}
          onConfirm={(reason) => {
            onUpdateStatus(booking.id, 'Rejected', emailData, reason);
            setShowModal(false);
          }}
        />
      )}
    </tr>
  );
}

function FilterButton({ label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium ${
        active 
          ? 'bg-blue-600 text-white shadow' 
          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

function RejectModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reason for Rejection</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Please provide a reason for rejecting this booking. This will be recorded and sent to the applicant.
        </p>
        <FormTextarea
          label="Rejection Reason"
          name="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <div className="flex justify-end space-x-3 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(reason)}
            disabled={!reason}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}


function AdminSettings({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Settings</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Admin Account</h2>
        <div className="space-y-3">
          <StatusDetail label="Admin Email" value={user.email} />
          <StatusDetail label="User ID" value={user.uid} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
          To change your password or manage admin accounts, please visit the Firebase Authentication console.
        </p>
      </div>
    </div>
  );
}


// --- Email Sending Function ---

/**
 * Sends an email by calling our Vercel serverless function.
 * @param {object} { to, template, data }
 * to: user's email
 * template: 'booking_submitted', 'booking_approved', 'booking_rejected'
 * data: { name, applicationId, checkIn }
 */
async function sendEmailNotification({ to, template, data }) {
  console.log("Attempting to send email:", { to, template, data });
  try {
    const response = await fetch('/api/sendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, template, data }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    console.log("Email send success:", result.message);
    return true;

  } catch (error) {
    console.error("sendEmailNotification error:", error);
    // We don't block the user's flow, just log the error
    // In a real app, you'd add this to a retry queue
    return false;
  }
}




