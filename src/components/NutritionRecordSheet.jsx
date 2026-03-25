import React from 'react';

const NutritionRecordSheet = React.forwardRef(({ data, profile, results }, ref) => {
  if (!data || !results) return null;

  const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

  const activityLevels = [
    { label: '幾乎不運動', value: 1.2 },
    { label: '每週運動 1-3 天', value: 1.375 },
    { label: '每週運動 3-5 天', value: 1.55 },
    { label: '每週運動 6-7 天', value: 1.725 },
    { label: '長時間運動或工作', value: 1.9 }
  ];

  const currentActivity = activityLevels.find(l => l.value === (results.activity || results.activity_level))?.label || '中度活動';

  return (
    <div 
      ref={ref}
      style={{
        width: '800px',
        padding: '60px',
        backgroundColor: '#FFFFFF',
        color: '#000000',
        fontFamily: "'Noto Sans TC', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        boxSizing: 'border-box',
        border: '1px solid #E5E7EB'
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#111827' }}>個人營養評估紀錄表</h1>
        <p style={{ fontSize: '16px', color: '#6B7280', margin: '8px 0 0 0', letterSpacing: '1px' }}>Personal Nutrition Assessment Form</p>
      </div>

      {/* Section 1: Basic Info */}
      <Section title="學員基本資料">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
          <Field label="姓名" value={profile?.name || '學員'} width="30%" />
          <Field label="性別" value={results.gender === 'male' ? '男' : '女'} width="30%" />
          <Field label="年齡 (歲)" value={results.age} width="30%" />
          <Field label="身高 (cm)" value={results.height} width="30%" />
          <Field label="體重 (kg)" value={results.weight} width="30%" />
          <Field label="紀錄日期" value={today} width="30%" />
        </div>
      </Section>

      {/* Section 2: Metabolism */}
      <Section title="代謝評估">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
            <Field label="常態活動量" value={currentActivity} width="45%" />
            <div style={{ display: 'flex', gap: '20px', width: '50%' }}>
              <Field label="BMR (kcal)" value={results.bmr} width="33%" />
              <Field label="TDEE (kcal)" value={results.tdee} width="33%" />
              <Field label="目標熱量" value={results.targetCalories} width="33%" color="#FF5C00" />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>※ 基礎代謝率 (BMR) 採核心公式計算；TDEE 則包含運動消耗。</p>
        </div>
      </Section>

      {/* Section 3: Macros */}
      <Section title="三大營養素分配比例">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', border: '1px solid #000' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB' }}>
              <th style={tableHeaderStyle}>營養素</th>
              <th style={tableHeaderStyle}>比例 (%)</th>
              <th style={tableHeaderStyle}>熱量 (kcal)</th>
              <th style={tableHeaderStyle}>目標克數 (g)</th>
              <th style={tableHeaderStyle}>熱量換算</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableCellStyle}><div style={{display:'flex', alignItems:'center', justifyContent:'center'}}><span style={{width:'8px', height:'8px', borderRadius:'50%', backgroundColor: '#EAB308', marginRight: '10px'}}></span>碳水化合物</div></td>
              <td style={{...tableCellStyle, backgroundColor: '#FEFCE8'}}>35%</td>
              <td style={tableCellStyle}>{Math.round(results.targetCalories * 0.35)}</td>
              <td style={{...tableCellStyle, color: '#2563EB', fontWeight: 'bold'}}>{results.carbs}g</td>
              <td style={tableCellStyle}>4 kcal / g</td>
            </tr>
            <tr>
              <td style={tableCellStyle}><div style={{display:'flex', alignItems:'center', justifyContent:'center'}}><span style={{width:'8px', height:'8px', borderRadius:'50%', backgroundColor: '#EF4444', marginRight: '10px'}}></span>蛋白質</div></td>
              <td style={{...tableCellStyle, backgroundColor: '#FEF2F2'}}>40%</td>
              <td style={tableCellStyle}>{Math.round(results.targetCalories * 0.4)}</td>
              <td style={{...tableCellStyle, color: '#2563EB', fontWeight: 'bold'}}>{results.protein}g</td>
              <td style={tableCellStyle}>4 kcal / g</td>
            </tr>
            <tr>
              <td style={tableCellStyle}><div style={{display:'flex', alignItems:'center', justifyContent:'center'}}><span style={{width:'8px', height:'8px', borderRadius:'50%', backgroundColor: '#10B981', marginRight: '10px'}}></span>脂肪</div></td>
              <td style={{...tableCellStyle, backgroundColor: '#F0FDF4'}}>25%</td>
              <td style={tableCellStyle}>{Math.round(results.targetCalories * 0.25)}</td>
              <td style={{...tableCellStyle, color: '#2563EB', fontWeight: 'bold'}}>{results.fat}g</td>
              <td style={tableCellStyle}>9 kcal / g</td>
            </tr>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>
              <td style={tableCellStyle}>當日合計</td>
              <td style={tableCellStyle}>100%</td>
              <td style={tableCellStyle}>{results.targetCalories} kcal</td>
              <td style={tableCellStyle}>-</td>
              <td style={tableCellStyle}>-</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Section 4: Daily Diet Plan */}
      <Section title="智能菜單規劃內容">
        {data.meals.map((meal, index) => (
          <div key={index} style={{ marginBottom: index === data.meals.length - 1 ? 0 : '25px' }}>
            <div style={{ backgroundColor: '#111827', color: '#FFF', padding: '10px 18px', fontSize: '15px', fontWeight: 'bold', borderRadius: '4px 4px 0 0' }}>
              🍳 {meal.name}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', border: '1px solid #111827' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{...mealHeaderStyle, width: '30%'}}>食材項目</th>
                  <th style={{...mealHeaderStyle, width: '20%'}}>建議重量 (熟重)</th>
                  <th style={{...mealHeaderStyle, width: '25%'}}>份量估算</th>
                  <th style={{...mealHeaderStyle, width: '25%'}}>特色備註</th>
                </tr>
              </thead>
              <tbody>
                {meal.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{...mealCellStyle, fontWeight: 'bold', textAlign: 'left', paddingLeft: '20px'}}>{item.food}</td>
                    <td style={{...mealCellStyle, color: '#FF5C00', fontWeight: 'bold'}}>{item.weight}</td>
                    <td style={mealCellStyle}>{item.portion || '-'}</td>
                    <td style={{...mealCellStyle, fontSize: '12px', color: '#666'}}>{item.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Section>

      {/* Section 5: Summary */}
      <Section title="攝取目標核對表">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', border: '1px solid #1F2937' }}>
          <thead style={{ backgroundColor: '#1F2937', color: '#FFF' }}>
            <tr>
              <th style={tableHeaderStyle}>項目</th>
              <th style={tableHeaderStyle}>當日熱量 (kcal)</th>
              <th style={tableHeaderStyle}>碳水 (g)</th>
              <th style={tableHeaderStyle}>蛋白質 (g)</th>
              <th style={tableHeaderStyle}>脂肪 (g)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{...tableCellStyle, fontWeight: 'bold'}}>AI 規劃總額</td>
              <td style={tableCellStyle}>{data.actualTotal?.calories || results.targetCalories}</td>
              <td style={tableCellStyle}>{data.actualTotal?.carbs || results.carbs}</td>
              <td style={tableCellStyle}>{data.actualTotal?.protein || results.protein}</td>
              <td style={tableCellStyle}>{data.actualTotal?.fat || results.fat}</td>
            </tr>
            <tr>
              <td style={tableCellStyle}>學員個人目標</td>
              <td style={tableCellStyle}>{results.targetCalories}</td>
              <td style={tableCellStyle}>{results.carbs}</td>
              <td style={tableCellStyle}>{results.protein}</td>
              <td style={tableCellStyle}>{results.fat}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '20px' }}>
        * 本表格為 AI 營養大腦根據模型計算之建議，僅供參考。
      </div>
    </div>
  );
});

const Section = ({ title, children }) => (
  <div style={{ border: '2px solid #000', marginBottom: '10px' }}>
    <div style={{ backgroundColor: '#000', color: '#FFF', padding: '6px 15px', fontWeight: 'bold', fontSize: '16px' }}>
      ■ {title}
    </div>
    <div style={{ padding: '15px' }}>
      {children}
    </div>
  </div>
);

const Field = ({ label, value, width, color }) => (
  <div style={{ borderBottom: '1px solid #CCC', paddingBottom: '4px', width: width || 'auto' }}>
    <label style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>{label}</label>
    <div style={{ fontSize: '18px', fontWeight: 'bold', color: color || '#111827' }}>{value}</div>
  </div>
);

const tableHeaderStyle = { border: '1px solid #000', padding: '10px', fontSize: '13px' };
const tableCellStyle = { border: '1px solid #000', padding: '10px', fontSize: '14px' };
const mealHeaderStyle = { border: '1px solid #000', padding: '6px', fontSize: '11px', color: '#666' };
const mealCellStyle = { border: '1px solid #000', padding: '8px', fontSize: '13px' };

export default NutritionRecordSheet;
