import { Shield, Bell, Palette } from 'lucide-react';

const SettingsManager = () => {
    return (
        <div className="settings-manager">
            <header className="page-header">
                <h2 className="page-title">系統設定</h2>
                <p className="page-subtitle">管理應用程式的基礎設定與視覺佈局</p>
            </header>

            <div className="settings-content">
                <section className="settings-section">
                    <div className="section-group-header">
                        <Shield size={20} className="header-icon" />
                        <h3>安全性與權限 (開發中)</h3>
                    </div>
                    <div className="coming-soon">核心系統設定將在後續版本中開放。</div>
                </section>
            </div>

            <style>{`
                .settings-manager { display: flex; flex-direction: column; height: 100%; padding: 0 0 40px; }
                .page-header { padding: 24px 20px; }
                .page-title { font-size: 24px; font-weight: 800; color: white; margin-bottom: 4px; }
                .page-subtitle { font-size: 13px; color: var(--text-secondary); }

                .settings-content { flex: 1; overflow-y: auto; padding: 0 20px; scrollbar-width: none; }
                .settings-content::-webkit-scrollbar { display: none; }

                .settings-section { margin-bottom: 40px; }
                .section-group-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; color: white; }
                .section-group-header h3 { font-size: 16px; font-weight: 700; }
                .header-icon { color: var(--primary); }

                .settings-section.disabled { opacity: 0.5; pointer-events: none; }
                .coming-soon { background-color: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border); font-size: 13px; color: var(--text-secondary); text-align: center; }
            `}</style>
        </div>
    );
};

export default SettingsManager;
