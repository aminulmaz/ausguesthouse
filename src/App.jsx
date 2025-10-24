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
  setLogLevel,
  writeBatch, // Import writeBatch
  setDoc      // Import setDoc
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
// This is the 100% correct way for Vite.
// The warnings in the build tool can be ignored.
// The "process is not defined" error confirms this is the right syntax.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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
          
          <div className="flex justify-center space-x-6 mb-8">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">Home</button>
            <button onClick={() => navigate('adminLogin')} className="hover:text-white transition-colors">Admin Login</button>
            <button onClick={() => navigate('status')} className="hover:text-white transition-colors">Check Status</button>
          </div>

          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} {UNIVERSITY_NAME}. All rights reserved.</p>
          <p className="text-sm text-gray-500">Guest House Portal Maintained by Department of Computer Science</p>
        </div>
      </div>
    </footer>
  );
}

// --- Page Components ---

/**
 * HomePage Component
 * Renders the main landing page with action cards.
 */
function HomePage({ navigate }) {
  const heroImage = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";
  
  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full">
        <img 
          src={heroImage} 
          alt="Guest House" 
          className="w-full h-full object-cover"
          onError={(e) => e.target.src = 'https://placehold.co/1600x600/3182CE/EBF8FF?text=Welcome+to+Our+Guest+House'}
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white text-center shadow-lg px-4">
            Welcome to the {APP_TITLE}
          </h1>
        </div>
      </div>

      {/* Action Cards Section (from screenshot) */}
      <section className="relative -mt-20 z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <ActionCard
            title="Book Now"
            description="Apply for Guest House Booking"
            icon={CheckSquare}
            color="blue"
            onClick={() => navigate('apply')}
          />
          <ActionCard
            title="Booking Status"
            description="Check your Booking Status"
            icon={Search}
            color="green"
            onClick={() => navigate('status')}
          />
          <ActionCard
            title="Cancel"
            description="Cancel/Withdraw your Booking"
            icon={X}
            color="red"
            onClick={() => navigate('cancel')}
          />
          <ActionCard
            title="Location"
            description="View Guest House Location"
            icon={Building}
            color="gray"
            onClick={() => { /* Implement location logic, e.g., open maps */ }}
          />
        </div>
      </section>

      {/* How it Works Section (from screenshot) */}
      <section className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">How It Works</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-0">
          <StepCard
            step="Step 1"
            title="Apply Online"
            description="Applicants will apply online and receive Application No via Email/SMS."
          />
          <StepArrow />
          <StepCard
            step="Step 2"
            title="Approval"
            description="Authority will Approve or Reject the online Applications."
          />
          <StepArrow />
          <StepCard
            step="Step 3"
            title="Check In"
            description="Guest checks in at the reception on the booking date."
          />
          <StepArrow />
          <StepCard
            step="Step 4"
            title="Check Out"
            description="Guest completes formalities and checks out."
          />
        </div>
      </section>

      {/* About Us & Amenities Section (from screenshot) */}
      <section className="bg-gray-50 dark:bg-gray-800 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* About Us */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">About Us</h2>
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <img 
                src="https://placehold.co/600x400/EBF8FF/3182CE?text=University+Image" 
                alt="University" 
                className="w-full md:w-1/2 h-auto rounded-lg shadow-lg object-cover"
              />
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Himachal Pradesh University was established by an Act of the Legislative Assembly of Himachal Pradesh on 22nd July, 1970. The headquarters of the University is located at Summer Hill, a suburb of Shimla.
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              The prime objective of the University is to disseminate knowledge, advance learning and understanding through research, training and extension programmes. It instills in its students and teachers a conscious awareness regarding the social and economic needs, cultural ethos, and future requirements of the state and the country.
            </p>
          </div>
          {/* Amenities */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Amenities</h2>
            <div className="flex flex-col-reverse md:flex-row items-center gap-6 mb-6">
              <ul className="text-gray-600 dark:text-gray-300 space-y-3">
                <AmenityItem>Comfortable guest rooms (single, double).</AmenityItem>
                <AmenityItem>Climate control in rooms.</AmenityItem>
                <AmenityItem>Private or shared bathrooms.</AmenityItem>
                <AmenityItem>Regular room cleaning and fresh linens.</AmenityItem>
                <AmenityItem>On-site dining options, including a Mess Service.</AmenityItem>
                <AmenityItem>Ample parking space for guests' vehicles.</AmenityItem>
                <AmenityItem>Reception desk for check-in, check-out.</AmenityItem>
              </ul>
              <img 
                src="https://placehold.co/600x400/EBF8FF/3182CE?text=Amenity+Image" 
                alt="Amenities" 
                className="w-full md:w-1/2 h-auto rounded-lg shadow-lg object-cover"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Please note that the availability of these amenities can vary. It's a good idea to check with the guest house directly for exact offerings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ActionCard({ title, description, icon: Icon, color, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full ${colorClasses[color]} text-white p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="p-4 bg-white bg-opacity-20 rounded-full mb-4">
          <Icon size={40} className="text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-blue-100 mb-4">{description}</p>
        <span className="flex items-center text-sm font-semibold">
          Click Here <ArrowRight size={16} className="ml-1" />
        </span>
      </div>
    </button>
  );
}

