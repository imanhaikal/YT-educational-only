/**
 * @file Functions for applying UI transformations to video elements.
 */

/**
 * Hides a video element by replacing it with a placeholder.
 * @param {HTMLElement} element - The video element to hide.
 */
export const hideVideo = (element) => {
  const placeholder = document.createElement('div');
  placeholder.className = 'placeholder';
  placeholder.innerHTML = `
    <div class="placeholder-content">
      <p>Video hidden by Kid-Filter</p>
      <button class="reveal-button">Reveal</button>
    </div>
  `;

  element.innerHTML = '';
  element.appendChild(placeholder);
};
