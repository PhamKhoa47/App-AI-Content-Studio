
import React, { useState, useMemo } from 'react';
import type { TetConcept } from '../types';

interface TetConceptLibraryProps {
  onSelect: (concept: TetConcept) => void;
}

const tetGroupMetadata: Record<string, { icon: string; color: string; desc: string }> = {
  "TẾT TRUYỀN THỐNG": { icon: "🧧", color: "bg-red-600", desc: "Nét đẹp văn hóa cổ truyền Việt Nam" },
  "XUÂN BÍNH NGỌ 2026": { icon: "🐎", color: "bg-amber-500", desc: "Linh vật Ngựa - Tăng tốc & Bứt phá" },
  "TẾT GIA ĐÌNH": { icon: "👨‍👩‍👧‍👦", color: "bg-emerald-600", desc: "Quây quần bên những người thân yêu" },
  "DOANH NHÂN - KHAI XUÂN": { icon: "💼", color: "bg-indigo-600", desc: "Đẳng cấp lãnh đạo & Khởi đầu thịnh vượng" },
  "CỔ PHỤC - CUNG ĐÌNH": { icon: "👑", color: "bg-orange-600", desc: "Vẻ đẹp quý phái thời phong kiến" },
  "TẾT TRẺ EM": { icon: "👶", color: "bg-pink-600", desc: "Nụ cười hồn nhiên ngày đầu năm" },
  "TẾT VUI - SÁNG TẠO": { icon: "🎭", color: "bg-teal-600", desc: "Ý tưởng phá cách & Hài hước" },
  "TẾT 3D - HOẠT HÌNH": { icon: "🤖", color: "bg-violet-600", desc: "Phong cách Pixar, Anime & Metaverse" },
  "TẾT DU LỊCH": { icon: "✈️", color: "bg-sky-600", desc: "Khám phá vẻ đẹp xuân khắp vùng miền" },
  "CÁ NHÂN HÓA": { icon: "🏷️", color: "bg-rose-700", desc: "Thương hiệu & Dấu ấn riêng biệt" }
};

