/**
 * @file Functions for applying UI transformations to video elements.
 */

/**
 * Hides a video element by replacing it with a placeholder.
 * @param {HTMLElement} element - The video element to hide.
 */
export const hideVideo = (element) => {
  const placeholder = document.createElement('div');
  placeholder.className = 'hidden-video-placeholder';
  placeholder.innerHTML = `
    <div class="message">Video hidden for your child.</div>
    <button class="reveal-button">Reveal</button>
  `;

  const originalDisplay = element.style.display;
  element.style.display = 'none';
  element.parentNode.insertBefore(placeholder, element);

  const revealButton = placeholder.querySelector('.reveal-button');
  revealButton.addEventListener('click', () => {
    element.style.display = originalDisplay;
    placeholder.remove();
  });
};

/**
 * Blurs a video element.
 * @param {HTMLElement} element - The video element to blur.
 */
export const blurVideo = (element) => {
  element.classList.add('blurred-video');
};

/**
 * Collapses a video element.
 * @param {HTMLElement} element - The video element to collapse.
 */
export const collapseVideo = (element) => {
  element.classList.add('collapsed-video');
};
