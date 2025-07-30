'use client';
import useFetchGraphQL from './data-extraction';
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
// GraphQL query and fetching handled by useFetchGraphQL hook

// Fetch profile data


function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(true);
  const [lockdownActive, setLockdownActive] = useState(false);
  const [showLockdownDialog, setShowLockdownDialog] = useState(false);

  // Use the custom hook to fetch GraphQL data
  const { data, loading, error } = useFetchGraphQL();



  const handleLockdownConfirm = () => {
    setShowLockdownDialog(false);
    setTimeout(() => {
      setLockdownActive(true);
    }, 500);
  };

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
          }}
        >
          <Button
            className="bg-gradient-to-r from-gray-800 via-gray-700 to-black text-white font-semibold px-6 py-2 rounded shadow"
            onClick={() => window.open('127.0.0.1:8000/admin', '_blank')}
          >
            Authenticate Owner
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
              ) : (
                <Line
                  data={{
                    labels: Array.isArray(data?.getOutput?.history)
                      ? data.getOutput.history.map(d => d.time)
                      : [],
                    datasets: [
                      {
                        label: 'Count',
                        data: Array.isArray(data?.getOutput?.history)
                          ? data.getOutput.history.map(d => d.count)
                          : [],
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
                          text: "Time",
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
                {Array.isArray(data?.getOutput?.history) && data.getOutput.history.length > 0 ? (
                  <>
                    <p>Current Count: {data.getOutput.history[data.getOutput.history.length - 1].count}</p>
                    <p>Last Updated: {data.getOutput.history[data.getOutput.history.length - 1].time}</p>
                  </>
                ) : (
                  <p>No memory data available.</p>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4 shadow-sm relative">
              {/* Top right lockdown button */}
              <div className="absolute top-4 right-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowLockdownDialog(true)}
                >
                  Initiate Lockdown
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

              <h2 className="text-md text-teal-50 font-semibold mb-2 flex items-center gap-2 height-60">
                Firewall Status Display
                <Badge variant="default" className="bg-green-500 text-white">Running</Badge>
              </h2>
              <div
                style={{ backgroundColor: 'rgba(9, 102, 91, 0.3)' }}
                className="rounded p-3 shadow-lg transition-transform duration-300 scale-100 hover:scale-105 h-30"
              >
                {data?.getPorts?.openPorts !== undefined ? (
                  <p>Open ports: {data.getPorts.openPorts}</p>
                ) : (
                  <p>No firewall data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>




        {/* LOCKDOWN POPUP */}
        {lockdownActive && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
            <div className="bg-red-800 p-6 rounded-lg w-full max-w-md text-center border-2 border-black shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">🚨 LOCKDOWN INITIATED</h2>
              <p className="text-base text-white">Critical alert: system is now restricted to OWNER-level operations.</p>
              <Button
                onClick={() => setLockdownActive(false)}
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