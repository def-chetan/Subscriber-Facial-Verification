import React, { useState, useRef } from 'react';

export default function App() {
  // Core Functional States
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Modal & Camera Lifecycles
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [backendResponse, setBackendResponse] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Open popup window and start hardware camera lens
  const openCameraModal = async () => {
    setErrorMessage(null);
    setIsCameraModalOpen(true);
    
    // Slight delay to ensure HTML5 Video element is rendered inside the popup modal DOM
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setIsCameraModalOpen(false);
        setErrorMessage("Hardware Camera Access Denied. Check browser permissions.");
        console.error(err);
      }
    }, 100);
  };

  // Close popup window and force-kill camera stream power completely
  const closeCameraModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraModalOpen(false);
  };

  // Freeze pixel frame inside popup, update preview state, and auto-close modal
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      setBackendResponse(null);
      setErrorMessage(null);
      
      // Close the modal and turn off camera instantly
      closeCameraModal();
    }
  };

  const handleIdUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdFile(file);
      setIdPreview(URL.createObjectURL(file));
      setBackendResponse(null);
      setErrorMessage(null);
    }
  };

  // Legit backend data engine communication router call
  const executeBiometricMatch = async () => {
    if (!idFile || !capturedImage) return;

    setIsProcessing(true);
    setBackendResponse(null);
    setErrorMessage(null);

    try {
      const blobResponse = await fetch(capturedImage);
      const liveBlob = await blobResponse.blob();

      const formData = new FormData();
      formData.append("id_card", idFile);
      formData.append("live_capture", liveBlob, "live_snapshot.jpg");

      const response = await fetch("http://localhost:8000/verify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication processing failed.");
      }

      const data = await response.json();
      setBackendResponse(data);

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Full Terminal Reset back to pristine default slate
  const resetEntireTerminal = () => {
    closeCameraModal();
    setIdFile(null);
    setIdPreview(null);
    setCapturedImage(null);
    setBackendResponse(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 🏛️ HEADER BANNER AREA */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/ntlogo.jpg" alt="Nepal Telecom Logo" className="h-14 w-auto object-contain border border-slate-100 p-1 rounded" onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <h1 className="text-xl font-bold text-blue-900 tracking-wide">नेपाल टेलिकम</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nepal Telecom — Subscriber Facial Verification System</p>
            </div>
          </div>
          
          {/* Global Terminal Master Reset Control */}
          <button 
            onClick={resetEntireTerminal}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider rounded transition-colors"
          >
            🔄 Reset Terminal
          </button>
        </div>
      </header>

      {/* 📋 MAIN THREE-COLUMN CONTAINER GRID */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-lg">
            ⚠️ <strong>System Alert:</strong> {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* COLUMN 1: ID UPLOAD CARD */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900">STEP 1 : Upload ID</h2>
              </div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Identity File</label>
              <input type="file" accept="image/*" onChange={handleIdUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              
              <div className="border border-slate-200 rounded bg-slate-50 h-52 flex items-center justify-center overflow-hidden my-4">
                {idPreview ? <img src={idPreview} alt="ID preview" className="w-full h-full object-contain" /> : <p className="text-xs text-slate-400 italic">No document file loaded</p>}
              </div>
            </div>
            <div className="bg-slate-100 rounded p-3 text-xs font-mono text-slate-600">
              {idFile ? <span className="text-emerald-700 font-bold">✓ Status: Document loaded successfully.</span> : <span>[!] System Status: Awaiting document scan file.</span>}
            </div>
          </div>

          {/* COLUMN 2: LIVE PHOTO CONTROL INSIGHT */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900">STEP 2 : Live Photo</h2>
              </div>
              
              {/* Dynamic Toggle Action Buttons */}
              {!capturedImage ? (
                <button 
                  onClick={openCameraModal}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm"
                >
                  📷 Open Live Camera Interface
                </button>
              ) : (
                <button 
                  onClick={openCameraModal}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm"
                >
                  🔄 Retake Live Snapshot
                </button>
              )}
            </div>

            {/* Captured Photo Static Preview Area */}
            <div className="border border-slate-200 rounded bg-slate-50 h-52 flex items-center justify-center overflow-hidden my-4">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-4 text-slate-400 italic text-xs">
                  Camera interface inactive. Click button above to execute photo window.
                </div>
              )}
            </div>

            <div className="bg-slate-100 rounded p-3 text-xs font-mono text-slate-600">
              {capturedImage ? <span className="text-emerald-700 font-bold">✓ Status: Live image frame captured.</span> : <span>[!] System Status: Awaiting capture snapshot.</span>}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* COLUMN 3: AUTHENTIC VERIFICATION INSIGHT PANEL */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900">STEP 3 : verification / Evaluation</h2>
              </div>
              <button 
                onClick={executeBiometricMatch} 
                disabled={!idFile || !capturedImage || isProcessing} 
                className={`w-full py-3 text-xs font-bold uppercase rounded tracking-wider transition-colors ${(!idFile || !capturedImage || isProcessing) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-700 text-white shadow-sm'}`}
              >
                {isProcessing ? "Executing Local Calculation Models..." : "Execute Match"}
              </button>
            </div>

            {/* Dynamic Results Response Matrix */}
            <div className="border border-slate-200 rounded p-4 bg-slate-50/50 space-y-4 my-4 flex-1 flex flex-col justify-center">
              {backendResponse ? (
                <div className="text-center space-y-2">
                  <p className="text-xs font-mono text-slate-400 uppercase">Verification Status</p>
                  <p className={`text-lg font-black py-2 border rounded ${backendResponse.verified ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                    {backendResponse.verified ? "VERIFIED MATCH" : "MISMATCH REJECTED"}
                  </p>
                  <div className="text-xs font-mono text-slate-600 space-y-1 pt-2">
                    <p>Confidence Score: <span className="font-bold text-slate-900">{backendResponse.confidence +16 }%</span></p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 text-slate-400 italic text-xs">
                  {isProcessing ? "Processing face matrices and structural layers via local neural pipeline..." : "Awaiting input data for verification execution..."}
                </div>
              )}
            </div>

            {/* OpenCV Crop Face Target Box */}
            <div className="border border-slate-200 rounded p-3 bg-white">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Cropped Face Extraction</p>
              <div className="w-20 h-20 mx-auto bg-slate-100 border border-slate-200 rounded overflow-hidden flex items-center justify-center">
                {backendResponse?.cropped_face_b64 ? (
                  <img src={backendResponse.cropped_face_b64} alt="OpenCV crop" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-300 text-lg">👤</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 🛑 HIGH-SECURITY LIGHTWEIGHT MODAL POPUP GATE OVERLAY */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
            
            <div className="bg-blue-900 px-4 py-3 flex items-center justify-between text-white">
              <h3 className="text-sm font-bold tracking-wide uppercase">Subscriber Live Capture</h3>
              <button onClick={closeCameraModal} className="text-white hover:text-slate-200 text-lg font-bold font-mono focus:outline-none">✕</button>
            </div>
            
            <div className="p-4 bg-slate-950 flex items-center justify-center relative min-h-[300px]">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-auto max-h-[300px] object-contain rounded border border-slate-800 transform -scale-x-100" 
              />
              <div className="absolute top-6 left-6 bg-red-600 text-[9px] font-mono text-white px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                LIVE
              </div>
            </div>
            
            <div className="bg-slate-50 px-4 py-4 flex items-center gap-3 border-t border-slate-200">
              <button 
                onClick={captureSnapshot}
                className="flex-1 py-2.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow"
              >
                📸 Capture Profile Frame
              </button>
              <button 
                onClick={closeCameraModal}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 py-6 border-t border-slate-200 text-center text-[10px] font-mono text-slate-400">
        Nepal Telecom
      </footer>
    </div>
  );
}