const generate100Concepts = (): TetConcept[] => {
  const data: Record<string, string[]> = {
    "TẾT TRUYỀN THỐNG": [
      "Áo dài đỏ bên hoa mai vàng", "Áo dài trắng bên hoa đào miền Bắc", "Ông đồ cho chữ đầu xuân", 
      "Ngồi bên mâm ngũ quả", "Gói bánh chưng bên bếp lửa", "Phố cổ Hà Nội ngày Tết", 
      "Hội An đèn lồng đỏ", "Câu đối thư pháp nền đỏ", "Bàn thờ gia tiên ngày Tết", "Cổng làng tre ngày xuân"
    ],
    "XUÂN BÍNH NGỌ 2026": [
      "Hóa thân chiến mã rực lửa", "Concept Xuân Bính Ngọ – Tăng tốc", "Doanh nhân cưỡi ngựa vàng", 
      "Nữ thần Ngọ 2026", "Ngựa vàng 3D ánh kim", "Ngựa pháo hoa đêm giao thừa", 
      "Biểu tượng ngựa thư pháp", "Concept năng lượng Hỏa", "Ngựa thần tài phát lộc", "Chạy bứt phá qua mùa xuân"
    ],
    "TẾT GIA ĐÌNH": [
      "Gia đình 3 thế hệ mặc áo dài", "Ông bà lì xì cháu", "Cả nhà chụp ảnh phòng khách", 
      "Gia đình bên mai vàng", "4 thế hệ quây quần", "Gia đình picnic đầu xuân", 
      "Gia đình bên bếp bánh chưng", "Ảnh Tết tại nhà truyền thống", "Gia đình tone đỏ đồng bộ", "Gia đình phong cách hiện đại"
    ],
    "DOANH NHÂN - KHAI XUÂN": [
      "CEO khai xuân 2026", "Chủ shop cầm bao lì xì", "Doanh nhân vest đỏ nền vàng", 
      "Concept khai trương đầu năm", "Chủ thương hiệu cá nhân", "Phát biểu khai xuân", 
      "Ảnh banner bán hàng Tết", "Avatar kinh doanh đầu năm", "Concept livestream Tết", "Ảnh quảng cáo sản phẩm xuân"
    ],
    "CỔ PHỤC - CUNG ĐÌNH": [
      "Cổ phục Việt Nam xưa", "Cung đình Huế ngày xuân", "Hoàng hậu đón Tết", 
      "Thư sinh áo the khăn đóng", "Mỹ nhân cổ trang", "Tướng quân ngày xuân", 
      "Kiếm hiệp mùa hoa đào", "Nữ thần mùa xuân", "Thần tài cổ phong", "Cung điện vàng ánh kim"
    ],
    "TẾT TRẺ EM": [
      "Bé áo dài đỏ", "Bé cầm lồng đèn", "Bé lì xì ông bà", "Bé hóa thần tài", 
      "Bé gói bánh chưng", "Bé bên mai vàng", "Bé phong cách chibi Tết", 
      "Bé studio pastel", "Bé với pháo hoa", "Bé trong khu vườn xuân"
    ],
    "TẾT VUI - SÁNG TẠO": [
      "Ôm bánh chưng khổng lồ", "Lì xì bay đầy trời", "Meme Tết hài hước", "Cưỡi trâu ngày xuân", 
      "Táo quân hiện đại", "Thần tài phiên bản vui nhộn", "Pháo giấy nổ tung", 
      "Ôm mèo thần tài", "Chúc Tết phong cách Gen Z", "Nhảy múa giữa pháo hoa"
    ],
    "TẾT 3D - HOẠT HÌNH": [
      "Phong cách Pixar Tết", "Anime xuân Việt", "3D siêu thực điện ảnh", "Tượng sáp thần tài", 
      "Avatar AI đầu năm", "Cyberpunk Tết đỏ vàng", "Chibi siêu dễ thương", 
      "Metaverse mùa xuân", "Siêu anh hùng Tết", "Game character Tết"
    ],
    "TẾT DU LỊCH": [
      "Đà Lạt hoa mai", "Sa Pa hoa đào", "Huế cổ kính", "Hà Nội phố cổ", 
      "Hội An đèn lồng", "Miền Tây sông nước", "Tây Nguyên mùa xuân", 
      "Biển Nha Trang đầu năm", "Chùa cầu an đầu xuân", "Núi rừng Tây Bắc"
    ],
    "CÁ NHÂN HÓA": [
      "Thêm tên cá nhân nổi bật", "Thêm câu chúc riêng", "Thêm logo thương hiệu", 
      "Thêm số điện thoại", "Ảnh lịch để bàn 2026", "Ảnh bìa Facebook Tết", 
      "Ảnh story 9:16", "Ảnh avatar tròn", "Bộ 5 ảnh đồng bộ", "Bộ ảnh nhận diện thương hiệu Tết 2026"
    ]
  };

  const concepts: TetConcept[] = [];
  let counter = 1;

  Object.entries(data).forEach(([groupName, titles]) => {
    titles.forEach((title) => {
      concepts.push({
        id: counter.toString().padStart(3, '0'),
        title,
        category: groupName,
        tag: groupName,
        description: `Ý tưởng: ${title}. Concept Identity Preservation PK-2026.`,
        prompt: `High-end commercial studio photography, ${title} theme for Vietnamese Lunar New Year 2026. Strictly preserve original face identity. No face swap. No model replacement. Face accuracy: extremely high. Only modify outfit, hairstyle, background and lighting. Keep natural Vietnamese facial features. Ultra realistic, high detail skin texture, cinematic 8k.`,
        previewColor: tetGroupMetadata[groupName].color
      });
      counter++;
    });
  });

  return concepts;
};

const allConcepts = generate100Concepts();