function StepCard({ step, title, description }) {
  return (
    <div className="flex-1 max-w-xs text-center p-6 bg-cyan-500 text-white rounded-lg shadow-lg m-2">
      <div className="text-sm font-bold bg-white text-cyan-600 rounded-full py-1 px-3 inline-block mb-4">{step}</div>
      {/* Icon Placeholder */}
      <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full mx-auto mb-4 flex items-center justify-center">
        <User size={32} /> {/* Placeholder icon */}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  );
}

function StepArrow() {
  return (
    <div className="hidden md:block mx-4">
      <ArrowRight size={40} className="text-gray-400 dark:text-gray-600" />
    </div>
  );
}

function AmenityItem({ children }) {
  return (
    <li className="flex items-center">
      <ShieldCheck size={20} className="text-green-500 mr-3 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

/**
 * BookingForm Component
 * Renders the form for submitting a new booking.
 */
function BookingForm({ navigate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    idProof: 'aadhar',
    idNumber: '',
    checkIn: '',
    checkOut: '',
    guestCount: '1',
    purpose: 'official'
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      setError("Check-out date must be after check-in date.");
      setIsLoading(false);
      return;
    }

    try {
      const applicationId = generateApplicationId();
      // This 'data' object MUST match the firestore.rules
      const data = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        idProof: formData.idProof,
        idNumber: formData.idNumber,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guestCount: parseInt(formData.guestCount, 10),
        purpose: formData.purpose,
        status: "Pending",
        applicationId: applicationId,
        submittedAt: new Date().toISOString()
      };

      // --- Batched Write ---
      // This is an atomic operation: both writes succeed or both fail.
      const batch = writeBatch(db);

      // 1. Set the private booking document
      const bookingDocRef = doc(bookingsCollectionRef); // Creates a new doc ref
      batch.set(bookingDocRef, data);

      // 2. Set the public, non-sensitive status lookup document
      const statusLookupRef = doc(db, `artifacts/${appId}/public/data/statusLookup`, data.applicationId);
      batch.set(statusLookupRef, {
        status: "Pending",
        checkIn: data.checkIn
      });

      // Commit the batch
      await batch.commit();
      
      // --- End Batched Write ---

      setSuccess(`Your application has been submitted! Your Application ID is: ${applicationId}. Please save this for future reference.`);
      
      // Send email notification
      sendEmailNotification(data.email, 'booking_submitted', {
        name: data.name,
        applicationId: data.applicationId,
        checkIn: data.checkIn
      });
      
      setFormData({
        name: '', email: '', phone: '', address: '', idProof: 'aadhar',
        idNumber: '', checkIn: '', checkOut: '', guestCount: '1', purpose: 'official'
      });
      // Optionally navigate away after a delay
      // setTimeout(() => navigate('home'), 5000);

    } catch (err) {
      console.error(err);
      setError("Failed to submit application. Please check your network connection and try again. " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center text-blue-800 dark:text-blue-300 mb-8">Guest House Booking Form</h2>

          {error && <FormAlert type="error" message={error} />}
          {success && <FormAlert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Sections */}
            <FormSection title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                <FormInput label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                <FormInput label="Address" name="address" value={formData.address} onChange={handleChange} required />
                <FormSelect
                  label="ID Proof Type"
                  name="idProof"
                  value={formData.idProof}
                  onChange={handleChange}
                  options={[
                    { value: 'aadhar', label: 'Aadhar Card' },
                    { value: 'passport', label: 'Passport' },
                    { value: 'driving_license', label: 'Driving License' },
                    { value: 'voter_id', label: 'Voter ID' },
                  ]}
                />
                <FormInput label="ID Number" name="idNumber" value={formData.idNumber} onChange={handleChange} required />
              </div>
            </FormSection>

            <FormSection title="Booking Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Check-in Date" name="checkIn" type="date" value={formData.checkIn} onChange={handleChange} required />
                <FormInput label="Check-out Date" name="checkOut" type="date" value={formData.checkOut} onChange={handleChange} required />
                <FormInput label="Number of Guests" name="guestCount" type="number" min="1" max="10" value={formData.guestCount} onChange={handleChange} required />
                <FormSelect
                  label="Purpose of Visit"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  options={[
                    { value: 'official', label: 'Official' },
                    { value: 'personal', label: 'Personal' },
                    { value: 'event', label: 'Event/Conference' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
            </FormSection>

            <div className="pt-6 text-center">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-1/2 inline-flex justify-center items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Submitting...
                  </>
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

/**
 * BookingStatus Component
 * Renders the page to check booking status.
 */
function BookingStatus() {
  const [searchTerm, setSearchTerm] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
  
    setIsLoading(true);
    setBooking(null);
    setError(null);
  
    try {
      // This is now a secure 'get' operation from the public lookup collection
      // We only search by Application ID, as phone/email is private.
      const docRef = doc(db, `artifacts/${appId}/public/data/statusLookup`, searchTerm.trim());
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        // We found the status!
        setBooking({
          applicationId: docSnap.id,
          ...docSnap.data()
        });
      } else {
        // No status found for this ID
        setError("No booking found with that Application ID. Please check the ID and try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching your booking status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center text-blue-800 dark:text-blue-300 mb-8">Check Booking Status</h2>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
            <label htmlFor="search-term" className="sr-only">Application ID</label>
            <input
              id="search-term"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter your Application ID"
              required
              className="flex-grow w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? <Spinner /> : <Search size={20} className="mr-2" />}
              Search
            </button>
          </form>

          {error && <FormAlert type="error" message={error} />}

          {booking && (
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Booking Status</h3>
              <div className="space-y-3">
                <StatusItem label="Application ID" value={booking.applicationId} />
                <StatusItem label="Check-in Date" value={booking.checkIn} />
                <StatusItem label="Status">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                    booking.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}>
                    {booking.status}
                  </span>
                </StatusItem>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * CancelBooking Component
 * Placeholder for booking cancellation.
 */
function CancelBooking() {
  // Future implementation:
  // 1. Search for booking by ID (similar to BookingStatus)
  // 2. If found and status is "Pending" or "Approved", allow cancellation.
  // 3. This would require an admin-like permission or a secure token.
  // 4. For now, it's a "Coming Soon" page.
  return <ComingSoonPage title="Cancel Booking" />;
}

/**
 * AdminLogin Component
 * Renders the login form for the admin.
 */
function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!auth) throw new Error("Firebase not initialized");
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess(); // Callback to App to change state
    } catch (err) {
      console.error(err);
      setError("Failed to login. Please check your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center text-blue-800 dark:text-blue-300 mb-8">Admin Login</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <FormInput 
              label="Email" 
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
            
            {error && <FormAlert type="error" message={error} />}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-lg font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? <Spinner /> : <Key size={20} className="mr-2" />}
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminDashboard Component
 * Main panel for admin to manage bookings.
 */
function AdminDashboard({ user, onLogout, theme, toggleTheme }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real-time listener for bookings
  useEffect(() => {
    if (!bookingsCollectionRef) {
      setError("Firestore is not initialized.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // onSnapshot listens for real-time updates
    // This query will now work because the user is authenticated (admin)
    const unsubscribe = onSnapshot(bookingsCollectionRef, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by submittedAt, newest first
      bookingsData.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setBookings(bookingsData);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setError("Failed to load bookings. Check Firestore security rules.");
      setIsLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (booking, newStatus) => {
    if (!newStatus || newStatus === booking.status) return;
    
    try {
      // Use a batched write to update both collections atomically
      const batch = writeBatch(db);

      // 1. Update the private booking document
      const bookingDocRef = doc(db, `artifacts/${appId}/public/data/bookings`, booking.id);
      batch.update(bookingDocRef, { status: newStatus });

      // 2. Update the public status lookup document
      const statusLookupRef = doc(db, `artifacts/${appId}/public/data/statusLookup`, booking.applicationId);
      batch.update(statusLookupRef, { status: newStatus });
      
      // Commit the batch
      await batch.commit();

      // Send email notification
      sendEmailNotification(booking.email, 
        newStatus === 'Approved' ? 'booking_approved' : 'booking_rejected', 
        {
          name: booking.name,
          applicationId: booking.applicationId,
          checkIn: booking.checkIn
        }
      );

    } catch (err) {
      console.error("Failed to update status: ", err);
      // You could show an error toast to the admin here
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const filteredBookings = bookings; // Add filter logic here later

  const stats = [
    { name: 'Total Bookings', value: bookings.length, icon: Calendar },
    { name: 'Pending', value: bookings.filter(b => b.status === 'Pending').length, icon: Users },
    { name: 'Approved', value: bookings.filter(b => b.status === 'Approved').length, icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`relative ${isSidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 hidden md:block`}>
        <div className="flex items-center justify-between p-4 h-20 border-b dark:border-gray-700">
          <span className={`font-bold text-xl text-blue-800 dark:text-blue-300 ${!isSidebarOpen && 'hidden'}`}>Admin</span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <AdminNavItem icon={BarChart} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isSidebarOpen={isSidebarOpen} />
          <AdminNavItem icon={Settings} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isSidebarOpen={isSidebarOpen} />
          {/* Add more nav items here */}
        </nav>
        <div className="absolute bottom-0 left-0 w-full p-4 border-t dark:border-gray-700">
          <AdminNavItem icon={LogOut} label="Logout" onClick={onLogout} isSidebarOpen={isSidebarOpen} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-20 p-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Welcome, Admin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button onClick={onLogout} className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
              <LogOut size={20} />
            </button>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {stats.map(stat => (
                  <div key={stat.name} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      stat.name === 'Total Bookings' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                      stat.name === 'Pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bookings Table / Grid */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Bookings</h2>
                  <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      <List size={20} />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      <Grid size={20} />
                    </button>
                  </div>
                </div>

                {isLoading && <FullScreenLoader />}
                {error && <FormAlert type="error" message={error} />}
                
                {!isLoading && !error && viewMode === 'list' && (
                  <BookingList 
                    bookings={filteredBookings} 
                    onStatusChange={handleStatusChange} 
                  />
                )}
                {!isLoading && !error && viewMode === 'grid' && (
                  <BookingGrid 
                    bookings={filteredBookings} 
                    onStatusChange={handleStatusChange} 
                  />
                )}
              </div>
            </div>
          )}
          {activeTab === 'settings' && <ComingSoonPage title="Settings" />}
        </main>
      </div>
    </div>
  );
}

// --- Helper & Utility Components ---

function AdminNavItem({ icon: Icon, label, isActive, onClick, isSidebarOpen }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${!isSidebarOpen && 'justify-center'}`}
    >
      <Icon size={20} />
      <span className={!isSidebarOpen ? 'hidden' : ''}>{label}</span>
    </button>
  );
}

function BookingList({ bookings, onStatusChange }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left">
        <thead className="border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Applicant</th>
            <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Dates</th>
            <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Application ID</th>
            <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Status</th>
            <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {bookings.map(booking => (
            <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="p-4">
                <div className="font-medium text-gray-900 dark:text-white">{booking.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{booking.email}</div>
              </td>
              <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                {booking.checkIn} to {booking.checkOut}
              </td>
              <td className="p-4">
                <span className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
                  {booking.applicationId}
                </span>
              </td>
              <td className="p-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                  booking.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                }`}>
                  {booking.status}
                </span>
              </td>
              <td className="p-4">
                <select
                  value={booking.status}
                  onChange={(e) => onStatusChange(booking, e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approve</option>
                  <option value="Rejected">Reject</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingGrid({ bookings, onStatusChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookings.map(booking => (
        <div key={booking.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-6 space-y-4">
          <div>
            <div className="font-semibold text-lg text-gray-900 dark:text-white">{booking.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{booking.email}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{booking.phone}</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-700 dark:text-gray-300">Dates:</div>
            <div className="text-gray-600 dark:text-gray-200">{booking.checkIn} to {booking.checkOut}</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-700 dark:text-gray-300">App ID:</div>
            <span className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md">
              {booking.applicationId}
            </span>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Status:</div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
              booking.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
            }`}>
              {booking.status}
            </span>
          </div>
          <div>
            <label htmlFor={`status-select-${booking.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">Change Status</label>
            <select
              id={`status-select-${booking.id}`}
              value={booking.status}
              onChange={(e) => onStatusChange(booking, e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pending">Pending</o'ption>
              <option value="Approved">Approve</option>
              <option value="Rejected">Reject</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}


// --- Helper & Utility Components ---

function ComingSoonPage({ title }) {
  return (
    <div className="text-center py-20 px-4">
      <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">{title}</h2>
      <p className="text-xl text-gray-600 dark:text-gray-400">This page is under construction. Please check back later!</p>
    </div>
  );
}

function StatusItem({ label, value, children }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      {value ? <span className="text-base font-semibold text-gray-900 dark:text-white">{value}</span> : children}
    </div>
  );
}

function FormInput({ label, name, type = 'text', value, onChange, required = false, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options, required = false }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
      <legend className="px-2 text-lg font-medium text-gray-800 dark:text-gray-200">{title}</legend>
      {children}
    </fieldset>
  );
}

function FormAlert({ type, message }) {
  const isError = type === 'error';
  return (
    <div className={`p-4 mb-6 rounded-lg ${isError ? 'bg-red-50 dark:bg-red-900' : 'bg-green-50 dark:bg-green-900'}`}>
      <p className={`text-sm font-medium ${isError ? 'text-red-800 dark:text-red-100' : 'text-green-800 dark:text-green-100'}`}>
        {message}
      </p>
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-white dark:bg-gray-900">
      <Spinner size="lg" />
    </div>
  );
}

function Spinner({ size = 'md' }) {
  const sizeClasses = size === 'lg' ? 'w-12 h-12' : 'w-5 h-5';
  return (
    <svg
      className={`animate-spin ${sizeClasses} ${size === 'lg' ? '' : 'mr-3'} text-blue-600 dark:text-blue-400`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

// --- Utility Functions ---

/**
 * Generates a unique Application ID
 */
function generateApplicationId() {
  const timestamp = new Date().getTime().toString(36).slice(-4);
  const randomPart = Math.random().toString(36).slice(2, 7);
  return `HPU-${timestamp}-${randomPart}`.toUpperCase();
}

/**
 * Calls our serverless function to send an email.
 */
async function sendEmailNotification(to, template, data) {
  console.log(`Sending email '${template}' to ${to} with data:`, data);
  try {
    const response = await fetch('/api/sendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, template, data }),
    });

    if (!response.ok) {
      const res = await response.json();
      throw new Error(res.message || 'Email API request failed');
    }
    
    console.log("Email sent successfully via serverless function.");

  } catch (error) {
    console.error("Failed to send email:", error);
    // Don't block user flow, just log the error
  }
}

