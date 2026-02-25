import React, { useRef, useState } from 'react';
import { Button } from './Button';

interface ImageWorkspaceProps {
  zoomLevel: number;
}

const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({ zoomLevel }) => {
  const [imageSrc, setImageSrc] = useState<string>("https://picsum.photos/800/600");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-6">
      
      {/* Controls Header */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-md sticky top-4 z-10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-white leading-tight">Image View</h2>
            <p className="text-xs text-slate-400">Pinch to zoom detected</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Zoom</span>
                <span className="text-xl font-mono text-indigo-400 font-bold">{(zoomLevel * 100).toFixed(0)}%</span>
             </div>
             
             <input 
               type="file" 
               accept="image/*" 
               className="hidden" 
               ref={fileInputRef}
               onChange={handleFileChange}
             />
             <Button onClick={triggerUpload} variant="outline" className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Image
             </Button>
        </div>
      </div>

      {/* Image Container */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center group">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        
        {/* Grid pattern background for reference */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
                backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
             }}>
        </div>

        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <img
            src={imageSrc}
            alt="Workspace"
            className="transition-transform duration-75 ease-out object-contain max-w-full max-h-full"
            style={{
                transform: `scale(${zoomLevel})`,
                // Adding a slight shadow to the image itself to separate from background
                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' 
            }}
            />
        </div>

        {/* Zoom Indicator Overlay (Centers on image) */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-slate-300 border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            {imageSrc.substring(0, 30)}...
        </div>
      </div>
    </div>
  );
};

export default ImageWorkspace;