const TetConceptLibrary: React.FC<TetConceptLibraryProps> = ({ onSelect }) => {
  const groups = Object.keys(tetGroupMetadata);
  const [activeGroup, setActiveGroup] = useState(groups[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConcepts = useMemo(() => {
    return allConcepts.filter(c => 
      c.category === activeGroup && 
      (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [activeGroup, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <span className="text-3xl">🐲</span>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Studio Xuân Bính Ngọ 2026</h3>
        </div>
        <p className="text-sm text-slate-500 font-medium ml-10">Hệ thống AI bảo tồn nhận diện PK-Face 2026 (No Face-Swap)</p>
      </div>

      {/* Group Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {groups.map(group => {
              const isActive = activeGroup === group;
              return (
                  <button
                    key={group}
                    onClick={() => setActiveGroup(group)}
                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-300 gap-2 ${
                        isActive 
                        ? `${tetGroupMetadata[group].color} border-transparent text-white shadow-xl scale-105 z-10` 
                        : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                      <span className="text-2xl">{tetGroupMetadata[group].icon}</span>
                      <span className="text-[9px] font-extrabold uppercase tracking-tight text-center leading-tight">
                          {group.split(' - ')[0]}
                      </span>
                  </button>
              );
          })}
      </div>

      {/* Group Info Card */}
      <div className={`p-6 rounded-[2.5rem] ${tetGroupMetadata[activeGroup].color} bg-opacity-5 border border-white/20 shadow-inner`}>
          <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${tetGroupMetadata[activeGroup].color} flex items-center justify-center text-white shadow-lg`}>
                  <span className="text-xl">{tetGroupMetadata[activeGroup].icon}</span>
              </div>
              <div>
                  <h4 className="text-sm font-extrabold text-slate-800">{activeGroup}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Bảo vệ cấu hình da và nhân trắc học nguyên bản.</p>
              </div>
          </div>
      </div>

      {/* Search Input */}
      <div className="relative group">
          <input 
            type="text" 
            placeholder={`Tìm trong nhóm ${activeGroup}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-[2rem] p-5 pl-14 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-sm"
          />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredConcepts.length > 0 ? (
          filteredConcepts.map((concept) => (
            <button
              key={concept.id}
              onClick={() => {
                  onSelect(concept);
                  window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              className="group text-left p-6 bg-white border border-slate-100 rounded-[2.5rem] hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all flex items-start gap-6 active:scale-[0.98] relative overflow-hidden"
            >
              <div className={`w-14 h-14 rounded-2xl ${concept.previewColor} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-all duration-500`}>
                  <span className="text-xl text-white">🔒</span>
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest">ID-LOCK #{concept.id}</span>
                  <div className="h-1 w-1 rounded-full bg-slate-200"></div>
                  <span className="text-[10px] font-bold text-slate-400">{concept.category}</span>
                </div>
                <p className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{concept.title}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed line-clamp-1">{concept.description}</p>
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                  </div>
              </div>
            </button>
          ))
        ) : (
          <div className="py-24 text-center space-y-4 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Chưa có concept khớp</p>
                <p className="text-[11px] text-slate-400 mt-1">Hãy thử tìm kiếm với từ khóa khác trong nhóm này.</p>
              </div>
          </div>
        )}
      </div>

      {/* Identity Security Footer */}
      <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] shadow-xl shadow-red-100/20">
          <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-red-600 rounded-2xl shadow-sm flex items-center justify-center text-white text-2xl shrink-0">🛡️</div>
              <div>
                  <p className="text-sm font-extrabold text-red-900 uppercase tracking-tight">Cam kết từ Phạm Khoa:</p>
                  <p className="text-[12px] text-slate-600 font-medium mt-2 leading-relaxed">
                      "Thuật toán <strong>Identity-Lock PK-2026</strong> sử dụng <i>pixel-matching</i> để đảm bảo các đặc điểm như: khoảng cách mắt, độ cao sống mũi, dáng môi và lỗ chân lông của bạn được giữ nguyên. Chúng tôi cam kết <strong>không Face-Swap</strong> (không thay đầu), chỉ thay đổi bối cảnh nghệ thuật."
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-red-100">Verified by PK-Face 2026</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default TetConceptLibrary;
