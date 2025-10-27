import { LitElement, html, css } from 'lit';
import './photo-card.js';

export class PhotoGallery extends LitElement {
  static properties = {
    channel: { type: Object },
    photos: { type: Array },
    visiblePhotos: { type: Array },
    page: { type: Number },
    pageSize: { type: Number },
    reactions: { type: Object },
    view: { type: String },         // 'grid' | 'slide'
    index: { type: Number }         // current slide index
  };

  static styles = css`
    :host { display: block }
    header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; position: sticky; top: 0; background: inherit; backdrop-filter: blur(6px); }
    .grid { display: grid; gap: 12px; padding: 0 16px 16px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
    .toolbar { display: flex; gap: 8px; }
    .toolbar button { border: 0; border-radius: 8px; padding: 6px 10px; background: #eee; cursor: pointer; }
    @media (prefers-color-scheme: dark) { .toolbar button { background: #2a2a2a; color: #f1f1f1; } }
    .slide { padding: 12px 16px; display: grid; gap: 12px; max-width: 900px; margin: 0 auto; }
    .slide img { width: 100%; height: auto; border-radius: 12px; object-fit: cover; }
    .nav { display: flex; justify-content: space-between; gap: 8px; }
  `;

  constructor() {
    super();
    this.channel = null;
    this.photos = [];
    this.visiblePhotos = [];
    this.page = 0;
    this.pageSize = 12;
    this.reactions = this.#loadReactions();
    this.view = 'grid';
    this.index = 0;
  }

  async firstUpdated() {
    const res = await fetch('/api/photos.json');
    const data = await res.json();
    this.channel = data.channel;
    this.photos = data.photos || [];
    this.#appendPage();
    this.#createSentinel();
    this.addEventListener('keydown', (e) => {
      if (this.view !== 'slide') return;
      if (e.key === 'ArrowRight') this.#next();
      if (e.key === 'ArrowLeft') this.#prev();
    });
  }

  render() {
    return html`
      <header>
        <h3 style="margin:0">${this.channel?.name || 'Gallery'}</h3>
        <div class="toolbar">
          <button @click=${() => this.view='grid'} aria-pressed=${this.view==='grid'}>Grid</button>
          <button @click=${() => this.view='slide'} aria-pressed=${this.view==='slide'}>Slideshow</button>
        </div>
      </header>

      ${this.view === 'grid' ? html`
        <div class="grid">
          ${this.visiblePhotos.map(p => html`
            <photo-card
              .photo=${p}
              .reaction=${this.reactions[p.id] || null}
              @react=${(e) => this.#setReaction(e.detail.id, e.detail.value)}
              @share=${(e) => this.#sharePhoto(e.detail.photo)}>
            </photo-card>
          `)}
        </div>
        <div id="sentinel" style="height:1px"></div>
      ` : html`
        ${this.photos.length ? html`
          <div class="slide">
            <img loading="lazy" src=${this.photos[this.index].fullSrc} alt=${this.photos[this.index].name} />
            <photo-card
              .photo=${this.photos[this.index]}
              .reaction=${this.reactions[this.photos[this.index].id] || null}
              @react=${(e) => this.#setReaction(e.detail.id, e.detail.value)}
              @share=${(e) => this.#sharePhoto(e.detail.photo)}>
            </photo-card>
            <div class="nav">
              <button class="toolbar" @click=${this.#prev}>⟵ Prev</button>
              <div>${this.index + 1} / ${this.photos.length}</div>
              <button class="toolbar" @click=${this.#next}>Next ⟶</button>
            </div>
          </div>
        ` : html`<p style="padding:16px">Loading…</p>`}
      `}
    `;
  }

  #appendPage() {
    const start = this.page * this.pageSize;
    const next = this.photos.slice(start, start + this.pageSize);
    if (next.length) {
      this.visiblePhotos = [...this.visiblePhotos, ...next];
      this.page++;
    }
  }

  #createSentinel() {
    const target = this.renderRoot.querySelector('#sentinel');
    if (!target) return;
    this._io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && this.#appendPage());
    }, { root: null, rootMargin: '200px', threshold: 0 });
    this._io.observe(target);
  }

  #loadReactions() {
    try { return JSON.parse(localStorage.getItem('photo-reactions') || '{}'); }
    catch { return {}; }
  }

  #saveReactions() {
    localStorage.setItem('photo-reactions', JSON.stringify(this.reactions));
  }

  #setReaction(id, value) {
    this.reactions = { ...this.reactions, [id]: value };
    this.#saveReactions();
    this.requestUpdate();
  }

  async #sharePhoto(photo) {
    const shareData = {
      title: photo.name,
      text: `${photo.name} — ${this.channel?.name || ''}`,
      url: window.location.origin + photo.fullSrc
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch(e) {}
    } else {
      await navigator.clipboard.writeText(shareData.url);
      alert('Link copied!');
    }
  }

  #next = () => { this.index = (this.index + 1) % Math.max(this.photos.length, 1); }
  #prev = () => { this.index = (this.index - 1 + Math.max(this.photos.length, 1)) % Math.max(this.photos.length, 1); }
}

customElements.define('photo-gallery', PhotoGallery);
