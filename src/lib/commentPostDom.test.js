/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it } from 'vitest';
import { findCommentSubmitButton } from './commentPostDom.js';

function markVisible(root) {
  for (const el of root.querySelectorAll('*')) {
    Object.defineProperty(el, 'getClientRects', {
      configurable: true,
      value: () => [{ width: 120, height: 32 }]
    });
  }
}

describe('findCommentSubmitButton', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('同じ comment スコープ内の text-only button を拾う', () => {
    document.body.innerHTML = `
      <div class="comment-panel">
        <textarea id="comment-editor" placeholder="コメントを入力"></textarea>
        <div class="actions">
          <button type="button">コメントを送信</button>
          <button type="button">スクショ</button>
        </div>
      </div>
    `;
    markVisible(document.body);

    const editor = /** @type {HTMLElement} */ (document.getElementById('comment-editor'));
    const panel = /** @type {HTMLElement} */ (document.querySelector('.comment-panel'));
    const button = findCommentSubmitButton(panel, editor);

    expect(button?.textContent?.trim()).toBe('コメントを送信');
  });

  it('同一フォームを優先し、別フォームの generic submit を避ける', () => {
    document.body.innerHTML = `
      <form id="search-form">
        <input type="text" />
        <button type="submit">検索</button>
      </form>
      <form id="comment-form" class="comment-form">
        <textarea id="comment-editor" name="comment"></textarea>
        <button type="submit">送信</button>
      </form>
    `;
    markVisible(document.body);

    const editor = /** @type {HTMLElement} */ (document.getElementById('comment-editor'));
    const form = /** @type {HTMLElement} */ (document.getElementById('comment-form'));
    const button = findCommentSubmitButton(form, editor);

    expect(button?.textContent?.trim()).toBe('送信');
  });

  it('再読み込みなどの非送信ボタンは除外する', () => {
    document.body.innerHTML = `
      <div class="comment-panel">
        <textarea id="comment-editor" placeholder="コメントを入力"></textarea>
        <button type="button" aria-label="再読み込み">↻</button>
        <button type="button" id="send-actual" data-testid="comment-post-action">投稿</button>
      </div>
    `;
    markVisible(document.body);

    const editor = /** @type {HTMLElement} */ (document.getElementById('comment-editor'));
    const panel = /** @type {HTMLElement} */ (document.querySelector('.comment-panel'));
    const button = findCommentSubmitButton(panel, editor);

    expect(button?.id).toBe('send-actual');
  });
});
