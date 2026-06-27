import React, { useState } from 'react';

// 🚀 UPDATED: Pointing to your live production Render backend
const BASE_URL = "https://vision-food-backend.onrender.com";

export default function App() {
  const [activeTab, setActiveTab] = useState('diet');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    } else {
      setError("Please select a valid image file.");
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError("Please upload a food image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const endpointMap = {
      diet: "/api/diet/analyze",
      workout: "/api/fitness/burn-workout",
      swap: "/api/diet/healthy-swap"
    };

    try {
      const response = await fetch(`${BASE_URL}${endpointMap[activeTab]}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Analysis engine pipeline processing failed.");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-container">
          <h1 className="logo">VISION<span>FIT</span></h1>
        </div>
      </header>

      <main className="app-main">
        <div className="tabs-nav">
          {[
            { id: 'diet', label: 'Allergen & Diet Scan' },
            { id: 'workout', label: 'Calorie Burn Circuit' },
            { id: 'swap', label: 'Healthy Recipe Swap' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); }}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid-container">
          <div className="panel">
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="file-picker" />
            
            {previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-img" />
                <label htmlFor="file-picker" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px' }}>
                  Click image to change
                </label>
              </div>
            ) : (
              <label htmlFor="file-picker" className="upload-label">
                <span style={{ fontSize: '32px', marginBottom: '8px' }}>📸</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Select or Drop Food Photo</span>
              </label>
            )}

            <button onClick={handleScan} disabled={loading || !selectedFile} className="scan-btn">
              {loading ? 'Analyzing Neural Vision...' : 'Execute AI Scan'}
            </button>

            {error && <div className="error-msg">⚠️ {error}</div>}
          </div>

          <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', margin: '0 0 16px 0' }}>Analysis Results Metrics</h3>

            {loading && (
              <div className="placeholder-view">
                <div className="spinner"></div>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Consulting vision intelligence matrix...</p>
              </div>
            )}

            {!loading && !result && (
              <div className="placeholder-view">
                <span style={{ fontSize: '28px', marginBottom: '8px' }}>📊</span>
                <p style={{ fontSize: '13px' }}>Submit an image to populate diagnostic models.</p>
              </div>
            )}

            {!loading && result && (
              <div className="animate-fadeIn" style={{ width: '100%' }}>
                {activeTab === 'diet' && (
                  <>
                    <h4 className="result-title">{result.food_item}</h4>
                    <div className="metric-row">
                      <div className="kcal-text">{result.calories} <span>kcal</span></div>
                      <div className="sub-badge">Health Score: {result.health_score}/10</div>
                    </div>
                    <div className="macro-grid">
                      <div><div className="macro-name">Protein</div><div className="macro-val" style={{ color: '#10b981' }}>{result.macronutrients?.protein}</div></div>
                      <div><div className="macro-name">Carbs</div><div className="macro-val" style={{ color: '#f59e0b' }}>{result.macronutrients?.carbs}</div></div>
                      <div><div className="macro-name">Fats</div><div className="macro-val" style={{ color: '#f43f5e' }}>{result.macronutrients?.fats}</div></div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Potential Allergens:</div>
                      {result.allergens?.length > 0 ? result.allergens.map((a, i) => (
                        <span key={i} className="allergen-tag">{a}</span>
                      )) : <span style={{ fontSize: '12px', color: '#64748b' }}>None detected</span>}
                    </div>
                  </>
                )}

                {activeTab === 'workout' && (
                  <>
                    <h4 className="result-title">{result.workout_name}</h4>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 12px 0' }}>Crafted to balance the ~{result.estimated_calories} kcal from your meal: <span style={{ color: '#f1f5f9' }}>{result.detected_meal}</span></p>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>⏳ Target Duration: {result.duration_minutes} Mins</div>
                    {result.exercises?.map((ex, idx) => (
                      <div key={idx} className="exercise-card">
                        <div className="exercise-header">
                          <span>{idx + 1}. {ex.name}</span>
                          <span style={{ color: '#10b981' }}>{ex.duration_or_reps}</span>
                        </div>
                        <p style={{ fontStyle: 'italic', fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>💡 Tip: {ex.tip}</p>
                      </div>
                    ))}
                  </>
                )}

                {activeTab === 'swap' && (
                  <>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Detected: {result.original_meal}</div>
                    <h4 className="result-title" style={{ color: '#10b981', marginTop: '4px' }}>🔄 {result.healthy_swap_name}</h4>
                    <div className="sub-badge" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)', display: 'inline-block', margin: '4px 0 12px 0' }}>
                      📉 Lowers calorie profile by -{result.calorie_savings} kcal!
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}>Macro-Clean Ingredients:</div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#cbd5e1' }}>
                        {result.ingredients?.map((ing, i) => <li key={i}>{ing}</li>)}
                      </ul>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>Prep Directions:</div>
                      <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#94a3b8' }}>
                        {result.instructions?.map((inst, i) => <li key={i} style={{ marginBottom: '6px', lineHeight: '1.4' }}>{inst}</li>)}
                      </ol>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}