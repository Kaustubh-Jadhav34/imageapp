import { LitElement, html, css } from 'lit';

export class PhotoCard extends LitElement {
  static properties = {
    photo: { type: Object },
    reaction: { type: String }
  };

  static styles = css`
    :host { display: block }
    .card { border-radius: 12px; overflow: hidden; background: var(--card-bg, #fff); color: var(--card-fg, #111); box-shadow: 0 4px 12px rgba(0,0,0,.08) }
    .img { aspect-ratio: 1 / 1; overflow: hidden; }
    .img img { width: 100%; height: 100%; object-fit: cover; }
    .meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px; }
    .left { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    .actions { display: flex; gap: 8px; }
    button { border: 0; border-radius: 8px; padding: 6px 8px; cursor: pointer; background: #eee; }
    @media (prefers-color-scheme: dark) {
      .card { background: #1b1b1b; color: #f1f1f1; }
      button { background: #2a2a2a; color: #f1f1f1; }
    }
  `;

  render() {
    const p = this.photo || {};
    return html`
      <div class="card">
        <div class="img">
          <img
            loading="lazy"
            src=${p.thumbSrc}
            alt=${p.name}
            @click=${() => window.open(p.fullSrc, '_blank', 'noopener')}
          />
        </div>
        <div class="meta">
          <div class="left">
            <img class="avatar" src=${p.author?.image || ''} alt=${p.author?.name || ''} />
            <div>
              <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${p.name}</div>
              <div style="font-size:12px; opacity:.7">${p.dateTaken}</div>
            </div>
          </div>
          <div class="actions">
            <button aria-pressed=${this.reaction==='like'} @click=${() => this.#emitReact('like')}>👍</button>
            <button aria-pressed=${this.reaction==='dislike'} @click=${() => this.#emitReact('dislike')}>👎</button>
            <button @click=${() => this.#emitShare()}>↗</button>
          </div>
        </div>
      </div>
    `;
  }

  #emitReact(value) {
    const id = this.photo?.id;
    this.dispatchEvent(new CustomEvent('react', { detail: { id, value }, bubbles: true, composed: true }));
  }

  #emitShare() {
    this.dispatchEvent(new CustomEvent('share', { detail: { photo: this.photo }, bubbles: true, composed: true }));
  }
}

customElements.define('photo-card', PhotoCard);
