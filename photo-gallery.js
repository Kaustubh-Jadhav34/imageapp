/**
 * Copyright 2025 Kaustubh-Jadhav34
 * @license Apache-2.0, see LICENSE for full text.
 */
import { LitElement, html, css } from "lit";

/**
 * `photo-gallery`
 * 
 * @demo index.html
 * @element photo-gallery
 */
export class PhotoGallery extends LitElement {

  static get tag() {
    return "photo-gallery";
  }

  constructor() {
    super();
    this.title = "";
  }

  // Lit reactive properties
  static get properties() {
    return {
      title: { type: String },
    };
  }

  // Lit scoped styles
  static get styles() {
    return [
    css`
      :host {
        display: block;
      }
    `];
  }

  // Lit render the HTML
  render() {
    return html`
  <slot></slot>
  `;
  }

}

globalThis.customElements.define(PhotoGallery.tag, PhotoGallery);