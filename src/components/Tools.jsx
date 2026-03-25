import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  Brain,
  Activity,
  Calendar as CalendarIcon,
  Flame,
  ChevronLeft,
  User as UserIcon,
  Weight,
  Clock,
  ChevronDown,
  Calculator,
  Sparkles,
  Bot,
  Cpu,
  Zap,
  Search,
  AlertTriangle,
  Camera,
  ImageIcon,
  X,
  Download,
  Scan,
  Dna,
  ShieldAlert
} from 'lucide-react';
import html2canvas from 'html2canvas';
import NutritionRecordSheet from './NutritionRecordSheet';

import toolNutrition from '../assets/tool-nutrition.png';
import toolInjury from '../assets/tool-injury.png';
import toolPlanner from '../assets/tool-planner.png';
import toolPhotoCal from '../assets/tool-photo-cal.png';
import toolExerciseDb from '../assets/tool-exercise-db.png';
import { supabase } from '../supabase';

const Tools = ({ initialTool = null, onBack = null, user }) => {
  const [activeTool, setActiveTool] = useState(initialTool);

  const handleBack = () => {
    if (activeTool && !initialTool) {
      setActiveTool(null);
    } else if (onBack) {
      onBack();
    }
  };

  if (activeTool === 'nutrition') return <NutritionistDetail onBack={handleBack} />;
  if (activeTool === 'injury') return <InjuryAssessmentDetail onBack={handleBack} user={user} />;
  if (activeTool === 'planner') return <AutoPlannerDetail onBack={handleBack} />;
  if (activeTool === 'photo_cal') return <PhotoCalDetail onBack={handleBack} />;
  if (activeTool === 'chat') return <ChatBotDetail onBack={handleBack} />;

  return (
    <div className="tools-page">
      <div className="tools-header">
        {onBack && (
          <button className="tools-back-btn" onClick={onBack}>
            <ChevronLeft size={24} color="white" />
          </button>
        )}
        <div className="tools-title-group">
          <h2 className="page-title"><span className="orange-text">JENZiQ</span> 工具</h2>
          <p className="page-subtitle">AI 驅動的健身智慧工具組</p>
        </div>
      </div>

      <div className="tools-container">
        {/* Top Banner */}
        <div className="ai-assistant-banner">
          <div className="banner-icon-box">
            <div className="pulse-circle"></div>
            <Flame size={20} color="white" fill="white" />
          </div>
          <div className="banner-content">
            <h3 className="banner-title">JENZiQ AI 健身助理</h3>
            <p className="banner-desc">5 個智慧工具，全面支援你的訓練旅程</p>
          </div>
        </div>

        {/* Premium Tool Cards */}
        <div className="tool-cards">
          {[
            {
              id: 'nutrition',
              title: 'AI 營養師',
              badge: 'Smart Diet',
              desc: '與專業營養師合作，精準計算熱量與比例，並自動生成智能菜單',
              img: toolNutrition,
              color: '#f97316',
              btn: '開始規劃'
            },
            {
              id: 'injury',
              title: 'AI 傷害評估',
              badge: 'Injury Scan',
              desc: '登記運動傷害資訊，AI 自動分析嚴重程度並提供恢復建議',
              img: toolInjury,
              color: '#ec4899',
              btn: '即刻評估'
            },
            {
              id: 'planner',
              title: '自動排課系統',
              badge: 'Auto Plan',
              desc: '依訓練天數、目標、方式自動生成個人化課表與動作說明',
              img: toolPlanner,
              color: '#3b82f6',
              btn: '快速排課'
            },
            {
              id: 'photo_cal',
              title: '照片熱量計算',
              badge: 'Photo Cal',
              desc: '拍攝或上傳食物照片，AI 自動分析食材組成、熱量及營養',
              img: toolPhotoCal,
              color: '#10b981',
              btn: '拍照紀錄'
            },
            {
              id: 'warmup',
              title: '動作資料庫',
              badge: 'Exercise DB',
              desc: '搜尋動作名稱與目標肌群，自動生成專業訓練計劃與組數建議',
              img: toolExerciseDb,
              color: '#8b5cf6',
              btn: '搜尋動作'
            }
          ].map((tool, idx) => {
            const hexToRgba = (hex, alpha) => {
              const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            return (
              <div 
                key={idx} 
                className="ai-banner-card" 
                style={{ 
                  '--tool-color': tool.color,
                  '--tool-glow': hexToRgba(tool.color, 0.25)
                }}
                onClick={() => tool.id !== 'warmup' ? setActiveTool(tool.id) : {}}
              >
                <div className="ai-banner-content">
                  <div className="ai-banner-badge">{tool.badge}</div>
                  <h4 className="ai-banner-title">{tool.title}</h4>
                  <p className="ai-banner-desc">{tool.desc}</p>
                  
                  <button className="ai-banner-btn">
                    {tool.btn}
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                <div className="ai-banner-image-container">
                  <img src={tool.img} alt="" className="ai-banner-3d-img" />
                </div>
              </div>
            );
          })}
        </div>
        <SupportBot onOpenChat={() => setActiveTool('chat')} />
      </div>

      <style>{`
        .tools-page {
          padding: 20px 16px 40px;
          background: var(--background);
          min-height: calc(100vh - var(--bottom-nav-height));
        }
        .tools-header { 
          margin-bottom: 24px; 
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .tools-back-btn {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
        }
        .tools-title-group {
          flex: 1;
        }
        .page-title { font-size: 26px; font-weight: 900; color: white; margin-bottom: 4px; }
        .orange-text { color: var(--primary); }
        .page-subtitle { font-size: 13px; color: #666; font-weight: 600; }

        .ai-assistant-banner {
          background: linear-gradient(135deg, #1e1e20 0%, #0a0a0b 100%);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 20px;
          border: 1px solid rgba(255, 107, 0, 0.15);
          position: relative;
          overflow: hidden;
        }
        .banner-icon-box {
          position: relative;
          width: 48px;
          height: 48px;
          background: var(--primary);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 16px rgba(255, 107, 0, 0.2);
        }
        .pulse-circle {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 14px;
          background: var(--primary);
          opacity: 0.5;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .banner-title { font-size: 18px; font-weight: 800; color: white; margin-bottom: 4px; }
        .banner-desc { font-size: 13px; color: #888; line-height: 1.4; font-weight: 600; }

        .tool-cards { display: grid; gap: 16px; }
        
        /* Premium Banner Card Styles */
        .ai-banner-card {
          position: relative;
          background: linear-gradient(135deg, #1a1a1c 0%, #0d0d0e 100%);
          border-radius: 28px;
          padding: 30px;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          cursor: pointer;
          margin-bottom: 8px;
        }
        .ai-banner-card:active { transform: scale(0.97); }
        .ai-banner-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 0% 0%, var(--tool-glow), transparent 70%);
          pointer-events: none;
        }
        .ai-banner-content { position: relative; z-index: 2; width: 60%; }
        .ai-banner-badge {
          font-size: 10px;
          font-weight: 900;
          color: var(--tool-color);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
          filter: brightness(1.2);
        }
        .ai-banner-title { font-size: 24px; font-weight: 800; color: white; margin-bottom: 12px; }
        .ai-banner-desc { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.6; margin-bottom: 24px; font-weight: 500; }
        .ai-banner-btn {
          background: var(--tool-color);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          box-shadow: 0 4px 15px var(--tool-glow);
        }
        .ai-banner-image-container { 
          position: absolute; 
          right: 0; 
          top: 0; 
          bottom: 0;
          width: 65%; 
          z-index: 1; 
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          overflow: hidden;
        }
        .ai-banner-3d-img { 
          height: 160%; 
          width: auto;
          object-fit: cover; 
          opacity: 0.9;
          mask-image: linear-gradient(to left, black 20%, transparent 95%);
          -webkit-mask-image: linear-gradient(to left, black 20%, transparent 95%);
          filter: drop-shadow(-10px 0 20px rgba(0,0,0,0.5)); 
          transform: translateX(15%) rotate(-2deg);
          transition: 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ai-banner-card:hover .ai-banner-3d-img { 
          transform: translateX(5%) scale(1.08) rotate(0deg); 
          opacity: 1;
        }
247,0.1); color: #A855F7; }
        .active-green { background: rgba(16,185,129,0.1); color: #10B981; }

        .tool-desc { font-size: 13px; color: #777; line-height: 1.5; margin-bottom: 16px; font-weight: 600; }
        .tool-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .tool-tag {
          font-size: 11px;
          background: rgba(255,255,255,0.03);
          color: #555;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

const ToolCard = ({ icon, title, desc, tags, badge, gradient, onClick }) => (
  <div className="tool-card" onClick={onClick}>
    <div className={`card-top-accent accent-${gradient}`}></div>
    <div className="card-header">
      <div className="header-left">
        <div className="tool-icon-box">{icon}</div>
        <div className="tool-info">
          <h4>{title}</h4>
          <span className={`badge active-${gradient}`}>{badge}</span>
        </div>
      </div>
      <ChevronRight size={18} color="#444" />
    </div>
    <p className="tool-desc">{desc}</p>
    <div className="tool-tags">
      {tags.map((tag, i) => <span key={i} className="tool-tag">{tag}</span>)}
    </div>
  </div>
);

/* Detail Views */

const NutritionistDetail = ({ onBack }) => {
  const [gender, setGender] = useState('male');
  const [goal, setGoal] = useState('lose');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState(1.725);
  const [results, setResults] = useState(null);

  const [showMealPlanForm, setShowMealPlanForm] = useState(false);
  const [mealCount, setMealCount] = useState(3);
  const [hasWPI, setHasWPI] = useState('no');
  const [wpiServings, setWpiServings] = useState(1);
  const [restriction, setRestriction] = useState('');
  const [specialNeed, setSpecialNeed] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const recordSheetRef = useRef(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleSaveRecord = async () => {
    if (!recordSheetRef.current) return;
    setIsGeneratingImage(true);
    
    // Give UI time to update showing the spinner
    await new Promise(r => setTimeout(r, 100));

    try {
      const canvas = await html2canvas(recordSheetRef.current, {
        scale: 1.5, // Reduced from 2 to save memory on mobile
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const fileName = `JENZiQ_營養紀錄表_${new Date().getTime()}.png`;
      const dataUrl = canvas.toDataURL('image/png', 0.8); // Slight compression

      // Check if it's mobile based on screen width or user agent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

      if (isMobile) {
        // On mobile, showing a preview is way more reliable than forcing a download/share
        setPreviewImage(dataUrl);
        setIsGeneratingImage(false);
        return;
      }

      // Default Download logic for Desktop
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ 已生成紀錄表！檔案已開始下載至您的電腦。');
    } catch (err) {
      console.error('Save error:', err);
      alert('生成失敗，記憶體不足或系統繁忙，請縮短菜單內容後再試。');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const calculate = () => {
    if (!height || !weight || !age) {
      alert('請填寫完整基本資料');
      return;
    }
    let bmr = (10 * Number(weight)) + (6.25 * Number(height)) - (5 * Number(age));
    if (gender === 'male') bmr += 5;
    else bmr -= 161;

    const tdee = bmr * activity;
    let targetCalories = tdee;
    if (goal === 'lose') targetCalories -= 500;
    else if (goal === 'gain') targetCalories += 300;

    const pKcal = targetCalories * 0.4;
    const cKcal = targetCalories * 0.35;
    const fKcal = targetCalories * 0.25;

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      protein: Math.round(pKcal / 4),
      carbs: Math.round(cKcal / 4),
      fat: Math.round(fKcal / 9)
    });
  };

  const generateMealPlan = async () => {
    setIsGenerating(true);
    setGeneratedPlan(null);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback for demo if key is missing, but with a warning in console
      console.warn('VITE_OPENAI_API_KEY is not set. Using local simulation.');
      setTimeout(() => {
        const localMock = {
          meals: [
            { name: "第 1 餐 - 模擬規劃", items: [{ food: "雞胸肉", weight: "150g", note: "高蛋白" }], fatNote: "無" }
          ],
          explanation: "⚠️ 偵測到尚未設定 VITE_OPENAI_API_KEY，目前顯示的是本地模擬內容。請在 .env.local 中設定金鑰以連線真實 OpenAI。"
        };
        setGeneratedPlan({
          ...localMock,
          proteinPowder: hasWPI === 'yes' ? `${wpiServings} 份` : null,
          targetCals: results.targetCalories,
          ratios: '模擬規劃'
        });
        setIsGenerating(false);
      }, 1000);
      return;
    }

    try {
      const prompt = `你是一位專業的運動營養師。請為 JENZiQ 學員生成一份一天的飲食計畫。
      學員資料：
      - 目標：${goal === 'lose' ? '減脂' : '增肌'}
      - 目標熱量：${results.targetCalories} kcal (誤差不超過 50 kcal)
      - 比例：40% 蛋白質, 35% 碳水, 25% 脂肪 (P: ${results.protein}g, C: ${results.carbs}g, F: ${results.fat}g)
      - 餐數：${mealCount} 餐
      - 乳清蛋白：${hasWPI === 'yes' ? wpiServings + ' 份' : '無'}
      - 忌口：${restriction || '無'}
      - 特殊需求：${specialNeed || '無'}

      要求：
      1. 每餐食材盡量「不重複」。
      2. 必須顯示「熟重」克數，並同步提供「手掌/拳頭/指頭」的感官份量估計（例如：約 1 個手掌大、約 1.5 個拳頭多）。
      3. 每餐固定包含至少一份蛋白質主食、一份碳水、一份蔬菜。
      4. 為這份菜單寫出專業的「編排邏輯解釋」回饋給學員。
      5. **特別注意**：如果學員的「忌口」或「特殊需求」與營養目標（熱量/比例）有嚴重衝突、過於奇怪、或在當前餐數下難以達成（例如：要求每餐吃10公斤蔬菜、或完全不吃任何含蛋白質食物但又要補足蛋白），請在「編排邏輯解釋」中以專業營養師的角度禮貌地解釋為何無法完全照辦，並說明你採取的折衷方案。
      6. 嚴格回傳 JSON 格式如下：
      {
        "meals": [
          {
            "name": "第 1 餐 - [主食名稱]",
            "items": [{"food": "食材名", "weight": "重量", "portion": "份量估算", "note": "特色"}],
            "fatNote": "脂肪補充建議"
          }
        ],
        "actualTotal": { "calories": 2790, "protein": 279, "carbs": 244, "fat": 77 },
        "explanation": "你的專業解釋文本"
      }`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '你是一位專業的運動營養師，回傳格式必須為 JSON 物件。' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const plan = JSON.parse(data.choices[0].message.content);

      setGeneratedPlan({
        ...plan,
        proteinPowder: hasWPI === 'yes' ? `${wpiServings} 份 (約 ${wpiServings * 22}g 蛋白質)` : null,
        targetCals: results.targetCalories,
        ratios: 'AI 真實規劃：40% 蛋白質 | 35% 碳水 | 25% 脂肪'
      });
    } catch (err) {
      console.error('OpenAI Error:', err);
      alert('AI 生成時發生錯誤，請檢查網路連線或 API Key。');
    } finally {
      setIsGenerating(false);
    }
  };

  const activityLevels = [
    { label: '身體活動趨於靜態 (幾乎不運動)', value: 1.2 },
    { label: '身體活動程度較低 (每週運動 1-3 天)', value: 1.375 },
    { label: '身體活動程度較過 (每週運動 3-5 天)', value: 1.55 },
    { label: '身體活動程度較高 (每週運動 6-7 天)', value: 1.725 },
    { label: '身體活動程度激烈 (長時間運動或工作)', value: 1.9 }
  ];

  return (
    <div className="tool-detail-page nutritionist-page">
      <DetailHeader
        icon={<div className="icon-wrap orange"><Brain size={22} color="white" /></div>}
        title="AI 營養師"
        subtitle="智慧營養需求計算"
        onBack={onBack}
      />

      <div className="detail-content">
        {!showMealPlanForm ? (
          <>
            <div className="premium-form-container">
              <div className="form-section-header">
                <div className="header-accent"></div>
                <h4>基本個人數據</h4>
              </div>
              
              <div className="form-card-v2">
                <div className="form-group-v2">
                  <label><UserIcon size={14} /> 您的性別</label>
                  
                  <div className="single-gender-visual">
                    <div className="visual-stage">
                      <div className={`gender-visual-box active ${gender}`}>
                        <img 
                          src={gender === 'male' ? "/images/male_muscle_v2.png" : "/images/female_muscle_v2.png"} 
                          alt="Gender Visual" 
                          className="muscle-fig-static" 
                        />
                        <div className="visual-platform-static"></div>
                      </div>
                    </div>
                  </div>

                  <div className="modern-toggles">
                    <div className={`modern-toggle ${gender === 'male' ? 'active male' : ''}`} onClick={() => setGender('male')}>男性</div>
                    <div className={`modern-toggle ${gender === 'female' ? 'active female' : ''}`} onClick={() => setGender('female')}>女性</div>
                  </div>
                </div>

                <div className="form-row-v2">
                  <div className="form-group-v2 flex-1">
                    <label><Activity size={14} /> 身高 (cm)</label>
                    <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="modern-input" placeholder="175" />
                  </div>
                  <div className="form-group-v2 flex-1">
                    <label><Weight size={14} /> 體重 (kg)</label>
                    <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="modern-input" placeholder="70" />
                  </div>
                </div>

                <div className="form-group-v2">
                  <label><Clock size={14} /> 現在年齡</label>
                  <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="modern-input" placeholder="25" />
                </div>

                <div className="form-group-v2">
                  <label><Zap size={14} /> 健身目標</label>
                  <div className="modern-tabs">
                    {['lose', 'gain', 'maintain'].map((m) => (
                      <div key={m} className={`modern-tab ${goal === m ? 'active' : ''}`} onClick={() => setGoal(m)}>
                        {m === 'lose' ? '減脂' : m === 'gain' ? '增肌' : '維持'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group-v2">
                  <label><Zap size={14} /> 每日活動量</label>
                  <div className="modern-select-box">
                    <select className="modern-select" value={activity} onChange={(e) => setActivity(Number(e.target.value))}>
                      {activityLevels.map((l, i) => <option key={i} value={l.value}>{l.label}</option>)}
                    </select>
                    <ChevronDown size={18} className="select-arrow" />
                  </div>
                </div>

                <button className="premium-submit-btn orange-glow" onClick={calculate}>
                  <Calculator size={18} />
                  <span>精準計算需求</span>
                </button>
              </div>
            </div>

            {results && (
              <div className="results-container">
                <div className="result-card main">
                  <div className="res-item"><span>基礎代謝率 (BMR)</span><span>{results.bmr} <small>kcal</small></span></div>
                  <div className="res-divider"></div>
                  <div className="res-item"><span>每日總消耗 (TDEE)</span><span className="res-value highlight">{results.tdee} <small>kcal</small></span></div>
                  <button className="ai-plan-btn" onClick={() => setShowMealPlanForm(true)}><Zap size={16} /> 菜單安排智能</button>
                </div>
                <h4 className="card-label">🥗 AI 建議每日攝取 (40/35/25)</h4>
                <div className="result-card">
                  <div className="res-item"><span>目標熱量</span><span>{results.targetCalories} <small>kcal</small></span></div>
                  <div className="res-divider"></div>
                  <div className="macros-grid">
                    <div className="macro-box"><span className="macro-name">蛋白質 (40%)</span><span className="macro-val">{results.protein}g</span></div>
                    <div className="macro-box"><span className="macro-name">碳水 (35%)</span><span className="macro-val">{results.carbs}g</span></div>
                    <div className="macro-box"><span className="macro-name">脂肪 (25%)</span><span className="macro-val">{results.fat}g</span></div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="premium-form-container">
            <div className="form-section-header">
              <div className="header-accent"></div>
              <h4>客製化菜單細節</h4>
              <button className="return-link" onClick={() => setShowMealPlanForm(false)}>返回計算</button>
            </div>

            <div className="form-card-v2">
              <div className="form-group-v2">
                <label><Clock size={14} /> 一天攝取餐數</label>
                <div className="modern-tabs">
                  {[2, 3, 4, 5].map(n => (
                    <div key={n} className={`modern-tab ${mealCount === n ? 'active' : ''}`} onClick={() => setMealCount(n)}>
                      {n}餐
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group-v2">
                <label><Flame size={14} /> 額外乳清補充</label>
                <div className="modern-toggles">
                  <div className={`modern-toggle ${hasWPI === 'yes' ? 'active orange' : ''}`} onClick={() => setHasWPI('yes')}>我有喝</div>
                  <div className={`modern-toggle ${hasWPI === 'no' ? 'active' : ''}`} onClick={() => setHasWPI('no')}>不常喝</div>
                </div>
              </div>

              {hasWPI === 'yes' && (
                <div className="form-group-v2">
                  <label><Zap size={14} /> 每日份量</label>
                  <div className="modern-tabs">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className={`modern-tab ${wpiServings === n ? 'active' : ''}`} onClick={() => setWpiServings(n)}>
                        {n}份
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group-v2">
                <label><X size={14} /> 飲食忌口</label>
                <input type="text" placeholder="例如：過敏、不吃牛、素食..." className="modern-input" value={restriction} onChange={e => setRestriction(e.target.value)} />
              </div>

              <div className="form-group-v2">
                <label><Sparkles size={14} /> 進階需求</label>
                <input type="text" placeholder="例如：多吃原型食物、低碳..." className="modern-input" value={specialNeed} onChange={e => setSpecialNeed(e.target.value)} />
              </div>

              <button
                className="premium-submit-btn orange-glow"
                onClick={generateMealPlan}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="spinner"></div>
                    AI 正在為您規劃食譜...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> 生成專屬菜單
                  </>
                )}
              </button>
            </div>
            {isGenerating && (
              <div className="generated-plan-container">
                <div className="robot-loader-card">
                  <div className="robot-wrap">
                    <div className="robot-head">
                      <div className="eye left"></div>
                      <div className="eye right"></div>
                    </div>
                    <div className="robot-body">
                      <div className="cpu-core"><Cpu size={24} color="#FF6B00" /></div>
                    </div>
                  </div>
                  <div className="loader-title">AI 營養大腦正在高速運轉</div>
                  <p className="loader-subtitle">正在根據您的身體參數、健身目標與特殊需求，計算最佳食材配比...</p>
                  <div className="logic-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            {!isGenerating && generatedPlan && (
              <div className="generated-plan-container">
                <h4 className="card-label">📝 AI 推薦食譜</h4>
                <div className="plan-summary-card">
                  <div className="summary-row">
                    <span>目標熱量：{generatedPlan.targetCals} kcal</span>
                    <span>AI 規劃總計：<span className="actual-val">{generatedPlan.actualTotal?.calories || generatedPlan.targetCals} kcal</span></span>
                  </div>
                  {generatedPlan.actualTotal && (
                    <div className="actual-macros-row">
                      <span>P: {generatedPlan.actualTotal.protein}g</span>
                      <span>C: {generatedPlan.actualTotal.carbs}g</span>
                      <span>F: {generatedPlan.actualTotal.fat}g</span>
                    </div>
                  )}
                  {generatedPlan.proteinPowder && <div className="wp-note">已包含 {generatedPlan.proteinPowder} 補充</div>}
                </div>
                {generatedPlan.meals.map((m, i) => (
                  <div className="meal-card" key={i}>
                    <div className="meal-header">{m.name}</div>
                    <div className="meal-items">
                      {m.items.map((it, j) => (
                        <div className="meal-item" key={j}>
                          <div className="item-info">
                            <span className="item-food">{it.food}</span>
                            <span className="item-note">{it.note}</span>
                            {it.portion && <span className="item-portion">📏 {it.portion}</span>}
                          </div>
                          <span className="item-weight">{it.weight}</span>
                        </div>
                      ))}
                    </div>
                    {m.fatNote && <div className="meal-footer-note">{m.fatNote}</div>}
                  </div>
                ))}

                {generatedPlan.explanation && (
                  <div className="ai-explanation-card">
                    <div className="explanation-title flex items-center gap-2">
                      <Sparkles size={16} /> AI 營養師編排解釋
                    </div>
                    <div className="explanation-text">{generatedPlan.explanation}</div>
                  </div>
                )}

                <button 
                  className="submit-btn orange" 
                  style={{ marginTop: '20px', background: '#3B82F6', boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)' }}
                  onClick={handleSaveRecord}
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <><div className="spinner"></div> 正在生成中...</>
                  ) : (
                    <><Download size={18} /> 一鍵生成紀錄表</>
                  )}
                </button>

                <div style={{ position: 'fixed', top: 0, left: '-9999px', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                  <NutritionRecordSheet 
                    ref={recordSheetRef} 
                    data={generatedPlan} 
                    results={{...results, height, weight, age, activity}} 
                  />
                </div>

                {previewImage && (
                  <div className="share-preview-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    zIndex: 3000,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>紀錄表已生成</span>
                      <button onClick={() => setPreviewImage(null)} style={{ color: 'white' }}>
                        <X size={24} />
                      </button>
                    </div>
                    <div className="preview-instructions" style={{ 
                      backgroundColor: '#FF5C00', 
                      padding: '10px', 
                      borderRadius: '8px',
                      marginBottom: '20px',
                      fontSize: '14px'
                    }}>
                      💡 請「長按圖片」選擇「儲存影像」或「加入照片」即可存入您的相簿。
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <img 
                        src={previewImage} 
                        alt="Nutrition Record" 
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} 
                      />
                    </div>
                    <button 
                      onClick={() => setPreviewImage(null)}
                      style={{ 
                        marginTop: '20px', 
                        padding: '15px', 
                        background: '#333', 
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      關閉預覽
                    </button>
                  </div>
                )}

                <div className="disclaimer">* 重量均為烹飪後熟重。建議搭配充足份量蔬菜，確保豐富膳食纖維。</div>
              </div>
            )}
          </div>
        )}
      </div>
      <DetailStyles />
      <style>{`
        .nutritionist-page {
          background: #0a0a0b;
          background-image: url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='150' y='150' font-family='Arial, sans-serif' font-weight='900' font-size='40' fill='white' fill-opacity='0.04' text-anchor='middle' transform='rotate(-35, 150, 150)'%3EJENZiQ%3C/text%3E%3C/svg%3E");
          background-attachment: fixed;
          min-height: 100vh;
        }
        
        .premium-form-container {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .form-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 0 4px;
        }
        .header-accent { width: 4px; height: 16px; background: var(--primary); border-radius: 4px; }
        .form-section-header h4 { font-size: 16px; font-weight: 800; color: white; margin: 0; flex: 1; }
        .return-link { background: none; border: none; color: #666; font-size: 13px; font-weight: 700; cursor: pointer; }

        .form-card-v2 {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 28px;
          padding: 24px;
          backdrop-filter: blur(20px);
        }

        .form-group-v2 { margin-bottom: 24px; }
        .form-group-v2 label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #888;
          margin-bottom: 12px;
        }
        .form-row-v2 { display: flex; gap: 16px; }
        .flex-1 { flex: 1; }

        .single-gender-visual {
          height: 180px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
        }
        .visual-stage {
          position: relative;
          width: 140px;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 10px;
        }
        .gender-visual-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: boxFadeIn 0.5s ease-out;
        }
        @keyframes boxFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .muscle-fig-static {
          width: 130px;
          height: auto;
          animation: simpleFloat 4s ease-in-out infinite;
          mix-blend-mode: lighten;
          mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
        }
        @keyframes simpleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .visual-platform-static {
          width: 100px;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          filter: blur(5px);
          margin-top: -10px;
        }
        .male .visual-platform-static {
          background: rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
        .female .visual-platform-static {
          background: rgba(236, 72, 153, 0.4);
          box-shadow: 0 0 15px rgba(236, 72, 153, 0.5);
        }

        .modern-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 14px 18px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          transition: all 0.3s;
          outline: none;
        }
        .modern-input:focus {
          border-color: var(--primary);
          background: rgba(255,107,0,0.05);
          box-shadow: 0 0 15px rgba(255,107,0,0.1);
        }

        .modern-toggles { display: flex; gap: 10px; }
        .modern-toggle {
          flex: 1;
          padding: 14px;
          text-align: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          color: #777;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modern-toggle.active {
          background: #333;
          border-color: #666;
          color: white;
        }
        .modern-toggle.active.male { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.1); }
        .modern-toggle.active.female { border-color: #ec4899; color: #ec4899; background: rgba(236,72,153,0.1); }
        .modern-toggle.active.orange { border-color: var(--primary); color: var(--primary); background: rgba(255,107,0,0.1); }

        .modern-tabs { display: flex; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 4px; gap: 4px; }
        .modern-tab {
          flex: 1;
          padding: 10px;
          text-align: center;
          font-size: 13px;
          font-weight: 800;
          color: #666;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modern-tab.active { background: #fff; color: #000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

        .modern-select-box { position: relative; }
        .modern-select {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 14px 18px;
          color: white;
          font-size: 14px;
          font-weight: 700;
          appearance: none;
          outline: none;
        }
        .select-arrow { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: #666; pointer-events: none; }

        .premium-submit-btn {
          width: 100%;
          padding: 18px;
          border-radius: 20px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 12px;
        }
        .premium-submit-btn.orange-glow {
          background: var(--primary);
          color: white;
          box-shadow: 0 10px 25px rgba(255, 107, 0, 0.3);
        }
        .premium-submit-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(255, 107, 0, 0.4); }
        .premium-submit-btn:active { transform: translateY(-1px); }
        .premium-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .result-card {
          background: rgba(255, 107, 0, 0.05);
          border: 1px solid rgba(255, 107, 0, 0.1);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .res-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .res-item span:first-child { color: #888; font-size: 13px; font-weight: 700; }
        .res-item span:last-child { color: white; font-size: 18px; font-weight: 900; }
        .res-value.highlight { color: var(--primary) !important; font-size: 26px !important; }
        .res-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 16px 0; }
        
        .ai-plan-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 14px;
          color: white;
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
          transition: all 0.2s;
        }
        .ai-plan-btn:hover { background: rgba(255, 255, 255, 0.1); }

        .macros-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .macro-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 16px 12px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .macro-name { font-size: 10px; color: #666; font-weight: 800; text-transform: uppercase; }
        .macro-val { font-size: 18px; font-weight: 900; color: white; }

        .generated-plan-container { margin-top: 24px; }
        .plan-summary-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 20px; margin-bottom: 24px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #888; font-weight: 800; margin-bottom: 10px; }
        .actual-val { color: var(--primary); }
        .actual-macros-row { display: flex; gap: 10px; }
        .actual-macros-row span { background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 8px; font-size: 12px; color: #aaa; font-weight: 800; }

        .meal-card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; padding: 24px; margin-bottom: 20px; }
        .meal-header { font-size: 18px; font-weight: 900; color: white; margin-bottom: 20px; }
        .meal-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .item-food { font-size: 16px; font-weight: 800; color: #eee; }
        .item-note { font-size: 11px; color: #555; font-weight: 700; margin-top: 2px; }
        .item-weight { font-size: 18px; font-weight: 900; color: var(--primary); }
        .item-portion { color: #888; font-size: 11px; margin-top: 4px; }

        .robot-loader-card { padding: 40px 24px; text-align: center; }
        .loader-title { font-size: 18px; font-weight: 900; color: white; margin: 20px 0 10px; }
        .loader-subtitle { font-size: 13px; color: #666; line-height: 1.6; }

        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .intensity-val { color: #E11D48; font-weight: 900; font-size: 18px; }
      `}</style>
    </div>
  );
};

const DetailHeader = ({ icon, title, subtitle, onBack }) => (
  <header className="detail-header">
    <button className="back-btn" onClick={onBack}><ChevronLeft size={24} color="white" /></button>
    <div className="header-info">
      <div className="header-title-row">{icon}<h3 className="detail-title">{title}</h3></div>
      <p className="detail-subtitle">{subtitle}</p>
    </div>
  </header>
);

const DetailStyles = () => (
  <style>{`
    .tool-detail-page { 
      position: fixed; 
      top: 0; 
      left: 50%; 
      transform: translateX(-50%); 
      width: 100%; 
      max-width: 480px; 
      height: 100%; 
      background: #0a0a0b; 
      background-image: url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='150' y='150' font-family='Arial, sans-serif' font-weight='900' font-size='40' fill='white' fill-opacity='0.1' text-anchor='middle' transform='rotate(-35, 150, 150)'%3EJENZiQ%3C/text%3E%3C/svg%3E");
      background-attachment: fixed;
      z-index: 1100; 
      overflow-y: auto; 
      padding-bottom: 40px; 
      box-shadow: 0 0 30px rgba(0,0,0,0.5); 
    }
    .detail-header { padding: 16px 20px; display: flex; align-items: center; gap: 16px; background: rgba(10, 10, 11, 0.9); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .back-btn { width: 40px; height: 40px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-info { display: flex; flex-direction: column; }
    .header-title-row { display: flex; align-items: center; gap: 10px; }
    .icon-wrap { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .icon-wrap.orange { background: #FF6B00; }
    .icon-wrap.red { background: #E11D48; }
    .icon-wrap.blue { background: #3B82F6; }
    .detail-title { font-size: 18px; font-weight: 800; color: white; }
    .detail-subtitle { font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; margin-top: -2px; padding-left: 42px; }
    .detail-content { padding: 24px 20px; position: relative; z-index: 2; }

    /* Premium Form Shared Styles */
    .premium-form-container { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .form-section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 0 4px; }
    .header-accent { width: 4px; height: 16px; background: var(--primary); border-radius: 4px; }
    .header-accent.red { background: #E11D48; }
    .form-section-header h4 { font-size: 16px; font-weight: 800; color: white; margin: 0; flex: 1; }
    .return-link { background: none; border: none; color: #666; font-size: 13px; font-weight: 700; cursor: pointer; }

    .form-card-v2 {
      background: rgba(25, 25, 27, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 28px;
      padding: 24px;
      backdrop-filter: blur(20px);
      margin-bottom: 24px;
    }

    .form-group-v2 { margin-bottom: 24px; }
    .form-group-v2 label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #888; margin-bottom: 12px; }
    .form-row-v2 { display: flex; gap: 16px; }
    .flex-1 { flex: 1; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }

    .modern-input, .modern-textarea {
      width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 14px 18px;
      color: white;
      font-size: 16px;
      font-weight: 700;
      transition: all 0.3s;
      outline: none;
    }
    .modern-textarea { min-height: 100px; resize: none; font-size: 14px; }
    .modern-input:focus, .modern-textarea:focus { border-color: var(--primary); background: rgba(255,107,0,0.05); }

    .modern-toggles, .modern-tabs { display: flex; gap: 10px; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 4px; }
    .modern-toggle, .modern-tab {
      flex: 1; padding: 12px; text-align: center; border-radius: 12px;
      color: #777; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s;
    }
    .modern-toggle.active, .modern-tab.active { background: #fff; color: #000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .modern-toggle.active.male { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.15); }
    .modern-toggle.active.female { border-color: #ec4899; color: #ec4899; background: rgba(236,72,153,0.15); }
    .modern-toggle.active.red { border-color: #E11D48; color: #E11D48; background: rgba(225,29,72,0.15); }
    .modern-toggle.active.orange { border-color: var(--primary); color: var(--primary); background: rgba(255,107,0,0.15); }

    .stack-btns-v2 { display: flex; flex-direction: column; gap: 10px; }
    .stack-btn-v2 {
      padding: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; color: #888; font-size: 14px; font-weight: 800; cursor: pointer; text-align: center; transition: all 0.2s;
    }
    .stack-btn-v2.active.red { background: rgba(225,29,72,0.15); border-color: #E11D48; color: #E11D48; }

    .premium-submit-btn {
      width: 100%; padding: 18px; border-radius: 20px; border: none;
      display: flex; align-items: center; justify-content: center; gap: 12px;
      font-size: 16px; font-weight: 900; cursor: pointer; transition: all 0.3s;
    }
    .premium-submit-btn.orange-glow { background: var(--primary); color: white; box-shadow: 0 10px 25px rgba(255, 107, 0, 0.3); }
    .premium-submit-btn.red-glow { background: #E11D48; color: white; box-shadow: 0 10px 25px rgba(225, 29, 72, 0.3); }
    .premium-submit-btn:hover { transform: translateY(-3px); }

    .premium-slider { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; appearance: none; outline: none; margin: 15px 0; }
    .premium-slider::-webkit-slider-thumb { appearance: none; width: 24px; height: 24px; background: #E11D48; border-radius: 50%; cursor: pointer; border: 4px solid #151516; box-shadow: 0 0 15px rgba(225,29,72,0.4); }
    .intensity-val { color: #E11D48; font-weight: 900; font-size: 20px; transition: 0.3s; }
    .intensity-val.neon-red { color: #ff0033; text-shadow: 0 0 10px #ff0033; font-size: 24px; }
    .slider-labels { font-size: 11px; color: #555; font-weight: 700; }

    .premium-slider.neon-red-slider::-webkit-slider-thumb {
      background: #ff0033;
      box-shadow: 0 0 20px #ff0033, 0 0 40px rgba(255, 0, 51, 0.4);
      border-color: #fff;
    }
    .premium-slider.neon-red-slider {
      background: linear-gradient(to right, #E11D48 0%, #ff0033 100%);
    }

    .robot-loader-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 32px; padding: 40px 24px; text-align: center; }
    .loader-title { font-size: 18px; font-weight: 900; color: white; margin: 20px 0 10px; }
    .loader-subtitle { font-size: 13px; color: #666; line-height: 1.6; }

    .spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.2); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
mary); border-color: var(--primary); color: white; }
    .toggle-btn.active-red { background: #991b1b; border-color: #dc2626; color: white; }
    .stack-btns { display: flex; flex-direction: column; gap: 8px; }
    .stack-btn { padding: 14px; background: #1e1e20; border: 1px solid #2d2d30; border-radius: 12px; color: #888; font-size: 14px; font-weight: 700; text-align: center; }
    .stack-btn.active { background: var(--primary); border-color: var(--primary); color: white; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .check-btn { padding: 10px 4px; background: #1e1e20; border: 1px solid #2d2d30; border-radius: 8px; color: #777; font-size: 11px; font-weight: 700; }
    .check-btn.active { background: rgba(255, 92, 0, 0.1); border-color: var(--primary); color: var(--primary); }
    .submit-btn { width: 100%; padding: 16px; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 16px; font-weight: 800; margin-top: 24px; color: white; border: none; outline: none; transition: 0.3s; }
    .submit-btn.orange { background: var(--primary); box-shadow: 0 6px 20px rgba(255, 92, 0, 0.3); }
    .submit-btn.gray { background: #27272a; color: #52525b; }
    .result-placeholder { padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; color: #3f3f46; text-align: center; border: 2px dashed #1e1e20; border-radius: 24px; }
    .select-container { position: relative; width: 100%; }
    .form-select { width: 100%; background: #1e1e20; border: 1px solid #2d2d30; border-radius: 12px; padding: 14px 16px; padding-right: 40px; color: white; font-size: 14px; font-weight: 600; appearance: none; outline: none; }
    .select-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: #666; pointer-events: none; }
    .results-container { margin-top: 24px; }
    .result-card { background: #1a1a1c; border-radius: 20px; padding: 20px; border: 1px solid rgba(255, 107, 0, 0.1); margin-bottom: 24px; }
    .result-card.main { border-color: rgba(255, 107, 0, 0.3); }
    .res-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 14px; font-weight: 600; color: #888; }
    .res-item span:last-child { font-size: 20px; color: white; font-weight: 800; }
    .res-value.highlight { color: var(--primary) !important; font-size: 24px !important; }
    .res-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 16px 0; }
    .macros-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .macro-box { background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .macro-name { font-size: 10px; color: #666; font-weight: 700; }
    .macro-val { font-size: 16px; font-weight: 850; color: white; }
  `}</style>
);

/* Photo Calorie Detail */

const PhotoCalDetail = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (previewUrl && !result && !isAnalyzing) {
      analyzeImage();
    }
  }, [previewUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    setResult(null);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '你是一位專業的營養師。請分析圖片中的食物。回傳格式必須為 JSON 物件。'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `請分析這張照片中的食物。列出所有可辨識的食材，並估算各食材的熱量及三大營養素（蛋白質、碳水、脂肪）。最後在最下方給出整盤食物的總和統計。
                  請特別估算這道菜的「整體名稱」。
                  嚴格回傳 JSON 格式如下：
                  {
                    "mealName": "食物名稱(例如: 舒肥雞胸沙拉)",
                    "items": [
                      { "food": "食材名稱", "kcal": 150, "protein": 20, "carbs": 5, "fat": 8, "note": "量感描述" }
                    ],
                    "total": { "calories": 450, "protein": 35, "carbs": 40, "fat": 15 },
                    "chefNote": "詳細的健康建議與營養回饋 (至少 60 字)"
                  }`
                },
                {
                  type: 'image_url',
                  image_url: { url: previewUrl || '' }
                }
              ]
            }
          ],
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const analysis = JSON.parse(data.choices[0].message.content);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      alert('分析失敗：' + (err.message || '請稍後再試'));
      setPreviewUrl(null); // Reset on failure
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="tool-detail-page photo-cal-page">
      {!result ? (
        <>
          {/* Landing State with Background */}
          {!previewUrl && !isAnalyzing ? (
            <div className="photo-cal-landing">
              <button className="landing-back-btn" onClick={onBack}><ChevronLeft size={24} color="white" /></button>

              <div className="landing-content">
                <div className="landing-text-box">
                  <h2 className="landing-title">AI 視覺熱量計算</h2>
                  <p className="landing-subtitle">拍照或選擇照片，秒級分析營養成分</p>
                </div>

                <div className="landing-actions">
                  <button className="landing-btn primary" onClick={() => cameraInputRef.current.click()}>
                    <Camera size={20} />
                    現場拍攝
                  </button>
                  <button className="landing-btn secondary" onClick={() => fileInputRef.current.click()}>
                    <ImageIcon size={20} />
                    選擇照片
                  </button>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handleImageChange}
                  hidden
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  hidden
                />
              </div>
            </div>
          ) : (
            <>
              <DetailHeader
                icon={<div className="icon-wrap green"><Camera size={22} color="white" /></div>}
                title="AI 辨識中"
                subtitle="正在進行視覺營養分析"
                onBack={() => { setPreviewUrl(null); setIsAnalyzing(false); }}
              />
              <div className="detail-content">
                <div className="analyzing-preview-card">
                  <img src={previewUrl} alt="Preview" className="analyzing-img" />
                  <div className="scanning-line"></div>
                </div>

                <div className="robot-loader-card" style={{ mt: '24px', borderColor: 'rgba(16,185,129,0.1)' }}>
                  <div className="robot-wrap">
                    <div className="robot-head" style={{ borderColor: '#10B981' }}>
                      <div className="eye left" style={{ background: '#10B981', boxShadow: '0 0 10px #10B981' }}></div>
                      <div className="eye right" style={{ background: '#10B981', boxShadow: '0 0 10px #10B981' }}></div>
                    </div>
                    <div className="robot-body"><div className="cpu-core"><Cpu size={24} color="#10B981" /></div></div>
                  </div>
                  <div className="loader-title">AI 視覺中樞啟動</div>
                  <p className="loader-subtitle">正在掃描圖片中的像素邊緣，解析食物種類與估算份量空間...</p>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="photo-result-hero">
          {/* Header Controls Overlay */}
          <div className="hero-header">
            <button className="hero-back-btn" onClick={() => setResult(null)}><ChevronLeft size={24} /></button>
            <button className="hero-close-btn" onClick={onBack}><X size={24} /></button>
          </div>

          {/* Top Image */}
          <div className="hero-image-wrap">
            <img src={previewUrl} alt="Analyzed meal" className="hero-image" />
          </div>

          {/* Main Info Box */}
          <div className="result-body">
            <div className="meal-main-header">
              <h2 className="meal-name">{result.mealName || '分析結果'}</h2>
              <div className="meal-total-summary">{result.total.calories} Cal</div>
            </div>

            {/* Macros Bar */}
            <div className="macros-strip">
              <div className="macro-item">
                <span className="macro-num">{result.total.calories}</span>
                <span className="macro-label">Calories</span>
              </div>
              <div className="macro-item">
                <span className="macro-num">{result.total.protein}g</span>
                <span className="macro-label">Proteins</span>
              </div>
              <div className="macro-item">
                <span className="macro-num">{result.total.fat}g</span>
                <span className="macro-label">Fats</span>
              </div>
              <div className="macro-item">
                <span className="macro-num">{result.total.carbs}g</span>
                <span className="macro-label">Carbs</span>
              </div>
            </div>

            <div className="divider-line"></div>

            {/* AI Advice */}
            {result.chefNote && (
              <div className="ai-advice-section">
                <p className="advice-text">{result.chefNote}</p>
              </div>
            )}

            {/* Detailed Ingredients */}
            <div className="ingredients-section">
              <h4 className="section-title">📊 食材細節分析</h4>
              <div className="ingredient-cards">
                {result.items.map((it, i) => (
                  <div className="ingredient-card" key={i}>
                    <div className="ing-card-main">
                      <div className="ing-name-box">
                        <span className="ing-title">{it.food}</span>
                        <span className="ing-subtitle">{it.note}</span>
                      </div>
                      <div className="ing-cal-box">{it.kcal} <small>kcal</small></div>
                    </div>
                    <div className="ing-macros-row">
                      <span>P: {it.protein}g</span>
                      <span>F: {it.fat}g</span>
                      <span>C: {it.carbs}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="result-disclaimer">
              * AI 分析基於視覺辨識，份量為估算值，僅供參考。
            </p>
          </div>
        </div>
      )}

      <DetailStyles />
      <style>{`
        .photo-cal-page { }
        
        .hero-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 60px;
          padding: 0 16px;
          display: flex; justify-content: space-between; align-items: center;
          z-index: 100;
          background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
        }
        .hero-back-btn, .hero-close-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(0,0,0,0.4);
          border: none; color: white;
          display: flex; align-items: center; justify-content: center;
        }

        .hero-image-wrap {
          width: 100%;
          height: 45vh;
          overflow: hidden;
        }
        .hero-image {
          width: 100%; height: 100%;
          object-fit: cover;
        }

        .result-body {
          margin-top: -24px;
          background: #0a0a0b;
          border-radius: 24px 24px 0 0;
          padding: 24px 20px;
          position: relative;
          z-index: 5;
          min-height: 60vh;
        }

        .meal-main-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .meal-name { font-size: 24px; font-weight: 900; color: white; flex: 1; }
        .meal-total-summary { font-size: 14px; color: #666; font-weight: 700; }

        .macros-strip {
          display: flex;
          justify-content: space-between;
          padding: 0 10px;
          margin-bottom: 24px;
        }
        .macro-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .macro-num { font-size: 18px; font-weight: 900; color: white; }
        .macro-label { font-size: 11px; color: #666; font-weight: 700; text-transform: uppercase; }

        .divider-line { 
          height: 1px; background: rgba(255,255,255,0.05); 
          margin: 0 -20px 24px; 
        }

        .ai-advice-section { margin-bottom: 32px; }
        .advice-text { 
          font-size: 15px; line-height: 1.6; color: #ccc; 
          font-weight: 500;
          background: rgba(16,185,129,0.03);
          padding: 16px; border-radius: 16px;
          border-left: 3px solid #10B981;
        }

        .section-title { 
          font-size: 16px; font-weight: 800; color: white; 
          margin-bottom: 16px; 
        }
        .ingredient-cards { display: grid; gap: 12px; }
        .ingredient-card {
          background: #151516;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .ing-card-main {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 12px;
        }
        .ing-name-box { display: flex; flex-direction: column; gap: 2px; }
        .ing-title { font-size: 16px; font-weight: 800; color: #eee; }
        .ing-subtitle { font-size: 11px; color: #555; }
        .ing-cal-box { font-size: 16px; font-weight: 900; color: #10B981; }
        .ing-macros-row {
          display: flex; gap: 12px;
          font-size: 11px; color: #666; font-weight: 700;
        }
        .ing-macros-row span {
          background: rgba(255,255,255,0.02);
          padding: 2px 8px; border-radius: 6px;
        }

        .result-disclaimer {
          text-align: center; color: #444; font-size: 11px;
          margin-top: 40px; padding-bottom: 20px;
        }

        /* Landing Styles */
        .photo-cal-landing {
          height: 100vh;
          width: 100%;
          background: url('/images/photo-cal-bg.png') no-repeat center center;
          background-size: cover;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-bottom: 60px;
        }
        .photo-cal-landing::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
          z-index: 1;
        }
        .landing-back-btn {
          position: absolute;
          top: 20px; left: 20px;
          z-index: 10;
          width: 44px; height: 44px;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          border: none;
          display: flex; align-items: center; justify-content: center;
        }
        .landing-content {
          position: relative;
          z-index: 2;
          padding: 0 30px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .landing-text-box { text-align: center; }
        .landing-title { font-size: 28px; font-weight: 900; color: white; margin-bottom: 8px; }
        .landing-subtitle { font-size: 15px; color: #ccc; font-weight: 600; }

        .landing-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .landing-btn {
          width: 100%;
          padding: 18px;
          border-radius: 18px;
          font-size: 16px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: none;
          transition: transform 0.2s;
        }
        .landing-btn:active { transform: scale(0.96); }
        .landing-btn.primary {
          background: var(--primary);
          color: white;
          box-shadow: 0 8px 24px rgba(255, 107, 0, 0.3);
        }
        .landing-btn.secondary {
          background: rgba(255,255,255,0.1);
          color: white;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .analyzing-preview-card {
          width: 100%;
          height: 300px;
          background: #151516;
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          margin-bottom: 24px;
          border: 1px solid #333;
        }
        .analyzing-img {
          width: 100%; height: 100%; object-fit: cover; opacity: 0.6;
        }
        .scanning-line {
          position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(to right, transparent, var(--primary), transparent);
          box-shadow: 0 0 15px var(--primary);
          animation: scan 2.5s infinite ease-in-out;
        }
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};

/* Other Tool Details Mocks */

const InjuryAssessmentDetail = ({ onBack, user }) => {
  const height = user?.profile?.height;
  const weight = user?.profile?.weight;
  const [target, setTarget] = useState('');
  const [timing, setTiming] = useState('運動中疼痛');
  const [intensity, setIntensity] = useState(5);
  const [details, setDetails] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // 計算 BMI 作為身形比例依據
  const h_m = (height || 170) / 100;
  const bmi = (weight || 65) / (h_m * h_m);
  
  // 身形動態計算
  const getBodyScale = () => {
    // 基準：身高 175 為 scaleY 1.0, BMI 22 為 scaleX 1.0
    const hScale = Math.max(0.85, Math.min(1.15, (height || 175) / 175));
    const wScale = Math.max(0.75, Math.min(1.4, bmi / 22));
    return { x: wScale, y: hScale };
  };

  useEffect(() => {
    if (height || weight) {
      setIsScanning(true);
      const timer = setTimeout(() => setIsScanning(false), 800);
      return () => clearTimeout(timer);
    }
  }, [height, weight]);

  const timingOptions = ['運動中疼痛', '運動後當天疼痛', '運動後隔天疼痛', '無預兆疼痛'];

  const analyzeInjury = async () => {
    if (!target) return alert('請填寫受傷部位');

    // 如果痛感為 9 或 10，需要二次確認
    if (intensity >= 9) {
      const confirmNotice = window.confirm('偵測到劇烈疼痛 (9-10 級)，系統將會通知真人管理員主動詢問您的身體情況，是否確定送出？');
      if (!confirmNotice) return;
    }

    setIsAnalyzing(true);
    setResult(null);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    try {
      // 深度獲取使用者資料 (優先使用 prop，失敗則試圖從 supabase session 抓取)
      let userData = {
        name: user?.profile?.name || user?.email || '匿名學員',
        email: user?.email || '無電子郵件',
        phone: user?.profile?.phone || '未提供'
      };

      // 如果 prop 是空的，試圖從資料庫重新抓取以防萬一
      if (!user || (!user.profile?.name && !user.email)) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('email', session.user.email)
              .single();
            
            userData = {
              name: profile?.name || session.user.email || '系統學員',
              email: session.user.email,
              phone: profile?.phone || '未提供'
            };
          }
        } catch (authErr) {
          console.error('Auth fallback failed:', authErr);
        }
      }

      // 構建評估數據
      const reportData = {
        target,
        timing,
        intensity,
        details,
        timestamp: new Date().toISOString(),
        user: userData
      };

      // 如果痛感很高，儲存警訊到 localStorage (模擬後台接收)
      if (intensity >= 9) {
        let existingAlerts = [];
        try {
          const stored = localStorage.getItem('injury_alerts');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) existingAlerts = parsed;
          }
        } catch (err) {
          console.error('Failed to parse existing alerts:', err);
        }
        localStorage.setItem('injury_alerts', JSON.stringify([reportData, ...existingAlerts]));
      }

      const prompt = `你是一位同時具備「專業醫師」與「資深健身教練」身份的運動防護權威。請根據學員提供的資料，從臨床醫學、人體解剖學及肌肉運動學（Kinesiology）的深度視角出發，進行精準的代償分析與傷害判別。
      資料：
      - 受傷/疼痛部位：${target}
      - 疼痛時段：${timing}
      - 痛感程度 (1-10)：${intensity}
      - 補充細節：${details || '無'}

      要求：
      1. 找出最有可能的傷害名稱。
      2. 評估分析狀態，必須從以下三個標籤中選擇一個作為「分析狀態」：
         - 「高度確認」：現有線索非常明確指向該傷害。
         - 「不確定」：症狀可能指向多種傷害，需要更多臨床檢查。
         - 「無法辨識」：資料過於模糊或自相矛盾。
      3. 詳細分析「可能原因」：運用解剖學原理解釋肌肉代償、張力失衡、或是動力鏈（Kinetic Chain）斷裂。此部分必須論述詳盡，至少 70 字。
      4. 提供「預防建議」：基於運動學提出具體的訓練動作優化、關節穩定練習或錯誤模式修正。此部分必須論述詳盡，至少 70 字。
      5. 提供「處置方法」：結合醫學臨床處置與實務恢復手段。此部分必須論述詳盡，至少 70 字。
      6. 針對學員提供的「補充細節」進行「線索深度解析」，解釋這些徵兆在生理力學上的意義。
      7. 最後加入法律免責提示。

      嚴格回傳 JSON 格式：
      {
        "injuryName": "名稱",
        "status": "高度確認" | "不確定" | "無法辨識",
        "reasons": "深度原因分析內容（至少70字）",
        "prevention": "專業預防建議內容（至少70字）",
        "treatment": "後續處置建議內容（至少70字）",
        "detailAnalysis": "針對補充細節的深入解釋",
        "disclaimer": "醫學免責聲明"
      }`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '你是一位專業的運動防護員，回傳格式必須為 JSON 物件。' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      setResult(JSON.parse(data.choices[0].message.content));
    } catch (err) {
      console.error(err);
      alert('分析失敗，請稍後再試');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="tool-detail-page injury-assessment-page">
      <div className="tech-hud-overlay"></div>
      <div className="tech-scanline"></div>
      
      <DetailHeader
        icon={<div className="icon-wrap red pulse-red-icon"><Brain size={22} color="white" /></div>}
        title="AI 傷害評估"
        subtitle="專業復健科技分析系統"
        onBack={onBack}
      />
      
      <div className="detail-content tech-content">
        <div className="premium-form-container glass-tech-card">
          <div className="form-section-header">
            <div className="header-accent-glow red"></div>
            <h4 className="tech-header-text">
              <Scan size={16} className="tech-icon-spin" />
              BIOMETRIC REGISTRY / 傷害登記
            </h4>
          </div>

          <div className="form-card-v2 tech-card-inner">
            <div className="form-group-v2 tech-group">
              <label className="tech-label">
                <Dna size={14} /> 
                <span>AFFECTED AREA / 受傷部位</span>
              </label>
              <div className="tech-input-wrapper">
                <input 
                  type="text" 
                  placeholder="例如：右膝蓋外側、下背部..." 
                  className="modern-input tech-input" 
                  value={target} 
                  onChange={e => setTarget(e.target.value)} 
                />
                <div className="input-glow"></div>
              </div>
            </div>

            <div className="form-group-v2 tech-group">
              <label className="tech-label">
                <Clock size={14} /> 
                <span>CHRONOLOGICAL TIMING / 疼痛時段</span>
              </label>
              <div className="stack-btns-v2 tech-stacks">
                {timingOptions.map(opt => (
                  <div 
                    key={opt} 
                    className={`stack-btn-v2 tech-stack-btn ${timing === opt ? 'active red tech-glow' : ''}`} 
                    onClick={() => setTiming(opt)}
                  >
                    <span className="btn-label">{opt}</span>
                    {timing === opt && <div className="btn-active-dot"></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group-v2 tech-group">
              <label className="flex-between tech-label">
                <span><ShieldAlert size={14} /> PAIN INTENSITY / 痛感程度 (1-10)</span>
                <span className={`intensity-val tech-num ${intensity >= 8 ? 'neon-red' : ''}`}>
                  {intensity.toString().padStart(2, '0')}
                </span>
              </label>
              <div className="slider-hud-wrap">
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1" 
                  className={`premium-slider red tech-slider ${intensity >= 8 ? 'neon-red-slider' : ''}`} 
                  value={intensity} 
                  onChange={e => setIntensity(Number(e.target.value))} 
                />
                <div className="slider-ticks">
                  {[...Array(10)].map((_, i) => <div key={i} className={`tick ${intensity > i ? 'active' : ''}`}></div>)}
                </div>
              </div>
              <div className="flex-between slider-labels tech-sub-labels">
                <span>THRESHOLD MIN</span>
                <span>CRITICAL MAX</span>
              </div>
            </div>

            <div className="form-group-v2 tech-group">
              <label className="tech-label">
                <Sparkles size={14} /> 
                <span>SUPPLEMENTARY INTEL / 補充細節</span>
              </label>
              <div className="tech-textarea-wrapper">
                <textarea 
                  placeholder="請描述具體感受與動作受限情境..." 
                  className="modern-textarea tech-textarea" 
                  value={details} 
                  onChange={e => setDetails(e.target.value)}
                ></textarea>
                <div className="input-glow"></div>
              </div>
            </div>

            <button className="premium-submit-btn red-glow tech-submit" onClick={analyzeInjury} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <div className="tech-loading-wrap">
                  <div className="tech-spinner"></div>
                  <span>PROCESSING...</span>
                </div>
              ) : (
                <>
                  <Activity size={18} className="btn-icon-pulse" />
                  <span className="btn-text">INITIALIZE DIAGNOSIS / 分析傷害</span>
                </>
              )}
              <div className="btn-hover-ray"></div>
            </button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="robot-loader-card" style={{ borderColor: 'rgba(225,29,72,0.1)' }}>
            <div className="robot-wrap">
              <div className="robot-head" style={{ borderColor: '#E11D48' }}>
                <div className="eye left" style={{ background: '#E11D48', boxShadow: '0 0 10px #E11D48' }}></div>
                <div className="eye right" style={{ background: '#E11D48', boxShadow: '0 0 10px #E11D48' }}></div>
              </div>
              <div className="robot-body"><div className="cpu-core"><Cpu size={24} color="#E11D48" /></div></div>
            </div>
            <div className="loader-title">AI 防護大腦掃描中</div>
            <p className="loader-subtitle">正在對比數千份運動傷害文獻，尋找最可能的受傷原因...</p>
          </div>
        )}

        {result && (
          <div className="injury-result-container tech-result-view">
            <div className="injury-main-card tech-result-card">
              <div className="status-indicators tech-status-row">
                {['高度確認', '不確定', '無法辨識'].map(s => (
                  <div key={s} className={`status-tag tech-tag ${result.status === s ? 'active' : ''}`}>
                    <div className="status-light"></div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              
              <div className="result-header-box">
                <div className="header-glitch">DIAGNOSIS REPORT</div>
                <h3 className="injury-title tech-title">{result.injuryName}</h3>
              </div>

              <div className="tech-data-table">
                <div className="table-row">
                  <div className="row-label"><Activity size={14} /> POSSIBLE CAUSE / 可能原因</div>
                  <div className="row-value">{result.reasons}</div>
                </div>
                
                <div className="table-row">
                  <div className="row-label"><ShieldAlert size={14} /> PREVENTION / 預防建議</div>
                  <div className="row-value">{result.prevention}</div>
                </div>

                <div className="table-row">
                  <div className="row-label"><Zap size={14} /> TREATMENT / 處置方法</div>
                  <div className="row-value">{result.treatment}</div>
                </div>
              </div>

              {result.detailAnalysis && (
                <div className="tech-log-box">
                  <div className="log-header">
                    <Search size={14} /> 
                    <span>SYSTEM LOG: DETAIL ANALYSIS / 線索分析</span>
                  </div>
                  <div className="log-content">
                    <p className="res-text">{result.detailAnalysis}</p>
                  </div>
                  <div className="log-footer">ANALYSIS COMPLETE - 100%</div>
                </div>
              )}
            </div>
            <div className="medical-disclaimer tech-disclaimer">
              <AlertTriangle size={12} />
              <span>{result.disclaimer}</span>
            </div>
          </div>
        )}
      </div>
      <DetailStyles />
      <style>{`
        .injury-assessment-page {
          background-color: #060608;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }
        
        /* Tech Overlay & HUD */
        .tech-hud-overlay {
          position: fixed;
          inset: 0;
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(225, 29, 72, 0.05) 0%, transparent 80%),
            linear-gradient(rgba(225, 29, 72, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225, 29, 72, 0.03) 1px, transparent 1px);
          background-size: 100% 100%, 30px 30px, 30px 30px;
          pointer-events: none;
          z-index: 0;
        }
        
        .tech-scanline {
          position: fixed;
          top: 0; left: 0; right: 0; height: 100px;
          background: linear-gradient(to bottom, transparent, rgba(225, 29, 72, 0.05), transparent);
          z-index: 0;
          pointer-events: none;
          animation: techScan 10s linear infinite;
        }
        
        @keyframes techScan {
          from { transform: translateY(-100vh); }
          to { transform: translateY(100vh); }
        }

        .tech-content {
          padding: 0 20px 40px;
          position: relative;
          z-index: 2;
        }

        /* Glassmorphism Tech Card */
        .glass-tech-card {
          background: rgba(20, 20, 22, 0.7);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          border: 1px solid rgba(225, 29, 72, 0.2);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(225, 29, 72, 0.05);
          overflow: hidden;
        }

        .tech-header-text {
          color: rgba(225, 29, 72, 0.9);
          font-family: 'Outfit', sans-serif;
          letter-spacing: 2px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .tech-icon-spin { animation: spin 8s linear infinite; }
        
        .tech-card-inner { padding: 30px 24px !important; background: transparent !important; }

        .tech-label {
          color: #666;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tech-num {
          font-family: 'Monaco', monospace;
          background: rgba(225, 29, 72, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 16px;
        }

        /* Input Tech Decorations */
        .tech-input-wrapper, .tech-textarea-wrapper {
          position: relative;
        }
        .tech-input, .tech-textarea {
          background: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 12px !important;
          transition: 0.3s;
          color: white;
        }
        .tech-input:focus, .tech-textarea:focus {
          border-color: #E11D48 !important;
          box-shadow: 0 0 15px rgba(225, 29, 72, 0.15) !important;
          background: rgba(0, 0, 0, 0.6) !important;
        }

        /* Stack Buttons Tech */
        .tech-stacks { gap: 10px !important; }
        .tech-stack-btn {
          background: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 14px !important;
          padding: 14px !important;
          position: relative;
          overflow: hidden;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tech-stack-btn .btn-label { font-size: 14px; font-weight: 700; z-index: 2; position: relative; }
        .tech-stack-btn.active {
          background: rgba(225, 29, 72, 0.1) !important;
          border-color: #E11D48 !important;
          box-shadow: 0 0 20px rgba(225, 29, 72, 0.2);
        }
        .btn-active-dot {
          position: absolute;
          top: 8px; right: 8px; width: 6px; height: 6px;
          background: #E11D48; border-radius: 50%;
          box-shadow: 0 0 8px #E11D48;
        }

        /* Slider HUD */
        .slider-hud-wrap { position: relative; padding: 20px 0 10px; }
        .slider-ticks {
          display: flex; justify-content: space-between;
          position: absolute; top: 10px; left: 0; right: 0;
          pointer-events: none;
        }
        .tick { width: 2px; height: 6px; background: #333; border-radius: 1px; transition: 0.3s; }
        .tick.active { background: #E11D48; box-shadow: 0 0 5px #E11D48; }

        .tech-slider::-webkit-slider-thumb {
          width: 24px; height: 24px;
          background: #E11D48;
          border: 3px solid #000;
          box-shadow: 0 0 15px #E11D48;
        }

        .tech-sub-labels span { font-size: 9px; color: #444; font-weight: 900; }

        /* Submit Button Sci-Fi */
        .tech-submit {
          height: 60px !important;
          margin-top: 10px;
          background: #E11D48 !important;
          border-radius: 18px !important;
          position: relative;
          overflow: hidden;
          border: none !important;
        }
        .tech-submit:active { transform: scale(0.96); }
        .tech-submit::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 60%);
          opacity: 0; transition: 0.3s;
        }
        .tech-submit:hover::after { opacity: 1; transform: scale(1.1); }
        
        .btn-icon-pulse { animation: techHeartbeat 2s infinite; }
        @keyframes techHeartbeat {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .tech-loading-wrap { display: flex; align-items: center; gap: 12px; font-weight: 900; letter-spacing: 2px; }
        .tech-spinner {
          width: 20px; height: 20px;
          border: 3px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Result View Tech */
        .tech-result-view { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); margin-bottom: 50px; }
        .tech-result-card {
          background: rgba(10, 10, 12, 0.9) !important;
          border: 1px solid rgba(225, 29, 72, 0.4) !important;
          padding: 30px 20px !important;
          position: relative;
        }
        .result-header-box { margin-bottom: 25px; padding-left: 15px; border-left: 3px solid #E11D48; }
        .header-glitch { font-size: 10px; color: #E11D48; font-weight: 900; letter-spacing: 3px; margin-bottom: 5px; opacity: 0.8; }
        .tech-title { font-size: 24px; color: white; margin: 0; font-weight: 800; letter-spacing: 1px; }

        .tech-data-table {
          display: flex; flex-direction: column; gap: 1px;
          background: rgba(225, 29, 72, 0.1);
          border: 1px solid rgba(225, 29, 72, 0.2);
          border-radius: 16px; overflow: hidden;
          margin-bottom: 25px;
        }
        .table-row {
          background: rgba(15, 15, 18, 0.95);
          display: flex; flex-direction: column;
          padding: 16px;
        }
        .row-label {
          font-size: 11px; color: #E11D48; font-weight: 900;
          letter-spacing: 1px; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
          text-transform: uppercase;
        }
        .row-value { font-size: 14px; color: #ccc; line-height: 1.6; }

        .tech-log-box {
          background: rgba(0, 0, 0, 0.5);
          border: 1px dashed rgba(225, 29, 72, 0.3);
          border-radius: 12px; padding: 15px;
          position: relative;
        }
        .log-header {
          display: flex; align-items: center; gap: 8px;
          color: #aaa; font-size: 11px; font-weight: 900;
          margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 8px;
        }
        .log-footer {
          margin-top: 12px; text-align: right; font-size: 9px;
          color: #444; font-weight: 900; font-family: monospace;
        }

        .tech-disclaimer {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(225, 29, 72, 0.05);
          padding: 15px; border-radius: 12px;
          color: #666; font-size: 11px; font-weight: 500;
          line-height: 1.5; margin-top: 20px;
        }
        .tech-disclaimer svg { flex-shrink: 0; margin-top: 2px; }

        /* Status Indicator Tech Tags */
        .tech-status-row { display: flex; gap: 10px; margin-bottom: 25px; align-items: center; justify-content: flex-start; }
        .tech-tag {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 12px; border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: 0.3s;
        }
        .tech-tag.active {
          background: rgba(225, 29, 72, 0.12);
          border: 1px solid rgba(225, 29, 72, 0.3);
          box-shadow: 0 0 15px rgba(225, 29, 72, 0.1);
        }
        .status-light {
          width: 8px; height: 8px; border-radius: 50%;
          background: #333; transition: 0.3s;
        }
        .tech-tag.active .status-light {
          background: #E11D48;
          box-shadow: 0 0 10px #E11D48;
          animation: techHeartbeat 1.5s infinite;
        }
        .tech-tag span { font-size: 11px; font-weight: 800; color: #666; transition: 0.3s; }
        .tech-tag.active span { color: #E11D48; }

        .pulse-red-icon { animation: redIconPulse 2s infinite; }
        @keyframes redIconPulse {
          0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(225, 29, 72, 0); }
          100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
        }

        .neon-red { color: #ff2d55; text-shadow: 0 0 10px rgba(255,45,85,0.5); }
        .neon-red-slider::-webkit-slider-thumb { background: #ff2d55; box-shadow: 0 0 25px rgba(255,45,85,1); }
      `}</style>
    </div>
  );
};

const AutoPlannerDetail = ({ onBack }) => (
  <div className="tool-detail-page">
    <DetailHeader
      icon={<div className="icon-wrap blue"><CalendarIcon size={22} color="white" /></div>}
      title="自動排課系統"
      subtitle="智慧訓練排程"
      onBack={onBack}
    />
    <div className="detail-content">
      <div className="result-placeholder">
        <AlertTriangle size={40} />
        <p>排課系統資料庫建置中<br />我們正在與專業教練核對動作細節</p>
      </div>
    </div>
    <DetailStyles />
  </div>
);

const SupportBot = ({ onOpenChat }) => {
  return (
    <div className="support-bot-container">
      <div className="bot-speech-bubble" onClick={onOpenChat}>
        <p>如果有問題，或是不知道怎麼操作，都可以詢問我喔！😊</p>
      </div>
      <div className="robot-wrapper" onClick={onOpenChat}>
        <div className="robot-body-anim">
          <div className="robot-head">
            <div className="robot-eyes">
              <div className="eye"></div>
              <div className="eye"></div>
            </div>
          </div>
          <div className="robot-torso">
            <Zap size={12} color="#10B981" />
          </div>
        </div>
        <div className="robot-platform"></div>
      </div>

      <style>{`
        .support-bot-container {
          position: fixed;
          bottom: 100px;
          right: 20px;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          cursor: pointer;
        }
        .bot-speech-bubble {
          background: white;
          color: #333;
          padding: 12px 16px;
          border-radius: 20px 20px 4px 20px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          margin-bottom: 12px;
          max-width: 200px;
          animation: float 3s ease-in-out infinite;
        }
        .bot-speech-bubble p { font-size: 13px; font-weight: 700; line-height: 1.4; color: #111; }
        
        .robot-wrapper { display: flex; flex-direction: column; align-items: center; }
        .robot-body-anim { width: 44px; height: 50px; display: flex; flex-direction: column; align-items: center; animation: hover 2s ease-in-out infinite; }
        .robot-head { width: 34px; height: 26px; background: #222; border-radius: 9px; border: 2.5px solid #10B981; position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }
        .robot-eyes { display: flex; gap: 6px; }
        .eye { width: 4px; height: 4px; background: #10B981; border-radius: 50%; animation: blink 3s infinite; }
        .robot-torso { width: 26px; height: 18px; background: #222; border-radius: 6px; border: 2.5px solid #10B981; display: flex; align-items: center; justify-content: center; }
        .robot-platform { width: 34px; height: 4px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; filter: blur(2px); margin-top: 4px; animation: shadowPulse 2s ease-in-out infinite; }

        @keyframes hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes shadowPulse { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(0.8); opacity: 0.1; } }
        @keyframes blink { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
      `}</style>
    </div>
  );
};

const ChatBotDetail = ({ onBack }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: '您好！我是 JENZiQ 功能導航助手。如果您在使用 AI 營養師、傷害評估或排課系統上有任何疑問，或是想單純聊天，我都在這裡喔！' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `你是一位 JENZiQ FITNESS APP 的智慧型客服導覽機器人。
              APP 主要功能包含：
              1. AI 營養師：計算熱量需求 (TDEE) 並生成智能菜單。
              2. AI 傷害評估：分析運動傷害嚴重程度並給予建議。
              3. 自動排課系統：根據目標自動安排訓練動作。
              4. 照片熱量計算：拍攝食物照片即可分析營養成分。
              
              請以親切、幽默、專業的口吻回答問題。如果使用者詢問如何使用特定功能，請簡潔說明步驟。如果使用者想聊天，也可以愉快地聊天。`
            },
            ...messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: userMsg }
          ]
        })
      });

      const data = await response.json();
      const botReply = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'bot', content: botReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: '抱歉，我現在大腦有點卡住，請稍後再試。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-detail-page">
      <DetailHeader
        icon={<div className="icon-wrap green"><Bot size={22} color="white" /></div>}
        title="JENZiQ 線上客服"
        subtitle="功能教學與諮詢"
        onBack={onBack}
      />
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble-wrap ${m.role === 'bot' ? 'bot' : 'user'}`}>
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">對方正在輸入中...</div>}
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          placeholder="輸入您的問題..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}><Zap size={18} color="white" /></button>
      </div>

      <style>{`
        .chat-detail-page { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--background); z-index: 1200; display: flex; flex-direction: column; }
        .chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; margin-bottom: 80px; }
        .chat-bubble-wrap { display: flex; width: 100%; }
        .chat-bubble-wrap.bot { justify-content: flex-start; }
        .chat-bubble-wrap.user { justify-content: flex-end; }
        .chat-bubble { max-width: 80%; padding: 12px 16px; border-radius: 18px; font-size: 14px; font-weight: 600; line-height: 1.5; }
        .bot .chat-bubble { background: #1e1e20; color: #ccc; border-radius: 18px 18px 18px 4px; }
        .user .chat-bubble { background: #10B981; color: white; border-radius: 18px 18px 4px 18px; }
        .typing-indicator { font-size: 12px; color: #555; font-style: italic; }
        .chat-input-row { position: fixed; bottom: 0; left: 0; width: 100%; background: #0a0a0b; padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 12px; }
        .chat-input-row input { flex: 1; background: #151516; border: 1px solid #333; border-radius: 12px; padding: 12px 16px; color: white; outline: none; }
        .chat-input-row button { width: 48px; height: 48px; background: #10B981; border: none; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
};

export default Tools;
