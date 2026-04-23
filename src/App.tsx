/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Camera, 
  Check, 
  Download, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  Briefcase,
  Building2,
  TreePine,
  Image as ImageIcon
} from "lucide-react";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const STYLES = [
  {
    id: "corporate",
    name: "Corporate Grey",
    description: "Classic studio look with a neutral grey backdrop",
    icon: <Briefcase className="w-5 h-5" />,
    prompt: "Professional corporate headshot with a clean, neutral grey studio backdrop. High-end lighting, sophisticated business attire (suit/blazer), sharp focus on eyes, photorealistic, professional photography."
  },
  {
    id: "tech",
    name: "Modern Tech",
    description: "Blurred modern office with natural depth",
    icon: <Building2 className="w-5 h-5" />,
    prompt: "Professional modern tech office headshot. Blurred contemporary office background with glass partitions and soft indoor lighting. Professional casual attire (sweater or button-down), natural depth of field, photorealistic, 8k resolution."
  },
  {
    id: "outdoor",
    name: "Natural Light",
    description: "Soft outdoor setting with natural greenery",
    icon: <TreePine className="w-5 h-5" />,
    prompt: "Professional outdoor headshot with a softly blurred natural park background. Golden hour lighting, natural skin tones, professional attire, high quality, bokeh effect, photorealistic."
  },
  {
    id: "editorial",
    name: "Editorial Studio",
    description: "Dramatic lighting for a creative edge",
    icon: <ImageIcon className="w-5 h-5" />,
    prompt: "High-fashion editorial style professional headshot. Dramatic studio lighting with soft shadows, clean textured background, sharp architectural detail, professional photography, artistic but corporate-ready."
  }
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB. Please upload a smaller image.");
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith("image/")) {
        setError("Please upload an image file.");
        return;
      }
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileChange({ target: { files: dataTransfer.files } } as any);
      }
    }
  };

  const generateHeadshot = async () => {
    if (!preview) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const base64Data = preview.split(",")[1];
      const mimeType = preview.split(",")[0].split(":")[1].split(";")[0];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: `Please transform this person in the image into a highly professional corporate headshot. Use the following style: ${selectedStyle.prompt}. Maintain the person's facial features exactly while updating their hair to be neat, their outfit to be professional business attire, and the background as described. Extremely high quality, photorealistic, professional lighting.`,
            },
          ],
        },
      });

      let generatedImage = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImage = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (generatedImage) {
        setResult(generatedImage);
      } else {
        throw new Error("No image was generated. Please try again.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate headshot. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result;
    link.download = `headshot-${selectedStyle.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            LENS<span className="text-indigo-600">.AI</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-6 mr-2">
            <span className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">Styles</span>
            <span className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">History</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold uppercase">
              DP
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row gap-8 p-8 overflow-hidden min-h-0">
        
        {/* Left Column: Upload Section */}
        <section className="w-full md:w-[400px] flex flex-col gap-6 shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">1. Upload Source</h2>
              <p className="text-sm text-slate-500">Casual selfies work best. High resolution.</p>
            </div>
            
            <div 
              className={`flex-1 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer relative overflow-hidden ${
                preview ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              
              {preview ? (
                <div className="absolute inset-0">
                  <img src={preview} alt="Upload" className="w-full h-full object-cover opacity-20" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <Check className="w-10 h-10 text-indigo-600 mb-2 bg-white rounded-full p-2 shadow-sm" />
                    <p className="text-sm font-semibold text-slate-800">Photo Ready</p>
                    <p className="text-xs text-slate-500">Click to replace</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Drag and drop your image</p>
                  <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                  <button className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                    Browse Files
                  </button>
                </>
              )}
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex gap-3">
                <span className="text-amber-600 text-sm">⚠️</span>
                <div>
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pro Tip</p>
                  <p className="text-xs text-amber-700 leading-relaxed mt-1">
                    Ensure no sunglasses or hats are worn for the most accurate facial reconstruction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Style & Results */}
        <section className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="mb-6 flex items-end justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold">2. Select Style & Review</h2>
                <p className="text-sm text-slate-500">Pick the environment for your professional shots.</p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {STYLES.length} Styles Available
              </span>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
              {/* Style Grid */}
              <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-1">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`group relative rounded-xl overflow-hidden border-2 transition-all text-left flex flex-col ${
                      selectedStyle.id === style.id 
                        ? 'border-indigo-600 ring-4 ring-indigo-50' 
                        : 'border-slate-100 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`aspect-[4/3] flex items-center justify-center ${
                      selectedStyle.id === style.id ? 'bg-indigo-50 text-indigo-400' : 'bg-slate-50 text-slate-300'
                    }`}>
                      {style.icon}
                    </div>
                    <div className={`p-3 ${selectedStyle.id === style.id ? 'bg-white' : 'bg-white/90'}`}>
                      <p className="text-xs font-bold text-slate-800 truncate">{style.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{style.description}</p>
                    </div>
                    {selectedStyle.id === style.id && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                        <Check className="w-2 h-2" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Result Preview Area */}
              <div className="flex-1 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex flex-col relative">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                    >
                      <div className="relative mb-4">
                        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Generating Your Look</p>
                      <p className="text-xs text-slate-400 mt-2 max-w-[200px]">We're building your studio photo. This takes about 15 seconds.</p>
                      <div className="absolute bottom-0 left-0 h-1 bg-indigo-600 w-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-indigo-400/50"
                          initial={{ x: "-100%" }}
                          animate={{ x: "0%" }}
                          transition={{ duration: 15 }}
                        />
                      </div>
                    </motion.div>
                  ) : result ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-1 relative group"
                    >
                      <img src={result} alt="Result" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={downloadImage}
                          className="px-6 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 shadow-xl transition-all active:scale-95"
                        >
                          <Download className="w-4 h-4" /> Download Shot
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
                      <ImageIcon className="w-12 h-12 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-400">Headshot Studio</p>
                      <p className="text-xs text-slate-400 mt-1">Generation will appear here</p>
                    </div>
                  )}
                </AnimatePresence>
                {error && (
                  <div className="absolute bottom-4 inset-x-4 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <footer className="h-24 bg-white border-t border-slate-200 px-8 flex items-center justify-between shrink-0 z-20">
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white overflow-hidden flex items-center justify-center text-[10px] font-bold text-indigo-600">JS</div>
            <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white overflow-hidden flex items-center justify-center text-[10px] font-bold text-blue-600">AK</div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-600">+10</div>
          </div>
          <span className="text-sm text-slate-500">Professional studio quality verified.</span>
        </div>
        
        <div className="flex items-center gap-6 w-full sm:w-auto justify-end">
          <div className="text-right hidden xs:block">
            <p className="text-sm font-semibold">Ready to Process</p>
            <p className="text-xs text-slate-400">Style: {selectedStyle.name}</p>
          </div>
          <button 
            onClick={generateHeadshot}
            disabled={!preview || isGenerating}
            className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${
              !preview || isGenerating
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-slate-900 text-white shadow-slate-200 hover:bg-indigo-600 active:scale-95'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Generate Headshots</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
