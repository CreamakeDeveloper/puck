import React from "react";
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
    <div className={getClassName("commandPalette")} style={{ width: 420 }}>
      <div className={getClassName("commandPaletteHeader")}> 
        <div className={getClassName("sectionHeader")}>
          <span>SEO Ayarları</span>
        </div>
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button 
            type="button" 
            className={getClassName("commandItem")} 
            onClick={() => setSeoActiveTab('general')} 
            style={{
              padding:'8px 10px', 
              borderRadius:6, 
              border: seoActiveTab==='general' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', 
              background: seoActiveTab==='general' ? 'var(--puck-color-grey-11)' : 'transparent'
            }}
          >
            Genel
          </button>
          <button 
            type="button" 
            className={getClassName("commandItem")} 
            onClick={() => setSeoActiveTab('jsonld')} 
            style={{
              padding:'8px 10px', 
              borderRadius:6, 
              border: seoActiveTab==='jsonld' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', 
              background: seoActiveTab==='jsonld' ? 'var(--puck-color-grey-11)' : 'transparent'
            }}
          >
            JSON-LD
          </button>
          <button 
            type="button" 
            className={getClassName("commandItem")} 
            onClick={() => setSeoActiveTab('opengraph')} 
            style={{
              padding:'8px 10px', 
              borderRadius:6, 
              border: seoActiveTab==='opengraph' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', 
              background: seoActiveTab==='opengraph' ? 'var(--puck-color-grey-11)' : 'transparent'
            }}
          >
            Open Graph
          </button>
          <button 
            type="button" 
            className={getClassName("commandItem")} 
            onClick={() => setSeoActiveTab('preview')} 
            style={{
              padding:'8px 10px', 
              borderRadius:6, 
              border: seoActiveTab==='preview' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', 
              background: seoActiveTab==='preview' ? 'var(--puck-color-grey-11)' : 'transparent'
            }}
          >
            Önizleme
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
              <select
                value={seoRobots}
                onChange={(e) => updateSeoField('robots', e.target.value)}
                className={getClassName("input")}
              >
                <option value="index">index</option>
                <option value="noindex">noindex</option>
                <option value="follow">follow</option>
                <option value="nofollow">nofollow</option>
              </select>
            </div>
          </>
        )}

        <div className={getClassName("formGroup")}>
          <label>Canonical (opsiyonel)</label>
          <input
            type="text"
            value={seoCanonical}
            onChange={(e) => updateSeoField('canonical', e.target.value)}
            className={getClassName("input")}
          />
        </div>

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