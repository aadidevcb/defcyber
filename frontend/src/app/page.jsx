'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';


export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(true);
  const [lockdownActive, setLockdownActive] = useState(false);
  const [showLockdownDialog, setShowLockdownDialog] = useState(false);

   const handleLockdownConfirm = () => {
    setShowLockdownDialog(false);
  setTimeout(() => {
    setLockdownActive(true);
  }, 500); 
};

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
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
    onClick={() => window.open('https://your-link-here.com', '_blank')}
  >
    Authenticate Owner
  </Button>
</div>
      <h1 className="text-center text-2xl font-bold mb-8">System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Memory */}
        <div className="border rounded-lg p-6 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Memory Monitor Display</h2>
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded p-4 flex items-center justify-center">
            <p className="text-center">[Memory Usage Stats]</p>
          </div>
        </div>

        {/* Right Column: Backup + Firewall */}
        <div className="flex flex-col gap-6">
          <div className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-md font-semibold mb-2">Backup Status Display</h2>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
              <p>Backup size: 1.2GB</p>
              <p>Copies: 3</p>
              <p>Last backup: 2025-07-28</p>
            </div>
          </div>

          <div className="border rounded-lg p-4 shadow-sm relative">
            {/* Top right lockdown button */}
            <div className="absolute top-4 right-4">
               <Button
              variant="destructive"
              size="sm"
              onClick={()=> setShowLockdownDialog(true)}
            >
              Initiate Lockdown
            </Button>
            </div>

          <AlertDialog open={showLockdownDialog} onOpenChange={setShowLockdownDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Lockdown</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to initiate lockdown? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive" onClick={handleLockdownConfirm}>
                    Yes, Lockdown
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
            <h2 className="text-md font-semibold mb-2 flex items-center gap-2">
              Firewall Status Display
              <Badge variant="default" className="bg-green-500 text-white">Running</Badge>
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
              <p>Open ports: 3</p>
              <p>Data flowing: 56.2MB/s</p>
            </div>
          </div>
        </div>
      </div>

      {/* AUTH MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#111] p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Authenticate</h2>
            <input className="w-full mb-2 p-2 border" placeholder="Username" />
            <input className="w-full mb-4 p-2 border" type="password" placeholder="Password" />
            <Button
              onClick={() => setAuthModalOpen(false)}
              className="w-full bg-gradient-to-r from-gray-800 via-gray-700 to-black text-white font-semibold"
            >
              Sign In
            </Button>
          </div>
        </div>
      )}

      {/* LOCKDOWN POPUP */}
      {lockdownActive && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-red-600 dark:bg-red-800 p-6 rounded-lg w-full max-w-md text-center">
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
  );
}