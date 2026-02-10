import { useState, useEffect } from 'react';
import { Annotation, Slide, DocumentInfo } from './StoryboardTool';
import { DesignCanvas } from './components/DesignCanvas';
import SlidePanel from './components/SlidePanel'; 
import { AnnotationPanel } from './components/AnnotationPanel';
import { exportToPowerPoint } from './utils/exportToPPT';
import { Download } from 'lucide-react';

interface HistoryState {
  slides: Slide[];
}

export default function App() {
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: `slide-${Date.now()}`,
      name: '슬라이드 1',
      taskName: '통합회계 시스템 구축', 
      screenName: '', 
      annotations: [],
      imageUrl: null,
    },
  ]);
  const [currentSlideId, setCurrentSlideId] = useState<string>(slides[0].id);
  
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    author: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [scale, setScale] = useState(0.65); 

  const [history, setHistory] = useState<HistoryState[]>([{ slides: slides }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUpdatingFromHistory, setIsUpdatingFromHistory] = useState(false);

  const currentSlide = slides.find((s) => s.id === currentSlideId) || slides[0];

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      name: `슬라이드 ${slides.length + 1}`,
      taskName: '통합회계 시스템 구축',
      screenName: '',
      annotations: [],
      imageUrl: null,
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideId(newSlide.id);
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((s) => s.id !== id);
    setSlides(newSlides);
    if (currentSlideId === id) {
      setCurrentSlideId(newSlides[0].id);
    }
  };

  const handleUpdateSlideName = (id: string, name: string) => {
    setSlides(slides.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleUpdateTaskName = (taskName: string) => {
    setSlides(slides.map((s) => (s.id === currentSlideId ? { ...s, taskName } : s)));
  };

  const handleUpdateScreenName = (screenName: string) => {
    setSlides(slides.map((s) => (s.id === currentSlideId ? { ...s, screenName } : s)));
  };

  const handleImageUpload = (slideId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setSlides(slides.map((s) => (s.id === slideId ? { ...s, imageUrl } : s)));
      };
      reader.readAsDataURL(file);
    }
  };

  // Ctrl+V 붙여넣기
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault(); 
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const imageUrl = event.target?.result as string;
              setSlides(prev => prev.map((s) => (s.id === currentSlideId ? { ...s, imageUrl } : s)));
            };
            reader.readAsDataURL(blob);
          }
          return;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [currentSlideId]);

  const handleRemoveImage = (slideId: string) => {
    setSlides(slides.map((s) => (s.id === slideId ? { ...s, imageUrl: null } : s)));
  };

  const handleAddAnnotation = () => {
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      number: currentSlide.annotations.length + 1,
      x: 640,
      y: 360,
      color: '#ef4444',
      note: '',
      style: {
        fontSize: '9pt',
        textAlign: 'left',
        backgroundColor: 'transparent',
        textColor: '#000000',
        bold: false,
        italic: false,
        underline: false,
      },
    };
    setSlides(
      slides.map((s) =>
        s.id === currentSlideId ? { ...s, annotations: [...s.annotations, newAnnotation] } : s
      )
    );
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setSlides(slides.map((s) => s.id === currentSlideId ? { ...s, annotations: s.annotations.map((ann) => ann.id === id ? { ...ann, ...updates } : ann) } : s));
  };

  const handleUpdateAnnotationPosition = (id: string, x: number, y: number) => {
    setSlides(slides.map((s) => s.id === currentSlideId ? { ...s, annotations: s.annotations.map((ann) => ann.id === id ? { ...ann, x, y } : ann) } : s));
  };

  const handleDeleteAnnotation = (id: string) => {
    setSlides(slides.map((s) => s.id === currentSlideId ? { ...s, annotations: s.annotations.filter((ann) => ann.id !== id) } : s));
  };

  // History Logic
  useEffect(() => {
    if (isUpdatingFromHistory) { setIsUpdatingFromHistory(false); return; }
    const newHistoryState: HistoryState = { slides: JSON.parse(JSON.stringify(slides)) };
    const currentState = history[historyIndex];
    if (JSON.stringify(currentState.slides) === JSON.stringify(newHistoryState.slides)) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryState);
    if (newHistory.length > 20) { newHistory.shift(); setHistory(newHistory); setHistoryIndex(newHistory.length - 1); } else { setHistory(newHistory); setHistoryIndex(newHistory.length - 1); }
  }, [slides]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      setIsUpdatingFromHistory(true);
      setSlides(JSON.parse(JSON.stringify(previousState.slides)));
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setIsUpdatingFromHistory(true);
      setSlides(JSON.parse(JSON.stringify(nextState.slides)));
      setHistoryIndex(newIndex);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, currentSlideId, slides]);

  const handleExportToPPT = async () => {
    try { await exportToPowerPoint(slides, documentInfo); } catch (error) { console.error('Error exporting to PowerPoint:', error); alert('PPT 내보내기 실패'); }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-white border-b border-gray-300 px-6 py-4 shrink-0 z-20 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 font-bold text-lg">매뉴얼 생성 도구</h1>
            <p className="text-sm text-gray-600">스크린샷과 주석으로 매뉴얼 만들기</p>
          </div>
          <button
            onClick={handleExportToPPT}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 transition-colors shadow-sm font-medium"
          >
            <Download className="size-4" />
            PPT로 내보내기
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <SlidePanel
          slides={slides}
          currentSlideId={currentSlideId}
          onAddSlide={handleAddSlide}
          onSelectSlide={setCurrentSlideId}
          onDeleteSlide={handleDeleteSlide}
          onUpdateSlideName={handleUpdateSlideName}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
        />

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-100">
          
          {/* 상단 정보바 */}
          <div className="bg-white border-b border-gray-300 p-4 shrink-0 z-10 shadow-sm flex items-end justify-between">
            <div className="flex gap-4 w-full max-w-5xl">
              
              {/* 📌 [수정됨] "업무 (문서 제목)" -> "업무" */}
              <div className="flex-1">
                <label className="block text-xs text-blue-600 mb-1 font-bold">업무</label>
                <input
                  type="text"
                  value={currentSlide.taskName || ''}
                  onChange={(e) => handleUpdateTaskName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-blue-300 bg-blue-50/10 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="예: 통합회계 시스템 구축"
                />
              </div>
              
              {/* 화면명 */}
              <div className="flex-1">
                <label className="block text-xs text-blue-600 mb-1 font-bold">화면명 (현재 슬라이드)</label>
                <input
                  type="text"
                  value={currentSlide.screenName || ''}
                  onChange={(e) => handleUpdateScreenName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-blue-300 bg-blue-50/30 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="화면명을 입력하세요"
                />
              </div>

              {/* 작성자 */}
              <div className="w-32">
                <label className="block text-xs text-gray-500 mb-1 font-bold">작성자</label>
                <input
                  type="text"
                  value={documentInfo.author}
                  onChange={(e) => setDocumentInfo({ ...documentInfo, author: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* 줌 */}
               <div className="w-24 text-right flex flex-col justify-end pb-1">
                <span className="text-xs text-gray-400 font-mono block">Zoom</span>
                <span className="text-lg font-bold text-gray-700">{Math.round(scale * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative bg-gray-200 w-full h-full">
            <DesignCanvas
              designElements={[]}
              selectedElementId={null}
              onSelectElement={() => {}}
              onUpdateElement={() => {}}
              annotations={currentSlide.annotations}
              onUpdateAnnotationPosition={handleUpdateAnnotationPosition}
              imageUrl={currentSlide.imageUrl}
              scale={scale}
              setScale={setScale}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[500px] bg-white border-l border-gray-300 flex flex-col overflow-hidden shrink-0 z-20">
          <AnnotationPanel
            annotations={currentSlide.annotations}
            onAddAnnotation={handleAddAnnotation}
            onUpdateAnnotation={handleUpdateAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
          />
        </div>
      </div>
    </div>
  );
}