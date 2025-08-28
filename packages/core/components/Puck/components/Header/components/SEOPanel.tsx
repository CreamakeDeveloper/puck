import React from "react";
import { Settings, Code, Share2, Eye } from "lucide-react";
import { getClassNameFactory } from "../../../../../lib";
import styles from "../styles.module.css";

const getClassName = getClassNameFactory("PuckHeader", styles);

interface SEOPanelProps {
  seoOpen: boolean;
  seoActiveTab: 'general' | 'jsonld' | 'opengraph' | 'preview';
  setSeoActiveTab: (tab: 'general' | 'jsonld' | 'opengraph' | 'preview') => void;
  seoTitle: string;
  seoDescription: string;
  seoCanonical: string;
  seoRobots: string;
  seoJsonLd: string;
  seoOgTitle: string;
  seoOgDescription: string;
  seoOgImage: string;
  seoOgType: string;
  seoOgUrl: string;
  rootTitle: string;
  updateSeoField: (field: string, value: string) => void;
  updateOpenGraphField: (field: string, value: string) => void;
}

export const SEOPanel: React.FC<SEOPanelProps> = ({
  seoOpen,
  seoActiveTab,
  setSeoActiveTab,
  seoTitle,
  seoDescription,
  seoCanonical,
  seoRobots,
  seoJsonLd,
  seoOgTitle,
  seoOgDescription,
  seoOgImage,
  seoOgType,
  seoOgUrl,
  rootTitle,
  updateSeoField,
  updateOpenGraphField,
}) => {
  if (!seoOpen) return null;

  return (
    <div className={`${getClassName("commandPalette")} ${getClassName("seoPalette")}`}>
      <div className={getClassName("commandPaletteHeader")}> 
        <div className={getClassName("sectionHeader")}>
          <span>SEO Ayarları</span>
        </div>
        <div className={getClassName("seoTabs")}> 
          <button 
            type="button" 
            className={getClassName("commandItem")} 
            onClick={() => setSeoActiveTab('general')} 
            style={{
              padding:'8px 10px', 
              borderRadius:6, 
              border: seoActiveTab==='general' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', 
              background: seoActiveTab==='general' ? 'var(--puck-color-grey-11)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Settings size={14} />
            <span className={getClassName("seoTabText")}>Genel</span>
          </button>
          <button 
            type="button" 
            className={getClassName("commandItem")} 
            onClick={() => setSeoActiveTab('jsonld')} 
            style={{
              padding:'8px 10px', 
              borderRadius:6, 
              border: seoActiveTab==='jsonld' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', 
              background: seoActiveTab==='jsonld' ? 'var(--puck-color-grey-11)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Code size={14} />
            <span className={getClassName("seoTabText")}>JSON-LD</span>
          </button>
          <button 
            type="button" 
            className={getClassName("commandItem")} 
            onClick={() => setSeoActiveTab('opengraph')} 
            style={{
              padding:'8px 10px', 
              borderRadius:6, 
              border: seoActiveTab==='opengraph' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', 
              background: seoActiveTab==='opengraph' ? 'var(--puck-color-grey-11)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Share2 size={14} />
            <span className={getClassName("seoTabText")}>Open Graph</span>
          </button>
          <button 
            type="button" 
            className={getClassName("commandItem")} 
            onClick={() => setSeoActiveTab('preview')} 
            style={{
              padding:'8px 10px', 
              borderRadius:6, 
              border: seoActiveTab==='preview' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', 
              background: seoActiveTab==='preview' ? 'var(--puck-color-grey-11)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={14} />
            <span className={getClassName("seoTabText")}>Önizleme</span>
          </button>
        </div>
      </div>
      
      <div className={getClassName("commandList")}>
        {seoActiveTab === 'general' && (
          <>
            <div className={getClassName("formGroup")}>
              <label>Meta Başlık</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => updateSeoField('title', e.target.value)}
                className={getClassName("input")}
              />
            </div>
            <div className={getClassName("formGroup")}>
              <label>Meta Açıklama</label>
              <textarea
                value={seoDescription}
                onChange={(e) => updateSeoField('description', e.target.value)}
                className={getClassName("textarea")}
                rows={3}
              />
            </div>
            <div className={getClassName("formGroup")}>
              <label>Robots</label>
              <div style={{
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px', 
                marginTop: '8px'
              }}>
                <label style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '14px',
                  padding: '8px',
                  border: '1px solid var(--puck-color-grey-09)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: seoRobots.split(',').some(r => r.trim() === 'index') ? 'var(--puck-color-grey-11)' : 'transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={seoRobots.split(',').some(r => r.trim() === 'index')}
                    onChange={(e) => {
                      let newRobots = seoRobots.split(',').filter(r => r.trim() !== 'index' && r.trim() !== 'noindex');
                      if (e.target.checked) {
                        newRobots.push('index');
                      }
                      updateSeoField('robots', newRobots.filter(r => r.trim() !== '').join(','));
                    }}
                    style={{
                      margin: 0,
                      accentColor: '#fac101'
                    }}
                  />
                  <span>Index</span>
                </label>
                
                <label style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '14px',
                  padding: '8px',
                  border: '1px solid var(--puck-color-grey-09)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: seoRobots.split(',').some(r => r.trim() === 'noindex') ? 'var(--puck-color-grey-11)' : 'transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={seoRobots.split(',').some(r => r.trim() === 'noindex')}
                    onChange={(e) => {
                      let newRobots = seoRobots.split(',').filter(r => r.trim() !== 'index' && r.trim() !== 'noindex');
                      if (e.target.checked) {
                        newRobots.push('noindex');
                      }
                      updateSeoField('robots', newRobots.filter(r => r.trim() !== '').join(','));
                    }}
                    style={{
                      margin: 0,
                      accentColor: '#fac101'
                    }}
                  />
                  <span>No Index</span>
                </label>
                
                <label style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '14px',
                  padding: '8px',
                  border: '1px solid var(--puck-color-grey-09)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: seoRobots.split(',').some(r => r.trim() === 'follow') ? 'var(--puck-color-grey-11)' : 'transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={seoRobots.split(',').some(r => r.trim() === 'follow')}
                    onChange={(e) => {
                      let newRobots = seoRobots.split(',').filter(r => r.trim() !== 'follow' && r.trim() !== 'nofollow');
                      if (e.target.checked) {
                        newRobots.push('follow');
                      }
                      updateSeoField('robots', newRobots.filter(r => r.trim() !== '').join(','));
                    }}
                    style={{
                      margin: 0,
                      accentColor: '#fac101'
                    }}
                  />
                  <span>Follow</span>
                </label>
                
                <label style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '14px',
                  padding: '8px',
                  border: '1px solid var(--puck-color-grey-09)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: seoRobots.split(',').some(r => r.trim() === 'nofollow') ? 'var(--puck-color-grey-11)' : 'transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={seoRobots.split(',').some(r => r.trim() === 'nofollow')}
                    onChange={(e) => {
                      let newRobots = seoRobots.split(',').filter(r => r.trim() !== 'follow' && r.trim() !== 'nofollow');
                      if (e.target.checked) {
                        newRobots.push('nofollow');
                      }
                      updateSeoField('robots', newRobots.filter(r => r.trim() !== '').join(','));
                    }}
                    style={{
                      margin: 0,
                      accentColor: '#fac101'
                    }}
                  />
                  <span>No Follow</span>
                </label>
              </div>
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: 'var(--puck-color-grey-11)',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--puck-color-grey-03)'
              }}>
                <strong>Robots:</strong> {seoRobots || 'Hiçbir seçim yapılmadı'}
              </div>
            </div>
            <div className={getClassName("formGroup")}>
              <label>Canonical (opsiyonel)</label>
              <input
                type="text"
                value={seoCanonical}
                onChange={(e) => updateSeoField('canonical', e.target.value)}
                className={getClassName("input")}
              />
            </div>
          </>
        )}

        {seoActiveTab === 'jsonld' && (
          <div className={getClassName("formGroup")}>
            <label>JSON-LD (opsiyonel)</label>
            <textarea
              value={seoJsonLd}
              onChange={(e) => updateSeoField('jsonLd', e.target.value)}
              className={getClassName("textarea")}
              rows={4}
              placeholder="JSON-LD (örnek: https://schema.org)"
            />
          </div>
        )}

        {seoActiveTab === 'opengraph' && (
          <>
            <div className={getClassName("formGroup")}>
              <label>Open Graph Başlık (opsiyonel)</label>
              <input
                type="text"
                value={seoOgTitle}
                onChange={(e) => updateOpenGraphField('title', e.target.value)}
                className={getClassName("input")}
              />
            </div>
            <div className={getClassName("formGroup")}>
              <label>Open Graph Açıklama (opsiyonel)</label>
              <textarea
                value={seoOgDescription}
                onChange={(e) => updateOpenGraphField('description', e.target.value)}
                className={getClassName("textarea")}
                rows={3}
              />
            </div>
            <div className={getClassName("formGroup")}>
              <label>Open Graph Görsel URL (opsiyonel)</label>
              <input
                type="text"
                value={seoOgImage}
                onChange={(e) => updateOpenGraphField('image', e.target.value)}
                className={getClassName("input")}
              />
            </div>
            <div className={getClassName("formGroup")}>
              <label>Open Graph Türü (opsiyonel)</label>
              <input
                type="text"
                value={seoOgType}
                onChange={(e) => updateOpenGraphField('type', e.target.value)}
                className={getClassName("input")}
                placeholder="website, article vb."
              />
            </div>
            <div className={getClassName("formGroup")}>
              <label>Open Graph URL (opsiyonel)</label>
              <input
                type="text"
                value={seoOgUrl}
                onChange={(e) => updateOpenGraphField('url', e.target.value)}
                className={getClassName("input")}
              />
            </div>
          </>
        )}

        {seoActiveTab === 'preview' && (
          <div className={getClassName("formGroup")}>
            <label>Google Önizleme</label>
            <div style={{padding: '12px', border:'1px solid var(--puck-color-grey-09)', borderRadius:8}}>
              <div style={{color:'#1a0dab', fontSize:16, lineHeight:1.3, marginBottom:2}}>
                {seoTitle || rootTitle || 'Sayfa Başlığı'}
              </div>
              <div style={{color:'#006621', fontSize:12, marginBottom:4}}>
                {seoCanonical || 'https://www.ornek.com/ornek-sayfa'}
              </div>
              <div style={{color:'#545454', fontSize:13}}>
                {seoDescription || 'Bu alan arama sonuçlarında görünecek açıklamayı temsil eder.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};