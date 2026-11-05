import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, CheckCircle2, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { ImageEvidence, EmergencyRequest } from '../types';
import { api } from '../services/api';

export const ImageGalleryView: React.FC<{
  emergencies: EmergencyRequest[];
  onSelectEmergency: (req: EmergencyRequest) => void;
}> = ({ emergencies, onSelectEmergency }) => {
  const [images, setImages] = useState<ImageEvidence[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form
  const [file, setFile] = useState<File | null>(null);
  const [targetReqId, setTargetReqId] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await api.listImages();
      setImages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await api.uploadImage(file, targetReqId || undefined, undefined, caption);
      setUploadResult(res);
      setFile(null);
      setCaption('');
      loadImages();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <ImageIcon className="w-6 h-6 text-purple-400" />
          <span>Deferred Multimedia Transmission Gallery</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Smartphones capture ground evidence during disasters. Images are compressed and deferred until connectivity returns, then linked to SMS emergency request IDs.
        </p>
      </div>

      {/* Upload & Compression Demonstration Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Upload className="w-4 h-4 text-blue-400" />
          <span>Transmit Deferred Evidence Photograph</span>
        </h3>

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Select Ground Photo:</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Associate with Incident ID:</label>
            <select
              value={targetReqId}
              onChange={(e) => setTargetReqId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
            >
              <option value="">Select Emergency ID (Optional)...</option>
              {emergencies.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} — {e.category} ({e.location_name || 'Vizag'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Caption / Field Description:</label>
            <input
              type="text"
              placeholder="e.g. Flooded roadway near bus stand"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-bold transition flex items-center justify-center space-x-1.5 shadow"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Compressing & Transmitting...' : 'Upload & Compress'}</span>
            </button>
          </div>
        </form>

        {/* Compression feedback badge */}
        {uploadResult && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-lg text-emerald-300 text-xs flex items-center justify-between font-mono">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Evidence Associated with <strong>{uploadResult.emergency_request_id || 'UNLINKED'}</strong>!
              </span>
            </div>
            <div className="text-[11px] text-emerald-400">
              Compressed Size: {(uploadResult.compressed_size_bytes / 1024).toFixed(1)} KB (Saved {uploadResult.compression_ratio} bandwidth)
            </div>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">
          Received Ground Photographs ({images.length})
        </h2>

        {images.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-xs text-slate-500 font-mono">
            No deferred images uploaded yet. Upload a ground photo above to verify deferred transmission.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="h-44 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                  <img
                    src={`http://${typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1'}:8000/api/v1/images/${img.id}/file`}
                    alt={img.caption || 'Emergency photo'}
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950/80 text-emerald-400 border border-slate-800">
                    {(img.file_size_bytes / 1024).toFixed(0)} KB (COMPRESSED)
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-red-400">
                      {img.emergency_request_id || 'Incident Evidence'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(img.uploaded_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    {img.caption || 'Ground photograph submitted during disaster.'}
                  </p>

                  {img.emergency_request_id && (
                    <button
                      onClick={() => {
                        const target = emergencies.find((e) => e.id === img.emergency_request_id);
                        if (target) onSelectEmergency(target);
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1 pt-1"
                    >
                      <span>View Emergency Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
