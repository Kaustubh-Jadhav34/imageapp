import { LitElement, html, css } from 'lit';
import './photo-card.js';

export class PhotoGallery extends LitElement {
  static properties = {
    channel: { type: Object },
    photos: { type: Array },
    visiblePhotos: { type: Array },
    page: { type: Number },
    pageSize: { type: Number },
    reactions: { type: Object }
  };

  static styles = css`
    :host { display:block; padding:16px }
    header { margin-bottom:10px }
    .grid { display:grid; gap:12px; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)) }
  `;

  constructor() {
    super();
    this.channel = null;
    this.photos = [];
    this.visiblePhotos = [];
    this.page = 0;
    this.pageSize = 12;
    this.reactions = this.#loadReactions();
  }

  async firstUpdated() {
    const res = await fetch('/api/photos.json');
    const data = await res.json();
    this.channel = data.channel;
    this.photos = data.photos || [];
    this.#appendPage();
    this.#createSentinel();
  }

  render() {
    return html`
      <header><h2>${this.channel?.name || 'Gallery'}</h2></header>
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
    this._io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && this.#appendPage());
    }, { root: null, rootMargin: '200px', threshold: 0 });
    this._io.observe(target);
  }

  #loadReactions() {
    try {
      return JSON.parse(localStorage.getItem('photo-reactions') || '{}');
    } catch { return {}; }
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
}
customElements.define('photo-gallery', PhotoGallery);
