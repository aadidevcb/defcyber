'use client';
import useFetchGraphQL from './data-extraction';
import { request, gql } from 'graphql-request';
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

// Chart.js imports
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);
// GraphQL query and fetching handled by useFetchGraphQL

const QUERY=gql`query{
    checkFileHash{
      exists
    }
    getOutput{
      count
      affected
    }
    getPorts{
      openPorts
    }
  }`;

const LOCKDOWN=gql`
  query {
    lockdown
  }`;

  const RELEASE_LOCKDOWN=gql`
  query {
    releaseLockdown
  }`;

const HASH_QUERY = gql`
  query {
    checkFileHash {
      exists
    }
  }
`;

const NETWORK_QUERY = gql`
  query {
    network_check
  }
`;

const OPEN_PORTS_QUERY = gql`
  query {
    open_ports
  }
`;



  

function Home() {
  // Array to store count values for plotting
  const [countHistory, setCountHistory] = useState([]);


  // Use the custom hook to fetch GraphQL data
  const { data, loading, error } = useFetchGraphQL(QUERY, {}, { refetchInterval: 1000 });
  const { data: hashData } = useFetchGraphQL(HASH_QUERY, {}, { refetchInterval: 1000 });

  // Poll every second to update countHistory, only when data is available
  useEffect(() => {
    if (!data || !data.getOutput) return;
    let latestCount = null;
    if (typeof data?.getOutput?.count === 'number') {
      latestCount = data.getOutput.count;
    } else if (Array.isArray(data?.getOutput?.count) && data.getOutput.count.length > 0) {
      const last = data.getOutput.count[data.getOutput.count.length - 1];
      if (typeof last === 'object' && last !== null && 'count' in last) {
        latestCount = last.count;
      } else if (typeof last === 'number') {
        latestCount = last;
      }
    }
    if (typeof latestCount === 'number') {
      setCountHistory(prev => [...prev, latestCount]);
    }
  }, [data]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lockdownActive, setLockdownActive] = useState(false);
  const [showLockdownDialog, setShowLockdownDialog] = useState(false);
  const [showLockdownNotice, setShowLockdownNotice] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAuthenticated(!!localStorage.getItem('token'));
    }
  }, []);

  // Debug: log GraphQL data and error after fetch
  useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      console.log('GraphQL data:', data);
      console.log('GraphQL error:', error);
    }
    else{
      console.log('Loading GraphQL data...');
      console.log('GraphQL error:', error);
    }
  }, [loading, data, error]);

  const handleLockdownConfirm = async () => {
    try {
      const endpoint = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/graphql/";
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await request(endpoint, LOCKDOWN, {}, headers);
      setShowLockdownDialog(false);
      setLockdownActive(true);
      setShowLockdownNotice(true);
    } catch (error) {
      console.error("Lockdown failed:", error);
      // Optionally, show an error message to the user
    }
  };

  const handleResetFirewall = async () => {
    try {
      const endpoint = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/graphql/";
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await request(endpoint, RELEASE_LOCKDOWN, {}, headers);
      setShowResetDialog(false);
      setLockdownActive(false);
      setShowLockdownNotice(false);
    } catch (error) {
      console.error("Firewall reset failed:", error);
      // Optionally, show an error message to the user
    }
  };

  const handleCheckNetworks = async () => {
    try {
      const endpoint = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/graphql/";
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await request(endpoint, NETWORK_QUERY, {}, headers);
    } catch (error) {
      console.error("Network check failed:", error);
    }
  };

  const handleCheckPorts = async () => {
    try {
      const endpoint = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/graphql/";
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await request(endpoint, OPEN_PORTS_QUERY, {}, headers);
    } catch (error) {
      console.error("Port check failed:", error);
    }
  };

  // Login handler
  const handleLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setLoginModalOpen(false);
      } else {
        setLoginError("Invalid credentials");
      }
    } catch (e) {
      setLoginError("Login failed");
    }
  };
  // Show only login modal button by default
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Button
          className="bg-gradient-to-r from-blue-800 via-blue-700 to-black text-white font-semibold px-6 py-2 rounded shadow"
          onClick={() => setLoginModalOpen(true)}
        >
          Authenticate User
        </Button>
        {loginModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-black p-6 rounded-lg w-full max-w-sm shadow-2xl">
              <h2 className="text-xl font-bold mb-4" style={{ color: "#b3cfff" }}>User Login</h2>
              <input
                className="w-full mb-2 p-2 border border-blue-500 bg-black text-blue-200 placeholder-blue-400 focus:ring-2 focus:ring-blue-500"
                placeholder="Username"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                style={{ boxShadow: "0 0 8px #0ff" }}
              />
              <input
                className="w-full mb-4 p-2 border border-blue-500 bg-black text-blue-200 placeholder-blue-400 focus:ring-2 focus:ring-blue-500"
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                style={{ boxShadow: "0 0 8px #0ff" }}
              />
              {loginError && <p className="text-red-500 mb-2">{loginError}</p>}
              <Button
                onClick={handleLogin}
                className="w-full bg-sky-900 text-cyan-100 font-semibold mb-2"
              >
                Log In
              </Button>
              <Button
                onClick={() => setLoginModalOpen(false)}
                className="w-full bg-gray-800 text-gray-100 font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setLoginModalOpen(false);
  };

  // Show rest of the page only after login
  return (
    <div className="min-h-screen bg-black text-foreground p-6 relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/lock1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-40 z-10 pointer-events-none" />

      {/* Main content above video and overlay */}
      <div className="relative z-20">
        <div
          style={{
            position: 'absolute',
            top: '0.3cm',
            right: '1cm',
            zIndex: 100,
            display: 'flex',
            gap: '1rem',
          }}
        >
          <Button
            className="bg-gradient-to-r from-gray-800 via-gray-700 to-black text-white font-semibold px-6 py-2 rounded shadow"
            onClick={() => window.open('http://127.0.0.1:8000/admin', '_blank')}
          >
            Authenticate Owner
          </Button>
          <Button
            className="bg-gradient-to-r from-red-800 via-red-700 to-black text-white font-semibold px-6 py-2 rounded shadow"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        <h1 className="text-center text-2xl font-bold mb-8">System</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Memory */}
          <div className="border rounded-lg p-6 shadow-md">
            <h2 className="text-lg font-semibold mb-4">Memory Monitor Display</h2>
            <div
              style={{ backgroundColor: 'rgba(20, 184, 166, 0.3)' }}
              className="h-120 rounded p-4 flex items-center justify-center shadow-lg transition-transform duration-300 scale-100 hover:scale-105"
            >
              {loading ? (
                <p>Loading memory data...</p>
              ) : error ? (
                <p className="text-red-500">Error loading memory data.</p>
              ) : countHistory.length === 0 ? (
                <p>No count data to plot.</p>
              ) : (
                <Line
                  data={{
                    labels: countHistory.map((_, i) => i + 1),
                    datasets: [
                      {
                        label: 'Count',
                        data: countHistory,
                        borderColor: '#0ff',
                        backgroundColor: 'rgba(0,255,255,0.2)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: {
                        display: true,
                        ticks: {
                          color: "#fff",
                          autoSkip: false,
                          maxTicksLimit: 50,
                          font: { size: 10 },
                        },
                        grid: { color: "#444" },
                        title: {
                          display: true,
                          text: "Time (seconds)",
                          color: "#fff",
                          font: { size: 12, weight: "bold" }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        ticks: { color: "#fff" },
                        grid: { color: "#444" }
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>

          {/* Right Column: Backup + Firewall */}
          <div className="flex flex-col gap-6">
            <div className="border rounded-lg p-4 shadow-md h-50">
              <h2 className="text-md font-semibold mb-2">Memory Status Display</h2>
              <div
                style={{ backgroundColor: 'rgba(20, 184, 166, 0.3)' }}
                className="rounded p-3 shadow-lg transition-transform duration-300 scale-100 hover:scale-105 h-30"
              >
                <p>File Matches Hash: <Badge className={hashData?.checkFileHash?.exists ? "bg-blue-500 text-white" : "bg-yellow-800 text-white"}>{hashData?.checkFileHash?.exists ? 'True' : 'False'}</Badge></p>
                {Array.isArray(data?.getOutput?.count) && data.getOutput.count.length > 0 ? (
                  <>
                    <p>Current Count: {data.getOutput.count[data.getOutput.count.length - 1].count}</p>
                    <p>Last Updated: {data.getOutput.count[data.getOutput.count.length - 1].time}</p>
                    <p>Affected: <Badge className={data.getOutput.affected ? "bg-red-500 text-white" : "bg-green-500 text-white"}>{data.getOutput.affected ? 'Yes' : 'No'}</Badge></p>
                  </>
                ) : typeof data?.getOutput?.count === 'number' ? (
                  <>
                    <p>Current Count: {data.getOutput.count}</p>
                    <p>Memory Compromised: <Badge className={data.getOutput.affected ? "bg-red-500 text-white" : "bg-green-500 text-white"}>{data.getOutput.affected ? 'Yes' : 'No'}</Badge></p>
                  </>
                ) : (
                  <p>No memory data available.</p>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4 shadow-sm relative">
              {/* Top right lockdown button */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowLockdownDialog(true)}
                >
                  Initiate Lockdown
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetDialog(true)}
                >
                  Reset Firewall
                </Button>
              </div>

              <AlertDialog open={showLockdownDialog} onOpenChange={setShowLockdownDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Confirm Lockdown</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to initiate lockdown? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="border border-gray-300 text-gray-700 bg-white hover:bg-white hover:text-gray-700"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        onClick={handleLockdownConfirm}
                        className="bg-red-600 border border-white text-white hover:bg-red-700"
                      >
                        Yes, Lockdown
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Confirm Firewall Reset</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reset the firewall? This will release the lockdown.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="border border-gray-300 text-gray-700 bg-white hover:bg-white hover:text-gray-700"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        onClick={handleResetFirewall}
                        className="bg-blue-600 border border-white text-white hover:bg-blue-700"
                      >
                        Yes, Reset
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <h2 className="text-md text-teal-50 font-semibold mb-2 flex items-center gap-2 height-60">
                Firewall Status Display
                <Badge variant="default" className={lockdownActive ? "bg-red-500 text-white" : "bg-green-500 text-white"}>
                  {lockdownActive ? 'Stopped' : 'Running'}
                </Badge>
              </h2>
              <div
                style={{ backgroundColor: 'rgba(9, 102, 91, 0.3)' }}
                className="rounded p-3 shadow-lg transition-transform duration-300 scale-100 hover:scale-105 h-30"
              >
                {Array.isArray(data?.getPorts?.openPorts) ? (
                  <p>Open ports: {data.getPorts.openPorts.join(', ') || 'None'}</p>
                ) : typeof data?.getPorts?.openPorts === 'number' ? (
                  <p>Open ports: {data.getPorts.openPorts}</p>
                ) : (
                  <p>No firewall data available.</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckNetworks}
                  >
                    Check Networks
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckPorts}
                  >
                    Check Ports
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>




        {/* LOCKDOWN POPUP */}
        {showLockdownNotice && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
            <div className="bg-red-800 p-6 rounded-lg w-full max-w-md text-center border-2 border-black shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4"> LOCKDOWN INITIATED</h2>
              <p className="text-base text-white">Critical alert: system is now restricted to OWNER-level operations.</p>
              <Button
                onClick={() => setShowLockdownNotice(false)}
                className="mt-6"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default Home;